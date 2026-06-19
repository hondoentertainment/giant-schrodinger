import { supabase, isBackendEnabled } from '../lib/supabase';

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function isRpcUnavailable(error) {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === 'PGRST202'
        || message.includes('could not find the function')
        || message.includes('does not exist');
}

async function callRpc(name, params) {
    const { data, error } = await supabase.rpc(name, params);
    if (error) throw error;
    return data;
}

function buildFallbackSession({ playerName, isHost }) {
    return {
        hostToken: null,
        playerToken: null,
        playerName,
        playerId: null,
        isHost,
        secureMode: false,
    };
}

function normalizeRoomSession(data) {
    if (!data?.room) return null;
    return {
        room: data.room,
        session: {
            hostToken: data.session?.hostToken || null,
            playerToken: data.session?.playerToken || null,
            playerName: data.session?.playerName || null,
            playerId: data.session?.playerId || null,
            isHost: Boolean(data.session?.isHost),
            secureMode: data.session?.secureMode !== false,
        },
    };
}

export async function createRoom({ hostName, themeId, totalRounds, scoringMode, avatar }) {
    if (!isBackendEnabled()) return null;
    try {
        const rpcData = await callRpc('create_room_session', {
            p_host_name: hostName,
            p_theme_id: themeId || 'neon',
            p_total_rounds: totalRounds || 3,
            p_scoring_mode: scoringMode || 'ai',
            p_avatar: avatar || null,
        });
        const normalized = normalizeRoomSession(rpcData);
        if (normalized) return normalized;
    } catch (err) {
        if (!isRpcUnavailable(err)) {
            console.warn('createRoom failed:', err);
            return null;
        }
    }

    try {
        const code = generateRoomCode();
        const { data, error } = await supabase
            .from('rooms')
            .insert({
                code,
                host_name: hostName,
                theme_id: themeId || 'neon',
                total_rounds: totalRounds || 3,
                scoring_mode: scoringMode || 'ai',
                status: 'waiting',
                round_number: 1,
            })
            .select()
            .single();
        if (error) throw error;

        await supabase.from('room_players').insert({
            room_id: data.id,
            player_name: hostName,
            avatar: avatar || null,
            is_host: true,
        });

        return {
            room: data,
            session: buildFallbackSession({ playerName: hostName, isHost: true }),
        };
    } catch (err) {
        console.warn('createRoom failed:', err);
        return null;
    }
}

export async function joinRoom(code, playerName, avatar) {
    if (!isBackendEnabled()) return null;
    try {
        const rpcData = await callRpc('join_room_session', {
            p_code: code.toUpperCase().trim(),
            p_player_name: playerName,
            p_avatar: avatar || null,
        });
        const normalized = normalizeRoomSession(rpcData);
        if (normalized) return normalized;
    } catch (err) {
        if (!isRpcUnavailable(err)) {
            console.warn('joinRoom failed:', err);
            return { error: err.message || 'Failed to join room' };
        }
    }

    try {
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();
        if (roomError || !room) return { error: 'Room not found' };
        if (room.status !== 'waiting') return { error: 'Game already in progress' };

        const { data: existing } = await supabase
            .from('room_players')
            .select('id')
            .eq('room_id', room.id)
            .eq('player_name', playerName)
            .single();

        if (existing) return { error: 'Name already taken in this room' };

        const { error: playerError } = await supabase
            .from('room_players')
            .insert({
                room_id: room.id,
                player_name: playerName,
                avatar: avatar || null,
                is_host: false,
            });
        if (playerError) throw playerError;

        return {
            room,
            session: buildFallbackSession({ playerName, isHost: false }),
        };
    } catch (err) {
        console.warn('joinRoom failed:', err);
        return { error: 'Failed to join room' };
    }
}

export async function getRoomByCode(code) {
    if (!isBackendEnabled()) return null;
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();
        if (error || !data) return null;
        return data;
    } catch {
        return null;
    }
}

export async function getRoomPlayers(roomId) {
    if (!isBackendEnabled()) return [];
    try {
        const { data, error } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomId)
            .order('joined_at', { ascending: true });
        if (error) return [];
        return data || [];
    } catch {
        return [];
    }
}

export async function leaveRoom(roomId, playerName, auth = {}) {
    if (!isBackendEnabled()) return false;
    if (auth?.playerToken) {
        try {
            const data = await callRpc('leave_room_session', {
                p_room_id: roomId,
                p_player_token: auth.playerToken,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('leaveRoom failed:', err);
                return false;
            }
        }
    }

    try {
        await supabase
            .from('room_players')
            .delete()
            .eq('room_id', roomId)
            .eq('player_name', playerName);
        return true;
    } catch (err) {
        console.warn('leaveRoom failed:', err);
        return false;
    }
}

export async function startRound(roomId, roundNumber, assets, auth = {}) {
    if (!isBackendEnabled()) return false;
    if (auth?.hostToken) {
        try {
            const data = await callRpc('start_room_round', {
                p_room_id: roomId,
                p_host_token: auth.hostToken,
                p_round_number: roundNumber,
                p_assets: assets,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('startRound failed:', err);
                return false;
            }
        }
    }

    try {
        const { error } = await supabase
            .from('rooms')
            .update({
                status: 'playing',
                round_number: roundNumber,
                assets,
            })
            .eq('id', roomId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('startRound failed:', err);
        return false;
    }
}

export async function setRoomStatus(roomId, status, auth = {}) {
    if (!isBackendEnabled()) return false;
    if (auth?.hostToken) {
        try {
            const data = await callRpc('set_room_status_secure', {
                p_room_id: roomId,
                p_host_token: auth.hostToken,
                p_status: status,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('setRoomStatus failed:', err);
                return false;
            }
        }
    }

    try {
        const { error } = await supabase
            .from('rooms')
            .update({ status })
            .eq('id', roomId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('setRoomStatus failed:', err);
        return false;
    }
}

export async function submitAnswer(roomId, roundNumber, playerName, submission, auth = {}) {
    if (!isBackendEnabled()) return false;
    if (auth?.playerToken) {
        try {
            const data = await callRpc('submit_room_answer', {
                p_room_id: roomId,
                p_round_number: roundNumber,
                p_player_token: auth.playerToken,
                p_submission: submission,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('submitAnswer failed:', err);
                return false;
            }
        }
    }

    try {
        const { error } = await supabase
            .from('room_submissions')
            .upsert(
                {
                    room_id: roomId,
                    round_number: roundNumber,
                    player_name: playerName,
                    submission,
                },
                { onConflict: 'room_id,round_number,player_name' }
            );
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('submitAnswer failed:', err);
        return false;
    }
}

export async function getRoundSubmissions(roomId, roundNumber) {
    if (!isBackendEnabled()) return [];
    try {
        const { data, error } = await supabase
            .from('room_submissions')
            .select('*')
            .eq('room_id', roomId)
            .eq('round_number', roundNumber)
            .order('submitted_at', { ascending: true });
        if (error) return [];
        return data || [];
    } catch {
        return [];
    }
}

export async function getRoomSubmissions(roomId) {
    if (!isBackendEnabled()) return [];
    try {
        const { data, error } = await supabase
            .from('room_submissions')
            .select('*')
            .eq('room_id', roomId)
            .order('round_number', { ascending: true })
            .order('submitted_at', { ascending: true });
        if (error) return [];
        return data || [];
    } catch {
        return [];
    }
}

export async function getRoundVotes(roomId, roundNumber) {
    if (!isBackendEnabled()) return [];
    try {
        const { data, error } = await supabase
            .from('room_votes')
            .select('*')
            .eq('room_id', roomId)
            .eq('round_number', roundNumber)
            .order('created_at', { ascending: true });
        if (error) return [];
        return data || [];
    } catch {
        return [];
    }
}

export async function updateSubmissionScore(submissionId, score, auth = {}) {
    if (!isBackendEnabled()) return false;
    if (auth?.hostToken) {
        try {
            const data = await callRpc('score_room_submission', {
                p_submission_id: submissionId,
                p_host_token: auth.hostToken,
                p_score: score,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('updateSubmissionScore failed:', err);
                return false;
            }
        }
    }

    try {
        const { error } = await supabase
            .from('room_submissions')
            .update({ score })
            .eq('id', submissionId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('updateSubmissionScore failed:', err);
        return false;
    }
}

export async function castVote(roomId, roundNumber, submissionId, auth = {}) {
    if (!isBackendEnabled()) return { ok: false, error: 'Backend unavailable' };
    if (auth?.playerToken) {
        try {
            const data = await callRpc('cast_room_vote', {
                p_room_id: roomId,
                p_round_number: roundNumber,
                p_player_token: auth.playerToken,
                p_submission_id: submissionId,
            });
            return { ok: Boolean(data?.ok), data };
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('castVote failed:', err);
                return { ok: false, error: err.message || 'Failed to record vote' };
            }
        }
    }

    if (!auth?.playerName) {
        return { ok: false, error: 'Player session missing' };
    }

    try {
        const { data, error } = await supabase
            .from('room_votes')
            .insert({
                room_id: roomId,
                round_number: roundNumber,
                voter_name: auth.playerName,
                submission_id: submissionId,
            })
            .select('id')
            .single();
        if (error) throw error;
        return { ok: Boolean(data?.id), data };
    } catch (err) {
        console.warn('castVote failed:', err);
        return { ok: false, error: 'Failed to record vote' };
    }
}

export async function finalizeRoomVoting(roomId, roundNumber, auth = {}) {
    if (!isBackendEnabled()) return { ok: false, error: 'Backend unavailable' };
    if (auth?.hostToken) {
        try {
            const data = await callRpc('finalize_room_votes', {
                p_room_id: roomId,
                p_round_number: roundNumber,
                p_host_token: auth.hostToken,
            });
            return { ok: Boolean(data?.ok), data };
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('finalizeRoomVoting failed:', err);
                return { ok: false, error: err.message || 'Failed to finalize votes' };
            }
        }
    }

    return { ok: false, error: 'Secure voting RPC is not available' };
}

export async function advanceRoom(roomId, auth = {}) {
    if (!isBackendEnabled()) return { ok: false, error: 'Backend unavailable' };
    if (auth?.hostToken) {
        try {
            const data = await callRpc('advance_room_state', {
                p_room_id: roomId,
                p_host_token: auth.hostToken,
            });
            return { ok: Boolean(data?.ok), data };
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('advanceRoom failed:', err);
                return { ok: false, error: err.message || 'Failed to advance room' };
            }
        }
    }

    return { ok: false, error: 'Secure advance RPC is not available' };
}

export function subscribeToRoom(roomId, callbacks) {
    if (!isBackendEnabled() || !supabase) return null;

    const channel = supabase.channel(`room:${roomId}`);

    channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => callbacks.onRoomUpdate?.(payload.new)
    );

    channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => callbacks.onPlayerJoin?.(payload.new)
    );
    channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => callbacks.onPlayerLeave?.(payload.old)
    );

    channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_submissions', filter: `room_id=eq.${roomId}` },
        (payload) => callbacks.onSubmission?.(payload.new)
    );
    channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_submissions', filter: `room_id=eq.${roomId}` },
        (payload) => callbacks.onSubmissionUpdate?.(payload.new)
    );

    channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_votes', filter: `room_id=eq.${roomId}` },
        (payload) => callbacks.onVote?.(payload.new)
    );

    channel.subscribe((status) => {
        callbacks.onConnectionStatus?.(status);
    });

    return () => {
        supabase.removeChannel(channel);
    };
}

import { supabase, isBackendEnabled } from '../lib/supabase';

// Generate a short room code (6 uppercase alphanumeric characters)
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0/O, 1/I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ============================================================
// Room CRUD
// ============================================================

export async function createRoom({ hostName, themeId, totalRounds, scoringMode }) {
    if (!isBackendEnabled()) return null;
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

        // Also insert the host as a player
        await supabase.from('room_players').insert({
            room_id: data.id,
            player_name: hostName,
            is_host: true,
        });

        return data;
    } catch (err) {
        console.warn('createRoom failed:', err);
        return null;
    }
}

export async function joinRoom(code, playerName, avatar) {
    if (!isBackendEnabled()) return null;
    try {
        // Find the room
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();
        if (roomError || !room) return { error: 'Room not found' };
        if (room.status !== 'waiting') return { error: 'Game already in progress' };

        // Check if player name already exists in room
        const { data: existing } = await supabase
            .from('room_players')
            .select('id')
            .eq('room_id', room.id)
            .eq('player_name', playerName)
            .single();

        if (existing) return { error: 'Name already taken in this room' };

        // Add player
        const { error: playerError } = await supabase
            .from('room_players')
            .insert({
                room_id: room.id,
                player_name: playerName,
                avatar: avatar || null,
                is_host: false,
            });
        if (playerError) throw playerError;

        return { room };
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

export async function leaveRoom(roomId, playerName) {
    if (!isBackendEnabled()) return;
    try {
        await supabase
            .from('room_players')
            .delete()
            .eq('room_id', roomId)
            .eq('player_name', playerName);
    } catch (err) {
        console.warn('leaveRoom failed:', err);
    }
}

// ============================================================
// Room state changes (host only)
// ============================================================

export async function startRound(roomId, roundNumber, assets) {
    if (!isBackendEnabled()) return false;
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

export async function setRoomStatus(roomId, status) {
    if (!isBackendEnabled()) return false;
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

// ============================================================
// Submissions
// ============================================================

export async function submitAnswer(roomId, roundNumber, playerName, submission) {
    if (!isBackendEnabled()) return false;
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

export async function updateSubmissionScore(submissionId, score) {
    if (!isBackendEnabled()) return false;
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

// ============================================================
// Realtime subscriptions
// ============================================================

export function subscribeToRoom(roomId, callbacks) {
    if (!isBackendEnabled() || !supabase) return null;

    const channel = supabase.channel(`room:${roomId}`);

    // Room status changes
    channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => callbacks.onRoomUpdate?.(payload.new)
    );

    // Player joins/leaves
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

    // Submissions
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

    channel.subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

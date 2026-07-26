import { supabase, isBackendEnabled } from '../lib/supabase';

const SHARED_ROUNDS_TABLE = 'shared_rounds';
const JUDGEMENTS_TABLE = 'judgements';
const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{20,120}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function normalizeSharedRound(data) {
    if (!data) return null;
    return {
        id: data.id || null,
        backendId: data.backendId || data.publicToken || data.public_token || data.id || null,
        roundId: data.roundId || data.id || null,
        assets: data.assets,
        submission: data.submission,
        imageUrl: data.imageUrl || data.image_url || null,
        shareFrom: data.shareFrom || data.share_from || null,
        collisionId: data.collisionId || data.collision_id || null,
        judgeMode: data.judgeMode || data.judge_mode || 'friend',
        expiresAt: data.expiresAt || data.expires_at || null,
    };
}

export async function saveSharedRound(round) {
    if (!isBackendEnabled()) return null;
    try {
        const data = await callRpc('create_shared_round', {
            p_assets: round.assets,
            p_submission: round.submission,
            p_image_url: round.imageUrl || null,
            p_share_from: round.shareFrom || null,
            p_collision_id: round.collisionId || null,
            p_judge_mode: round.judgeMode || 'friend',
            p_expires_in_hours: 168,
        });
        return data?.publicToken || data?.public_token || data?.id || null;
    } catch (err) {
        if (!isRpcUnavailable(err)) {
            console.warn('saveSharedRound failed:', err);
            return null;
        }
    }

    try {
        const { data, error } = await supabase
            .from(SHARED_ROUNDS_TABLE)
            .insert({
                assets: round.assets,
                submission: round.submission,
                image_url: round.imageUrl,
                share_from: round.shareFrom,
                collision_id: round.collisionId,
                judge_mode: round.judgeMode || 'friend',
            })
            .select('id')
            .single();
        if (error) throw error;
        return data?.id || null;
    } catch (err) {
        console.warn('saveSharedRound failed:', err);
        return null;
    }
}

export async function getSharedRound(identifier) {
    if (!isBackendEnabled()) return null;
    if (!identifier) return null;

    if (SHARE_TOKEN_REGEX.test(identifier) && !UUID_REGEX.test(identifier)) {
        try {
            const data = await callRpc('get_shared_round_by_token', {
                p_public_token: identifier.trim(),
            });
            return normalizeSharedRound(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('getSharedRound failed:', err);
                return null;
            }
        }
    }

    try {
        const column = UUID_REGEX.test(identifier.trim()) ? 'id' : 'public_token';
        const { data, error } = await supabase
            .from(SHARED_ROUNDS_TABLE)
            .select('*')
            .eq(column, identifier.trim())
            .single();
        if (error || !data) return null;
        return normalizeSharedRound(data);
    } catch (err) {
        console.warn('getSharedRound failed:', err);
        return null;
    }
}

export async function saveJudgementToBackend(roundIdentifier, judgement) {
    if (!isBackendEnabled()) return false;
    if (!roundIdentifier) return false;

    if (SHARE_TOKEN_REGEX.test(roundIdentifier) && !UUID_REGEX.test(roundIdentifier)) {
        try {
            const data = await callRpc('submit_round_judgement', {
                p_public_token: roundIdentifier,
                p_judge_name: judgement.judgeName,
                p_score: judgement.score,
                p_relevance: judgement.relevance,
                p_commentary: judgement.commentary,
            });
            return Boolean(data);
        } catch (err) {
            if (!isRpcUnavailable(err)) {
                console.warn('saveJudgementToBackend failed:', err);
                return false;
            }
        }
    }

    try {
        const { error } = await supabase.from(JUDGEMENTS_TABLE).insert({
            round_id: roundIdentifier,
            judge_name: judgement.judgeName,
            score: judgement.score,
            relevance: judgement.relevance,
            commentary: judgement.commentary,
        });
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('saveJudgementToBackend failed:', err);
        return false;
    }
}

export async function getJudgementForRound(roundId) {
    if (!isBackendEnabled()) return null;
    try {
        const { data, error } = await supabase
            .from(JUDGEMENTS_TABLE)
            .select('*')
            .eq('round_id', roundId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) return null;
        return {
            score: data.score,
            relevance: data.relevance,
            commentary: data.commentary,
            judgeName: data.judge_name,
            createdAt: data.created_at,
        };
    } catch (err) {
        console.warn('getJudgementForRound failed:', err);
        return null;
    }
}

export async function getJudgementsByCollisionIds(collisionIds) {
    if (!isBackendEnabled() || !collisionIds?.length) return {};
    try {
        const { data: rounds } = await supabase
            .from(SHARED_ROUNDS_TABLE)
            .select('id, collision_id')
            .in('collision_id', collisionIds);
        if (!rounds?.length) return {};

        const roundIds = rounds.map((r) => r.id);
        const { data: judgements } = await supabase
            .from(JUDGEMENTS_TABLE)
            .select('round_id, score, relevance, commentary, judge_name, created_at')
            .in('round_id', roundIds)
            .order('created_at', { ascending: false });

        const byRound = {};
        judgements?.forEach((entry) => {
            if (!byRound[entry.round_id]) byRound[entry.round_id] = entry;
        });

        const result = {};
        rounds.forEach((round) => {
            if (byRound[round.id]) {
                result[round.collision_id] = {
                    score: byRound[round.id].score,
                    relevance: byRound[round.id].relevance,
                    commentary: byRound[round.id].commentary,
                    judgeName: byRound[round.id].judge_name,
                    createdAt: byRound[round.id].created_at,
                };
            }
        });
        return result;
    } catch (err) {
        console.warn('getJudgementsByCollisionIds failed:', err);
        return {};
    }
}

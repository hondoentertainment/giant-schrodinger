import { supabase, isBackendEnabled } from '../lib/supabase';

const SHARED_ROUNDS_TABLE = 'shared_rounds';
const JUDGEMENTS_TABLE = 'judgements';

export async function saveSharedRound(round) {
    if (!isBackendEnabled()) return null;
    try {
        const { data, error } = await supabase
            .from(SHARED_ROUNDS_TABLE)
            .insert({
                assets: round.assets,
                submission: round.submission,
                image_url: round.imageUrl,
                share_from: round.shareFrom,
                collision_id: round.collisionId,
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

export async function getSharedRound(id) {
    if (!isBackendEnabled()) return null;
    try {
        const { data, error } = await supabase
            .from(SHARED_ROUNDS_TABLE)
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) return null;
        return {
            id: data.id,
            roundId: data.id,
            assets: data.assets,
            submission: data.submission,
            imageUrl: data.image_url,
            shareFrom: data.share_from,
        };
    } catch (err) {
        console.warn('getSharedRound failed:', err);
        return null;
    }
}

export async function saveJudgementToBackend(roundId, judgement) {
    if (!isBackendEnabled()) return false;
    try {
        const { error } = await supabase.from(JUDGEMENTS_TABLE).insert({
            round_id: roundId,
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
        judgements?.forEach((j) => {
            if (!byRound[j.round_id]) byRound[j.round_id] = j;
        });
        const result = {};
        rounds.forEach((r) => {
            if (byRound[r.id]) {
                result[r.collision_id] = {
                    score: byRound[r.id].score,
                    relevance: byRound[r.id].relevance,
                    commentary: byRound[r.id].commentary,
                    judgeName: byRound[r.id].judge_name,
                    createdAt: byRound[r.id].created_at,
                };
            }
        });
        return result;
    } catch (err) {
        console.warn('getJudgementsByCollisionIds failed:', err);
        return {};
    }
}

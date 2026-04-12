import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    supabase: { from: vi.fn() },
    isBackendEnabled: vi.fn(),
}));

import { supabase, isBackendEnabled } from '../lib/supabase';
import {
    saveSharedRound,
    getSharedRound,
    saveJudgementToBackend,
    getJudgementForRound,
    getJudgementsByCollisionIds,
} from './backend';

/**
 * Builds a fluent mock chain. Methods like insert/select/eq/in/order/limit
 * return `this`. Chains that terminate in `.single()` are resolved via that
 * method's mockResolvedValue. Chains that are awaited directly (no .single())
 * use a thenable so `await chain` resolves to `resolveDirect`.
 */
function chainMock({ single = undefined, resolveDirect = undefined } = {}) {
    const chain = {
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        single: vi.fn(),
    };
    chain.insert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.in.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);

    if (single !== undefined) {
        chain.single.mockResolvedValue(single);
    }
    if (resolveDirect !== undefined) {
        // Thenable so `await chain` resolves without calling .single()
        chain.then = (onFulfilled) => Promise.resolve(resolveDirect).then(onFulfilled);
    }
    return chain;
}

describe('backend service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isBackendEnabled.mockReturnValue(true);
        // Silence console.warn from caught errors
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('saveSharedRound', () => {
        it('returns null when backend disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const result = await saveSharedRound({ submission: 's' });
            expect(result).toBeNull();
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns id on successful insert', async () => {
            const chain = chainMock({ single: { data: { id: 'round-123' }, error: null } });
            supabase.from.mockReturnValue(chain);

            const result = await saveSharedRound({
                assets: { left: { label: 'A' }, right: { label: 'B' } },
                submission: 'fuzzy',
                imageUrl: 'http://img',
                shareFrom: 'user1',
                collisionId: 'coll-1',
            });
            expect(result).toBe('round-123');
            expect(supabase.from).toHaveBeenCalledWith('shared_rounds');
        });

        it('passes correctly shaped row to .insert', async () => {
            const chain = chainMock({ single: { data: { id: 'x' }, error: null } });
            supabase.from.mockReturnValue(chain);

            await saveSharedRound({
                assets: { left: 'L', right: 'R' },
                submission: 'sub',
                imageUrl: 'https://img.example/x.png',
                shareFrom: 'player-1',
                collisionId: 'coll-xyz',
            });

            expect(chain.insert).toHaveBeenCalledWith({
                assets: { left: 'L', right: 'R' },
                submission: 'sub',
                image_url: 'https://img.example/x.png',
                share_from: 'player-1',
                collision_id: 'coll-xyz',
            });
            expect(chain.select).toHaveBeenCalledWith('id');
        });

        it('returns null when supabase returns an error', async () => {
            const chain = chainMock({ single: { data: null, error: { message: 'boom' } } });
            supabase.from.mockReturnValue(chain);

            const result = await saveSharedRound({ submission: 's' });
            expect(result).toBeNull();
        });
    });

    describe('getSharedRound', () => {
        it('returns null when backend disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const result = await getSharedRound('id');
            expect(result).toBeNull();
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns mapped round on success', async () => {
            const chain = chainMock({
                single: {
                    data: {
                        id: 'r1',
                        assets: { left: 'L', right: 'R' },
                        submission: 'sub',
                        image_url: 'http://img',
                        share_from: 'p1',
                    },
                    error: null,
                },
            });
            supabase.from.mockReturnValue(chain);

            const result = await getSharedRound('r1');
            expect(result).toEqual({
                id: 'r1',
                roundId: 'r1',
                assets: { left: 'L', right: 'R' },
                submission: 'sub',
                imageUrl: 'http://img',
                shareFrom: 'p1',
            });
            expect(chain.eq).toHaveBeenCalledWith('id', 'r1');
        });

        it('returns null on supabase error', async () => {
            const chain = chainMock({ single: { data: null, error: { message: 'nope' } } });
            supabase.from.mockReturnValue(chain);

            const result = await getSharedRound('missing');
            expect(result).toBeNull();
        });

        it('returns null when data is null (no row found)', async () => {
            const chain = chainMock({ single: { data: null, error: null } });
            supabase.from.mockReturnValue(chain);

            const result = await getSharedRound('missing');
            expect(result).toBeNull();
        });
    });

    describe('saveJudgementToBackend', () => {
        it('returns false when backend disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const result = await saveJudgementToBackend('round-1', { judgeName: 'A' });
            expect(result).toBe(false);
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns true on successful insert', async () => {
            const chain = chainMock({ resolveDirect: { error: null } });
            supabase.from.mockReturnValue(chain);

            const result = await saveJudgementToBackend('round-1', {
                judgeName: 'Judge A',
                score: 8,
                relevance: 0.9,
                commentary: 'nice',
            });

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('judgements');
            expect(chain.insert).toHaveBeenCalledWith({
                round_id: 'round-1',
                judge_name: 'Judge A',
                score: 8,
                relevance: 0.9,
                commentary: 'nice',
            });
        });

        it('returns false on supabase error', async () => {
            const chain = chainMock({ resolveDirect: { error: { message: 'fail' } } });
            supabase.from.mockReturnValue(chain);

            const result = await saveJudgementToBackend('round-1', { judgeName: 'A' });
            expect(result).toBe(false);
        });
    });

    describe('getJudgementForRound', () => {
        it('returns null when backend disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const result = await getJudgementForRound('r1');
            expect(result).toBeNull();
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns mapped judgement on success', async () => {
            const chain = chainMock({
                single: {
                    data: {
                        score: 9,
                        relevance: 0.8,
                        commentary: 'great',
                        judge_name: 'Judge X',
                        created_at: '2026-01-01T00:00:00Z',
                    },
                    error: null,
                },
            });
            supabase.from.mockReturnValue(chain);

            const result = await getJudgementForRound('round-42');
            expect(result).toEqual({
                score: 9,
                relevance: 0.8,
                commentary: 'great',
                judgeName: 'Judge X',
                createdAt: '2026-01-01T00:00:00Z',
            });
            expect(chain.eq).toHaveBeenCalledWith('round_id', 'round-42');
            expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(chain.limit).toHaveBeenCalledWith(1);
        });

        it('returns null on supabase error', async () => {
            const chain = chainMock({ single: { data: null, error: { message: 'nope' } } });
            supabase.from.mockReturnValue(chain);

            const result = await getJudgementForRound('round-1');
            expect(result).toBeNull();
        });
    });

    describe('getJudgementsByCollisionIds', () => {
        it('returns {} when backend disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const result = await getJudgementsByCollisionIds(['c1']);
            expect(result).toEqual({});
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns {} for empty collisionIds array', async () => {
            const result = await getJudgementsByCollisionIds([]);
            expect(result).toEqual({});
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns {} for null/undefined collisionIds', async () => {
            expect(await getJudgementsByCollisionIds(null)).toEqual({});
            expect(await getJudgementsByCollisionIds(undefined)).toEqual({});
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('returns {} when no rounds match collision ids', async () => {
            const roundsChain = chainMock({ resolveDirect: { data: [], error: null } });
            supabase.from.mockReturnValueOnce(roundsChain);

            const result = await getJudgementsByCollisionIds(['c1', 'c2']);
            expect(result).toEqual({});
            expect(supabase.from).toHaveBeenCalledTimes(1);
        });

        it('returns mapped judgements keyed by collision id (latest per round)', async () => {
            const roundsChain = chainMock({
                resolveDirect: {
                    data: [
                        { id: 'r1', collision_id: 'c1' },
                        { id: 'r2', collision_id: 'c2' },
                    ],
                    error: null,
                },
            });
            const judgementsChain = chainMock({
                resolveDirect: {
                    data: [
                        // Returned in descending created_at order; first per round_id wins
                        {
                            round_id: 'r1',
                            score: 9,
                            relevance: 0.9,
                            commentary: 'newer',
                            judge_name: 'J1',
                            created_at: '2026-02-01T00:00:00Z',
                        },
                        {
                            round_id: 'r1',
                            score: 5,
                            relevance: 0.5,
                            commentary: 'older',
                            judge_name: 'J1',
                            created_at: '2026-01-01T00:00:00Z',
                        },
                        {
                            round_id: 'r2',
                            score: 7,
                            relevance: 0.7,
                            commentary: 'r2 only',
                            judge_name: 'J2',
                            created_at: '2026-01-15T00:00:00Z',
                        },
                    ],
                    error: null,
                },
            });

            supabase.from
                .mockReturnValueOnce(roundsChain)
                .mockReturnValueOnce(judgementsChain);

            const result = await getJudgementsByCollisionIds(['c1', 'c2']);
            expect(result).toEqual({
                c1: {
                    score: 9,
                    relevance: 0.9,
                    commentary: 'newer',
                    judgeName: 'J1',
                    createdAt: '2026-02-01T00:00:00Z',
                },
                c2: {
                    score: 7,
                    relevance: 0.7,
                    commentary: 'r2 only',
                    judgeName: 'J2',
                    createdAt: '2026-01-15T00:00:00Z',
                },
            });
            expect(roundsChain.in).toHaveBeenCalledWith('collision_id', ['c1', 'c2']);
            expect(judgementsChain.in).toHaveBeenCalledWith('round_id', ['r1', 'r2']);
        });

        it('omits rounds that have no matching judgements', async () => {
            const roundsChain = chainMock({
                resolveDirect: {
                    data: [
                        { id: 'r1', collision_id: 'c1' },
                        { id: 'r2', collision_id: 'c2' },
                    ],
                    error: null,
                },
            });
            const judgementsChain = chainMock({
                resolveDirect: {
                    data: [
                        {
                            round_id: 'r1',
                            score: 9,
                            relevance: 0.9,
                            commentary: 'only r1',
                            judge_name: 'J1',
                            created_at: '2026-02-01T00:00:00Z',
                        },
                    ],
                    error: null,
                },
            });

            supabase.from
                .mockReturnValueOnce(roundsChain)
                .mockReturnValueOnce(judgementsChain);

            const result = await getJudgementsByCollisionIds(['c1', 'c2']);
            expect(Object.keys(result)).toEqual(['c1']);
            expect(result.c2).toBeUndefined();
        });

        it('returns {} when supabase throws', async () => {
            supabase.from.mockImplementation(() => {
                throw new Error('supabase exploded');
            });
            const result = await getJudgementsByCollisionIds(['c1']);
            expect(result).toEqual({});
        });
    });
});

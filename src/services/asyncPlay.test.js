import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./leaderboard', () => ({
    getWeekKey: vi.fn(() => '2026-W11'),
}));

const store = {};
beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
    vi.stubGlobal('localStorage', {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, val) => { store[key] = val; }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    });
});

import { createChallengeChain, submitChainScore, getChainResults } from './asyncPlay';

describe('asyncPlay service', () => {
    it('createChallengeChain creates a chain with correct structure', () => {
        const chain = createChallengeChain(['Alice', 'Bob'], 3);
        expect(chain).not.toBeNull();
        expect(chain.players).toEqual(['Alice', 'Bob']);
        expect(chain.promptCount).toBe(3);
        expect(chain.status).toBe('active');
        expect(chain.scores.Alice).toEqual([]);
        expect(chain.scores.Bob).toEqual([]);
    });

    it('returns null for fewer than 2 players', () => {
        expect(createChallengeChain(['Solo'], 3)).toBeNull();
        expect(createChallengeChain(null, 3)).toBeNull();
    });

    it('submitChainScore records scores for a player', () => {
        const chain = createChallengeChain(['Alice', 'Bob'], 2);
        const updated = submitChainScore(chain.id, 'Alice', 8);
        expect(updated.scores.Alice).toEqual([8]);
        expect(updated.status).toBe('active');
    });

    it('marks chain as completed when all players finish all prompts', () => {
        const chain = createChallengeChain(['Alice', 'Bob'], 2);
        submitChainScore(chain.id, 'Alice', 8);
        submitChainScore(chain.id, 'Alice', 9);
        submitChainScore(chain.id, 'Bob', 7);
        const final = submitChainScore(chain.id, 'Bob', 6);
        expect(final.status).toBe('completed');
    });

    it('getChainResults returns correct standings sorted by total score', () => {
        const chain = createChallengeChain(['Alice', 'Bob'], 2);
        submitChainScore(chain.id, 'Alice', 5);
        submitChainScore(chain.id, 'Alice', 6);
        submitChainScore(chain.id, 'Bob', 9);
        submitChainScore(chain.id, 'Bob', 8);
        const results = getChainResults(chain.id);
        expect(results.standings[0].player).toBe('Bob');
        expect(results.standings[0].totalScore).toBe(17);
        expect(results.standings[1].player).toBe('Alice');
        expect(results.standings[1].totalScore).toBe(11);
    });
});

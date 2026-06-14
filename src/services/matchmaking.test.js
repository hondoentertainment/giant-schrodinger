import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { joinMatchmakingQueue, findMatch, leaveQueue } from './matchmaking';

describe('matchmaking service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('joinMatchmakingQueue', () => {
        it('adds an entry with id and timestamp to the queue', () => {
            const entry = joinMatchmakingQueue('Alice', 1200);
            expect(entry.playerName).toBe('Alice');
            expect(entry.rating).toBe(1200);
            expect(entry.id).toMatch(/^match-/);
            const queue = JSON.parse(localStorage.getItem('venn_matchmaking_queue'));
            expect(queue).toHaveLength(1);
            expect(queue[0].playerName).toBe('Alice');
        });

        it('appends additional entries', () => {
            joinMatchmakingQueue('Alice', 1200);
            joinMatchmakingQueue('Bob', 1300);
            const queue = JSON.parse(localStorage.getItem('venn_matchmaking_queue'));
            expect(queue).toHaveLength(2);
        });

        it('joinMatchmakingQueue called twice in rapid succession produces distinct IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 2; i++) {
                const entry = joinMatchmakingQueue(`P${i}`, 1200);
                ids.add(entry.id);
            }
            expect(ids.size).toBe(2);
        });
    });

    describe('findMatch', () => {
        it('returns an entry within the rating range', () => {
            joinMatchmakingQueue('Alice', 1200);
            const match = findMatch(1250);
            expect(match.playerName).toBe('Alice');
        });

        it('returns null when no one in the queue', () => {
            expect(findMatch(1200)).toBeNull();
        });

        it('returns null when all candidates out of range', () => {
            joinMatchmakingQueue('Alice', 1000);
            expect(findMatch(2000)).toBeNull();
        });

        it('ignores expired queue entries (>30s old)', () => {
            // Seed an expired entry directly
            const expired = {
                playerName: 'Stale',
                rating: 1200,
                joinedAt: Date.now() - 60_000,
                id: 'match-old',
            };
            localStorage.setItem('venn_matchmaking_queue', JSON.stringify([expired]));
            expect(findMatch(1200)).toBeNull();
        });
    });

    describe('leaveQueue', () => {
        it('removes the specified entry from the queue', () => {
            const alice = joinMatchmakingQueue('Alice', 1200);
            joinMatchmakingQueue('Bob', 1300);
            leaveQueue(alice.id);
            const remaining = JSON.parse(localStorage.getItem('venn_matchmaking_queue'));
            expect(remaining).toHaveLength(1);
            expect(remaining[0].playerName).toBe('Bob');
        });

        it('is a no-op when id not found', () => {
            joinMatchmakingQueue('Alice', 1200);
            leaveQueue('bogus-id');
            const queue = JSON.parse(localStorage.getItem('venn_matchmaking_queue'));
            expect(queue).toHaveLength(1);
        });
    });

    describe('robustness', () => {
        it('treats corrupt queue storage as empty', () => {
            localStorage.setItem('venn_matchmaking_queue', '{not-json');
            // Should not throw; should yield no match and still allow new joins
            expect(findMatch(1200)).toBeNull();
            joinMatchmakingQueue('Alice', 1200);
            const queue = JSON.parse(localStorage.getItem('venn_matchmaking_queue'));
            expect(queue).toHaveLength(1);
        });
    });
});

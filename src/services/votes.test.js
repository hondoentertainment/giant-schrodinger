import { describe, it, expect, beforeEach, vi } from 'vitest';

let votes;
beforeEach(async () => {
    localStorage.clear();
    // Reset module state so cached _votesCache/_myVotesCache don't leak
    vi.resetModules();
    votes = await import('./votes');
});

describe('votes service', () => {
    describe('upvote / downvote / getVotes', () => {
        it('returns zeros for an unknown id', () => {
            expect(votes.getVotes('nope')).toEqual({ up: 0, down: 0, score: 0 });
        });

        it('upvote increments up count and score', () => {
            votes.upvote('c1');
            expect(votes.getVotes('c1')).toEqual({ up: 1, down: 0, score: 1 });
        });

        it('downvote increments down count and decrements score', () => {
            votes.downvote('c1');
            expect(votes.getVotes('c1')).toEqual({ up: 0, down: 1, score: -1 });
        });

        it('stacks multiple votes on the same id', () => {
            votes.upvote('c1');
            votes.upvote('c1');
            votes.downvote('c1');
            expect(votes.getVotes('c1')).toEqual({ up: 2, down: 1, score: 1 });
        });
    });

    describe('hasVoted / getVoteDirection', () => {
        it('hasVoted is false before any vote', () => {
            expect(votes.hasVoted('c1')).toBe(false);
            expect(votes.getVoteDirection('c1')).toBeNull();
        });

        it('tracks direction of my vote', () => {
            votes.upvote('c1');
            expect(votes.hasVoted('c1')).toBe(true);
            expect(votes.getVoteDirection('c1')).toBe('up');
        });

        it('my vote direction is overwritten when voting again', () => {
            votes.upvote('c1');
            votes.downvote('c1');
            expect(votes.getVoteDirection('c1')).toBe('down');
        });
    });

    describe('getAllVotes', () => {
        it('returns the raw vote map', () => {
            votes.upvote('a');
            votes.downvote('b');
            const all = votes.getAllVotes();
            expect(all).toEqual({
                a: { up: 1, down: 0 },
                b: { up: 0, down: 1 },
            });
        });
    });

    describe('getBestConnections', () => {
        it('annotates collisions with votes and sorts by score descending', () => {
            votes.upvote('c1');
            votes.upvote('c1');
            votes.downvote('c2');
            const collisions = [
                { id: 'c1', label: 'one' },
                { id: 'c2', label: 'two' },
                { id: 'c3', label: 'three' },
            ];
            const best = votes.getBestConnections(collisions);
            expect(best[0].id).toBe('c1');
            expect(best[0].votes.score).toBe(2);
            expect(best[best.length - 1].id).toBe('c2');
        });

        it('respects the limit parameter', () => {
            const collisions = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}` }));
            const best = votes.getBestConnections(collisions, 3);
            expect(best).toHaveLength(3);
        });
    });

    describe('persistence', () => {
        it('votes survive a module reimport (read from localStorage)', async () => {
            votes.upvote('persist');
            vi.resetModules();
            const fresh = await import('./votes');
            expect(fresh.getVotes('persist')).toEqual({ up: 1, down: 0, score: 1 });
        });
    });
});

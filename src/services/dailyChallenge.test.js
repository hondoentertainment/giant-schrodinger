import { describe, it, expect, beforeEach } from 'vitest';
import {
    getDailyChallenge,
    hasDailyChallengeBeenPlayed,
    markDailyChallengeComplete,
    getDailyChallengeHistory,
    getDailyChallengeSummary,
} from './dailyChallenge';

describe('dailyChallenge service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getDailyChallenge', () => {
        it('returns a deterministic challenge for the current day', () => {
            const a = getDailyChallenge();
            const b = getDailyChallenge();
            expect(a).toEqual(b);
            expect(a.theme).toBeDefined();
            expect(a.themeId).toBe(a.theme.id);
            expect(typeof a.prompt).toBe('string');
            expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(typeof a.seed).toBe('number');
            expect(a.mediaType).toBeDefined();
            expect(typeof a.isMemesVideosDay).toBe('boolean');
        });
    });

    describe('hasDailyChallengeBeenPlayed', () => {
        it('returns false when nothing is stored', () => {
            expect(hasDailyChallengeBeenPlayed()).toBe(false);
        });

        it('returns true after markDailyChallengeComplete', () => {
            markDailyChallengeComplete(8);
            expect(hasDailyChallengeBeenPlayed()).toBe(true);
        });

        it('returns false when stored date is not today', () => {
            localStorage.setItem(
                'vwf_daily',
                JSON.stringify({ date: '2020-01-01', score: 5, history: [] })
            );
            expect(hasDailyChallengeBeenPlayed()).toBe(false);
        });

        it('returns false when stored data is malformed', () => {
            localStorage.setItem('vwf_daily', '{not json');
            expect(hasDailyChallengeBeenPlayed()).toBe(false);
        });
    });

    describe('markDailyChallengeComplete', () => {
        it('stores today\'s entry and appends to history', () => {
            markDailyChallengeComplete(7);
            const stored = JSON.parse(localStorage.getItem('vwf_daily'));
            expect(stored.score).toBe(7);
            expect(stored.history).toHaveLength(1);
            expect(stored.history[0].score).toBe(7);
            expect(stored.history[0].completedAt).toBeDefined();
        });

        it('unshifts new entries to the front of history', () => {
            markDailyChallengeComplete(5);
            markDailyChallengeComplete(9);
            const history = getDailyChallengeHistory();
            expect(history[0].score).toBe(9);
            expect(history[1].score).toBe(5);
        });

        it('caps history at 30 entries', () => {
            // Pre-seed with 30 entries
            const history = Array.from({ length: 30 }, (_, i) => ({
                date: `2020-01-${String(i + 1).padStart(2, '0')}`,
                score: i,
                completedAt: 'x',
            }));
            localStorage.setItem(
                'vwf_daily',
                JSON.stringify({ date: '2020-01-30', score: 29, history })
            );
            markDailyChallengeComplete(100);
            const updated = getDailyChallengeHistory();
            expect(updated).toHaveLength(30);
            expect(updated[0].score).toBe(100);
        });
    });

    describe('getDailyChallengeHistory', () => {
        it('returns empty array when nothing stored', () => {
            expect(getDailyChallengeHistory()).toEqual([]);
        });

        it('returns empty array when history is missing from stored shape', () => {
            localStorage.setItem(
                'vwf_daily',
                JSON.stringify({ date: 'x', score: 5 })
            );
            expect(getDailyChallengeHistory()).toEqual([]);
        });

        it('returns empty array on malformed JSON', () => {
            localStorage.setItem('vwf_daily', 'invalid');
            expect(getDailyChallengeHistory()).toEqual([]);
        });
    });

    describe('getDailyChallengeSummary', () => {
        it('summarizes empty daily history', () => {
            const summary = getDailyChallengeSummary();
            expect(summary.completions).toBe(0);
            expect(summary.bestScore).toBeNull();
            expect(summary.shareLine).toMatch(/Complete the daily challenge/i);
        });

        it('returns latest, best, average, and share line for completed dailies', () => {
            localStorage.setItem(
                'vwf_daily',
                JSON.stringify({
                    date: '2026-06-22',
                    score: 9,
                    history: [
                        { date: '2026-06-22', score: 9, completedAt: 'x' },
                        { date: '2026-06-21', score: 6, completedAt: 'x' },
                    ],
                })
            );

            const summary = getDailyChallengeSummary();
            expect(summary.completions).toBe(2);
            expect(summary.latestScore).toBe(9);
            expect(summary.bestScore).toBe(9);
            expect(summary.averageScore).toBe(7.5);
            expect(summary.shareLine).toContain('Daily Venn complete');
        });
    });
});

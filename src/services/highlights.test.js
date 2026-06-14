import { describe, it, expect, beforeEach } from 'vitest';
import {
    isHighlightWorthy,
    autoSaveHighlight,
    getHighlights,
    getWeeklyHighlights,
    deleteHighlight,
    clearOldHighlights,
    getHighlightStats,
    exportHighlightData,
} from './highlights';

describe('highlights service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('isHighlightWorthy', () => {
        it('returns true for score >= 8', () => {
            expect(isHighlightWorthy(8)).toBe(true);
            expect(isHighlightWorthy(10)).toBe(true);
        });
        it('returns false for score < 8', () => {
            expect(isHighlightWorthy(7)).toBe(false);
            expect(isHighlightWorthy(0)).toBe(false);
        });
    });

    describe('autoSaveHighlight', () => {
        it('returns null for non-highlight-worthy score', () => {
            expect(autoSaveHighlight({ id: 'x', score: 5 })).toBeNull();
            expect(JSON.parse(localStorage.getItem('vwf_highlights') || 'null')).toBeNull();
        });

        it('returns null when collision is null', () => {
            expect(autoSaveHighlight(null)).toBeNull();
        });

        it('saves and returns a highlight object for high score', () => {
            const result = autoSaveHighlight({
                id: 'r1',
                score: 9,
                submission: 's',
                leftLabel: 'L',
                rightLabel: 'R',
                imageUrl: 'http://img',
                themeId: 't',
                playerName: 'P',
            });
            expect(result).not.toBeNull();
            expect(result.score).toBe(9);
            expect(result.timestamp).toBeTypeOf('number');

            const saved = JSON.parse(localStorage.getItem('vwf_highlights'));
            expect(saved).toHaveLength(1);
            expect(saved[0].id).toBe('r1');
        });

        it('updates existing highlight when id already present', () => {
            autoSaveHighlight({ id: 'r1', score: 8, submission: 'first' });
            autoSaveHighlight({ id: 'r1', score: 10, submission: 'better' });
            const saved = JSON.parse(localStorage.getItem('vwf_highlights'));
            expect(saved).toHaveLength(1);
            expect(saved[0].score).toBe(10);
            expect(saved[0].submission).toBe('better');
        });

        it('caps stored highlights at 20 (keeps top-scoring)', () => {
            for (let i = 0; i < 25; i++) {
                autoSaveHighlight({ id: `r${i}`, score: 8 + (i % 3), submission: `s${i}` });
            }
            const saved = JSON.parse(localStorage.getItem('vwf_highlights'));
            expect(saved).toHaveLength(20);
        });
    });

    describe('getHighlights', () => {
        it('returns highlights sorted by score descending', () => {
            autoSaveHighlight({ id: 'a', score: 8 });
            autoSaveHighlight({ id: 'b', score: 10 });
            autoSaveHighlight({ id: 'c', score: 9 });
            const highlights = getHighlights();
            expect(highlights.map((h) => h.id)).toEqual(['b', 'c', 'a']);
        });

        it('returns empty array when none exist', () => {
            expect(getHighlights()).toEqual([]);
        });
    });

    describe('getWeeklyHighlights', () => {
        it('returns only highlights from the current week, top 3', () => {
            const now = Date.now();
            const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
            // Manually seed (one this week, one last week)
            const seeded = [
                { id: 'new1', score: 9, timestamp: now },
                { id: 'new2', score: 10, timestamp: now - 1000 },
                { id: 'new3', score: 8, timestamp: now - 2000 },
                { id: 'new4', score: 8, timestamp: now - 3000 },
                { id: 'old', score: 10, timestamp: eightDaysAgo },
            ];
            localStorage.setItem('vwf_highlights', JSON.stringify(seeded));
            const weekly = getWeeklyHighlights();
            expect(weekly).toHaveLength(3);
            expect(weekly.map((h) => h.id)).not.toContain('old');
            // Sorted desc
            expect(weekly[0].score).toBeGreaterThanOrEqual(weekly[1].score);
        });
    });

    describe('deleteHighlight', () => {
        it('removes a highlight by id', () => {
            autoSaveHighlight({ id: 'a', score: 9 });
            autoSaveHighlight({ id: 'b', score: 10 });
            const remaining = deleteHighlight('a');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe('b');
        });
    });

    describe('clearOldHighlights', () => {
        it('removes highlights older than 90 days', () => {
            const now = Date.now();
            const seeded = [
                { id: 'fresh', score: 9, timestamp: now },
                { id: 'old', score: 10, timestamp: now - 100 * 24 * 60 * 60 * 1000 },
            ];
            localStorage.setItem('vwf_highlights', JSON.stringify(seeded));
            const remaining = clearOldHighlights();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe('fresh');
        });
    });

    describe('getHighlightStats', () => {
        it('returns zeros when there are no highlights', () => {
            expect(getHighlightStats()).toEqual({ total: 0, avgScore: 0, bestScore: 0, thisWeek: 0 });
        });

        it('aggregates totals, avg, best, and weekly count', () => {
            autoSaveHighlight({ id: 'a', score: 8 });
            autoSaveHighlight({ id: 'b', score: 10 });
            const stats = getHighlightStats();
            expect(stats.total).toBe(2);
            expect(stats.bestScore).toBe(10);
            expect(stats.avgScore).toBeCloseTo(9.0, 1);
            expect(stats.thisWeek).toBe(2);
        });
    });

    describe('exportHighlightData', () => {
        it('returns a plain object with expected fields', () => {
            const h = {
                id: 'a',
                submission: 's',
                score: 9,
                leftLabel: 'L',
                rightLabel: 'R',
                imageUrl: 'u',
                themeId: 't',
                timestamp: 1234,
                playerName: 'P',
                extraProp: 'should-be-dropped',
            };
            const exported = exportHighlightData(h);
            expect(exported).not.toHaveProperty('extraProp');
            expect(exported.id).toBe('a');
            expect(exported.timestamp).toBe(1234);
        });
    });
});

import { describe, it, expect } from 'vitest';
import { getWeeklyRecap, buildWeeklyRecapShareText } from './weeklyRecap';

const NOW = new Date('2026-07-26T12:00:00');

function daysAgo(days) {
    return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('weeklyRecap service', () => {
    it('returns null when there are no collisions in the last week', () => {
        expect(getWeeklyRecap({ collisions: [], stats: {}, now: NOW })).toBeNull();
        expect(getWeeklyRecap({
            collisions: [{ id: '1', submission: 'Old', score: 9, timestamp: daysAgo(10) }],
            stats: {},
            now: NOW,
        })).toBeNull();
    });

    it('aggregates only the last seven days', () => {
        const recap = getWeeklyRecap({
            collisions: [
                { id: '1', submission: 'Fresh link', score: 8, timestamp: daysAgo(1) },
                { id: '2', submission: 'Mid link', score: 6, timestamp: daysAgo(3), isDailyChallenge: true },
                { id: '3', submission: 'Stale link', score: 10, timestamp: daysAgo(9) },
            ],
            stats: { currentStreak: 4 },
            now: NOW,
        });
        expect(recap.roundsPlayed).toBe(2);
        expect(recap.best.submission).toBe('Fresh link');
        expect(recap.averageScore).toBe(7);
        expect(recap.dailyCount).toBe(1);
        expect(recap.highlightCount).toBe(1);
        expect(recap.streak).toBe(4);
    });

    it('accepts numeric epoch timestamps', () => {
        const recap = getWeeklyRecap({
            collisions: [{ id: '1', submission: 'Numeric', score: 5, timestamp: NOW.getTime() - 1000 }],
            stats: {},
            now: NOW,
        });
        expect(recap.roundsPlayed).toBe(1);
    });

    it('handles unscored collisions without a best entry', () => {
        const recap = getWeeklyRecap({
            collisions: [{ id: '1', submission: 'Unscored', timestamp: daysAgo(1) }],
            stats: {},
            now: NOW,
        });
        expect(recap.roundsPlayed).toBe(1);
        expect(recap.best).toBeNull();
        expect(recap.averageScore).toBe(0);
    });

    it('builds a share line with rounds, best link, and streak', () => {
        const recap = getWeeklyRecap({
            collisions: [
                { id: '1', submission: 'Neon jellyfish', score: 9, timestamp: daysAgo(2) },
                { id: '2', submission: 'Quiet thunder', score: 7, timestamp: daysAgo(4) },
            ],
            stats: { currentStreak: 3 },
            now: NOW,
        });
        expect(recap.shareText).toContain('2 connections');
        expect(recap.shareText).toContain('Neon jellyfish');
        expect(recap.shareText).toContain('9/10');
        expect(recap.shareText).toContain('3-day streak');
        expect(recap.shareText).toContain('Play Venn with Friends');
    });

    it('uses singular phrasing for a single connection', () => {
        const text = buildWeeklyRecapShareText({
            roundsPlayed: 1,
            averageScore: 0,
            best: null,
            streak: 0,
        });
        expect(text).toContain('1 connection');
        expect(text).not.toContain('1 connections');
    });
});

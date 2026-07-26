import { describe, it, expect, beforeEach } from 'vitest';
import {
    getStats,
    recordPlay,
    getMilestones,
    isAvatarUnlocked,
    isThemeUnlocked,
    getProfileSummary,
    getBestScore,
} from './stats';

describe('stats service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getStats', () => {
        it('returns default structure when no data', () => {
            const s = getStats();
            expect(s).toEqual({
                lastPlayedDate: null,
                currentStreak: 0,
                maxStreak: 0,
                totalRounds: 0,
                totalCollisions: 0,
                scores: [],
                dailyScores: [],
                themesPlayed: [],
                milestonesUnlocked: [],
            });
        });

        it('returns persisted stats', () => {
            recordPlay();
            const s = getStats();
            expect(s.totalRounds).toBe(1);
            expect(s.totalCollisions).toBe(1);
            expect(s.lastPlayedDate).toBeTruthy();
        });

        it('records score, daily score, and theme history when provided', () => {
            const { stats } = recordPlay(9, { isDailyChallenge: true, themeId: 'classic' });
            expect(stats.scores).toEqual([9]);
            expect(stats.dailyScores).toEqual([9]);
            expect(stats.themesPlayed).toEqual(['classic']);
        });

        it('handles corrupted localStorage', () => {
            localStorage.setItem('vwf_stats', 'invalid');
            const s = getStats();
            expect(s.milestonesUnlocked).toEqual([]);
            expect(s.totalRounds).toBe(0);
        });
    });

    describe('recordPlay', () => {
        it('increments totalRounds and totalCollisions', () => {
            const { stats } = recordPlay();
            expect(stats.totalRounds).toBe(1);
            expect(stats.totalCollisions).toBe(1);
        });

        it('unlocks first_round milestone', () => {
            const { newlyUnlocked } = recordPlay();
            expect(newlyUnlocked).toContain('first_round');
        });

        it('unlocks five_rounds on 5th play', () => {
            for (let i = 0; i < 4; i++) recordPlay();
            const { newlyUnlocked } = recordPlay();
            expect(newlyUnlocked).toContain('five_rounds');
        });
    });

    describe('getMilestones', () => {
        it('returns array of milestones', () => {
            const m = getMilestones();
            expect(Array.isArray(m)).toBe(true);
            expect(m.length).toBeGreaterThan(0);
            expect(m[0]).toHaveProperty('id');
            expect(m[0]).toHaveProperty('threshold');
            expect(m[0]).toHaveProperty('label');
        });
    });

    describe('isAvatarUnlocked', () => {
        it('returns true for avatar without milestone', () => {
            expect(isAvatarUnlocked('unknown-emoji')).toBe(true);
        });

        it('returns false for milestone-locked avatar before threshold', () => {
            expect(isAvatarUnlocked('🎯')).toBe(false);
        });

        it('returns true after first round', () => {
            recordPlay();
            expect(isAvatarUnlocked('🎯')).toBe(true);
        });
    });

    describe('isThemeUnlocked', () => {
        it('returns true for theme without milestone', () => {
            expect(isThemeUnlocked('neon')).toBe(true);
        });

        it('returns false for mystery theme before 7-day streak', () => {
            expect(isThemeUnlocked('mystery', { milestonesUnlocked: [] })).toBe(false);
        });
    });

    describe('getProfileSummary', () => {
        it('returns best score and next milestone from stats', () => {
            recordPlay(9, { themeId: 'neon' });
            recordPlay(7, { themeId: 'neon' });
            const summary = getProfileSummary();
            expect(getBestScore()).toBe(9);
            expect(summary.bestScore).toBe(9);
            expect(summary.favoriteThemeId).toBe('neon');
            expect(summary.nextMilestone).toBeTruthy();
            expect(summary.averageScore).toBe(8);
            expect(summary.streakStatus).toBe('active_today');
            expect(summary.streakAtRisk).toBe(false);
        });

        it('marks streak at risk when last play was yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            localStorage.setItem('vwf_stats', JSON.stringify({
                lastPlayedDate: key,
                currentStreak: 4,
                maxStreak: 4,
                totalRounds: 4,
                totalCollisions: 4,
                scores: [8],
                dailyScores: [],
                themesPlayed: ['neon'],
                milestonesUnlocked: ['first_round'],
            }));
            const summary = getProfileSummary();
            expect(summary.streakStatus).toBe('at_risk');
            expect(summary.streakAtRisk).toBe(true);
        });
    });
});

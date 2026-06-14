import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { checkAchievements, getAchievements, getUnlockedAchievements, getAchievementPoints, getAchievementProgress } from './achievements';

describe('achievements service', () => {

    describe('checkAchievements', () => {
        it('returns newly unlocked achievements for a perfect score', () => {
            const result = checkAchievements({ score: 10 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('perfect_10');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('description');
            expect(result[0]).toHaveProperty('category');
            expect(result[0]).toHaveProperty('points');
            expect(result[0]).toHaveProperty('unlockedAt');
        });

        it('unlocks score_streak_3 after 3 consecutive scores of 8+', () => {
            checkAchievements({ score: 8 });
            checkAchievements({ score: 9 });
            const result = checkAchievements({ score: 8 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('score_streak_3');
        });

        it('resets high score streak when score drops below 8', () => {
            checkAchievements({ score: 9 });
            checkAchievements({ score: 9 });
            checkAchievements({ score: 5 }); // resets streak
            checkAchievements({ score: 9 });
            const result = checkAchievements({ score: 9 });
            const ids = result.map(a => a.id);
            // Should not have streak_3 yet (only 2 in a row after reset)
            expect(ids).not.toContain('score_streak_3');
        });

        it('unlocks double_perfect after two 10s in one session', () => {
            checkAchievements({ score: 10 });
            const result = checkAchievements({ score: 10 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('double_perfect');
        });

        it('unlocks speed_demon for scoring 9+ on speed round', () => {
            const result = checkAchievements({ score: 9, isSpeedRound: true });
            const ids = result.map(a => a.id);
            expect(ids).toContain('speed_demon');
        });

        it('unlocks double_or_nothing_win for scoring 9+ on double or nothing', () => {
            const result = checkAchievements({ score: 9, isDoubleOrNothing: true });
            const ids = result.map(a => a.id);
            expect(ids).toContain('double_or_nothing_win');
        });

        it('unlocks comeback_kid for scoring 9+ after a score below 4', () => {
            const result = checkAchievements({ score: 9, previousScore: 3 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('comeback_kid');
        });

        it('unlocks streak achievements based on current streak in stats', () => {
            const result = checkAchievements({ score: 5, stats: { currentStreak: 7 } });
            const ids = result.map(a => a.id);
            expect(ids).toContain('streak_3');
            expect(ids).toContain('streak_7');
            expect(ids).not.toContain('streak_14');
        });

        it('unlocks social achievements based on share count', () => {
            const result = checkAchievements({ score: 5, shareCount: 10 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('first_share');
            expect(ids).toContain('ten_shares');
        });

        it('unlocks ranked achievements based on rankedData', () => {
            const result = checkAchievements({
                score: 5,
                rankedData: { placementComplete: true, tier: 'Gold' },
            });
            const ids = result.map(a => a.id);
            expect(ids).toContain('placement_done');
            expect(ids).toContain('reach_silver');
            expect(ids).toContain('reach_gold');
            expect(ids).not.toContain('reach_platinum');
        });

        it('unlocks marathon when sessionRoundCount >= 10', () => {
            const result = checkAchievements({ score: 5, sessionRoundCount: 10 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('marathon');
        });

        it('unlocks custom_creator when customThemesCreated >= 1', () => {
            const result = checkAchievements({ score: 5, customThemesCreated: 1 });
            const ids = result.map(a => a.id);
            expect(ids).toContain('custom_creator');
        });
    });

    describe('persistence and idempotency', () => {
        it('persists achievements in localStorage', () => {
            checkAchievements({ score: 10 });
            const stored = JSON.parse(store['vwf_achievements']);
            expect(stored.unlocked).toHaveProperty('perfect_10');
        });

        it('does not re-unlock achievements on subsequent calls', () => {
            const first = checkAchievements({ score: 10 });
            const second = checkAchievements({ score: 10 });
            expect(first.map(a => a.id)).toContain('perfect_10');
            expect(second.map(a => a.id)).not.toContain('perfect_10');
        });
    });

    describe('getAchievements', () => {
        it('returns all achievement definitions with unlock status', () => {
            const all = getAchievements();
            expect(all.length).toBeGreaterThan(0);
            expect(all[0]).toHaveProperty('id');
            expect(all[0]).toHaveProperty('unlockedAt');
        });
    });

    describe('getUnlockedAchievements', () => {
        it('returns only unlocked achievements', () => {
            expect(getUnlockedAchievements()).toHaveLength(0);
            checkAchievements({ score: 10 });
            const unlocked = getUnlockedAchievements();
            expect(unlocked.length).toBeGreaterThan(0);
            expect(unlocked.every(a => a.unlockedAt !== null)).toBe(true);
        });
    });

    describe('getAchievementPoints', () => {
        it('returns total points from unlocked achievements', () => {
            expect(getAchievementPoints()).toBe(0);
            checkAchievements({ score: 10 });
            expect(getAchievementPoints()).toBeGreaterThan(0);
        });
    });

    describe('getAchievementProgress', () => {
        it('returns 100% for unlocked achievements', () => {
            checkAchievements({ score: 10 });
            const progress = getAchievementProgress('perfect_10');
            expect(progress.percentage).toBe(100);
        });

        it('returns partial progress for in-progress achievements', () => {
            checkAchievements({ score: 8 }); // 1 high score in streak
            const progress = getAchievementProgress('score_streak_3');
            expect(progress.current).toBe(1);
            expect(progress.target).toBe(3);
        });
    });
});

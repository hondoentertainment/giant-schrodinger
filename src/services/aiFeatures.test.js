import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getAIDifficulty,
    setAIDifficulty,
    getDifficultyConfig,
    generateAIConnection,
    getAIOpponentResult,
    getSmartPromptDifficulty,
    getConnectionExplanation,
    getTrendingConnections,
    getPersonalInsights,
    getGlobalCreativityIndex,
} from './aiFeatures';

describe('aiFeatures service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getAIDifficulty / setAIDifficulty', () => {
        it('defaults to normal when nothing stored', () => {
            expect(getAIDifficulty()).toBe('normal');
        });

        it('roundtrips a valid difficulty through localStorage', () => {
            setAIDifficulty('hard');
            expect(getAIDifficulty()).toBe('hard');
        });

        it('ignores invalid difficulty values', () => {
            setAIDifficulty('impossible');
            expect(localStorage.getItem('vwf_ai_settings')).toBeNull();
            expect(getAIDifficulty()).toBe('normal');
        });

        it('returns normal when stored JSON is malformed', () => {
            localStorage.setItem('vwf_ai_settings', '{not-json');
            expect(getAIDifficulty()).toBe('normal');
        });
    });

    describe('getDifficultyConfig', () => {
        it('returns the easy config', () => {
            const cfg = getDifficultyConfig('easy');
            expect(cfg.label).toBe('Easy');
            expect(cfg.scoringStrictness).toBe(1.3);
            expect(cfg.timeBonus).toBe(15);
        });

        it('falls back to normal for unknown difficulty', () => {
            expect(getDifficultyConfig('nonsense').label).toBe('Normal');
        });
    });

    describe('generateAIConnection', () => {
        it('returns a connection string and confidence in range', () => {
            const result = generateAIConnection('Cat', 'Dog');
            expect(typeof result.connection).toBe('string');
            expect(result.connection).toMatch(/Cat/);
            expect(result.connection).toMatch(/Dog/);
            expect(result.confidence).toBeGreaterThanOrEqual(0.6);
            expect(result.confidence).toBeLessThanOrEqual(0.95);
        });

        it('is deterministic for same inputs', () => {
            const a = generateAIConnection('Apple', 'Banana');
            const b = generateAIConnection('Apple', 'Banana');
            expect(a).toEqual(b);
        });
    });

    describe('getAIOpponentResult', () => {
        afterEach(() => vi.restoreAllMocks());

        it('returns a score in the easy range', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const result = getAIOpponentResult('easy');
            expect(result.score).toBeGreaterThanOrEqual(3);
            expect(result.score).toBeLessThanOrEqual(7);
            expect(result.responseTime).toBeGreaterThanOrEqual(2000);
        });

        it('defaults to normal range for unknown difficulty', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.99);
            const result = getAIOpponentResult('mystery');
            expect(result.score).toBeGreaterThanOrEqual(5);
            expect(result.score).toBeLessThanOrEqual(8);
        });
    });

    describe('getSmartPromptDifficulty', () => {
        it('returns easy for missing stats', () => {
            expect(getSmartPromptDifficulty(null)).toBe('easy');
            expect(getSmartPromptDifficulty(undefined)).toBe('easy');
        });

        it('returns easy for few games or low score', () => {
            expect(getSmartPromptDifficulty({ gamesPlayed: 2, averageScore: 9 })).toBe('easy');
            expect(getSmartPromptDifficulty({ gamesPlayed: 20, averageScore: 3 })).toBe('easy');
        });

        it('returns hard for experienced high-scoring players', () => {
            expect(getSmartPromptDifficulty({ gamesPlayed: 20, averageScore: 8, winRate: 0.8 })).toBe('hard');
        });

        it('returns normal for mid-tier players', () => {
            expect(getSmartPromptDifficulty({ gamesPlayed: 10, averageScore: 5, winRate: 0.3 })).toBe('normal');
        });
    });

    describe('getConnectionExplanation', () => {
        it('gives brilliant feedback for score 9+', () => {
            expect(getConnectionExplanation('link', 10, 'A', 'B')).toMatch(/Brilliant/);
        });
        it('gives solid feedback for 7-8', () => {
            expect(getConnectionExplanation('link', 7, 'A', 'B')).toMatch(/Solid/);
        });
        it('gives decent feedback for 5-6', () => {
            expect(getConnectionExplanation('link', 5, 'A', 'B')).toMatch(/Decent/);
        });
        it('gives stretch feedback for low scores', () => {
            expect(getConnectionExplanation('link', 2, 'A', 'B')).toMatch(/stretch/);
        });
    });

    describe('getTrendingConnections', () => {
        it('returns the trending styles array', () => {
            const trends = getTrendingConnections();
            expect(Array.isArray(trends)).toBe(true);
            expect(trends.length).toBeGreaterThan(0);
            expect(trends[0]).toHaveProperty('style');
            expect(trends[0]).toHaveProperty('popularity');
            expect(trends[0]).toHaveProperty('example');
        });
    });

    describe('getPersonalInsights', () => {
        it('prompts to play more when stats are missing', () => {
            expect(getPersonalInsights(null)).toEqual(['Play a few games to unlock personalized insights!']);
        });

        it('names best day from stats.bestDay', () => {
            const insights = getPersonalInsights({ bestDay: 'Tuesday' }, {});
            expect(insights.some((s) => s.includes('Tuesday'))).toBe(true);
        });

        it('derives best day numeric index to weekday name', () => {
            const insights = getPersonalInsights({ bestDay: 1 }, {});
            expect(insights.some((s) => s.includes('Monday'))).toBe(true);
        });

        it('reports weekly improvement', () => {
            const insights = getPersonalInsights({ weeklyScores: [5, 10] }, {});
            expect(insights.some((s) => s.match(/improved 100%/))).toBe(true);
        });

        it('flags veteran milestone at 100+ games', () => {
            const insights = getPersonalInsights({ totalGames: 150 }, {});
            expect(insights.some((s) => s.includes('veteran'))).toBe(true);
        });
    });

    describe('getGlobalCreativityIndex', () => {
        it('returns a score in the 6.0 - 8.5 range with ISO date', () => {
            const result = getGlobalCreativityIndex();
            expect(result.score).toBeGreaterThanOrEqual(6.0);
            expect(result.score).toBeLessThanOrEqual(8.5);
            expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('is deterministic for the same day', () => {
            const a = getGlobalCreativityIndex();
            const b = getGlobalCreativityIndex();
            expect(a).toEqual(b);
        });
    });
});

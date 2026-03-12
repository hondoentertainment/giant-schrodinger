import { describe, it, expect, beforeEach } from 'vitest';
import { getAIDifficulty, setAIDifficulty, getDifficultyConfig, getSmartPromptDifficulty, generateAIConnection, getAIOpponentResult, getConnectionExplanation } from '../aiFeatures';

describe('AI Difficulty System', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to normal difficulty', () => {
        expect(getAIDifficulty()).toBe('normal');
    });

    it('saves and retrieves difficulty setting', () => {
        setAIDifficulty('hard');
        expect(getAIDifficulty()).toBe('hard');
        setAIDifficulty('easy');
        expect(getAIDifficulty()).toBe('easy');
    });

    it('ignores invalid difficulty values', () => {
        setAIDifficulty('invalid');
        expect(getAIDifficulty()).toBe('normal');
    });

    it('returns correct config for each difficulty', () => {
        const easy = getDifficultyConfig('easy');
        expect(easy.scoreMultiplier).toBe(1.3);
        expect(easy.timeBonus).toBe(15);

        const normal = getDifficultyConfig('normal');
        expect(normal.scoreMultiplier).toBe(1.0);
        expect(normal.timeBonus).toBe(0);

        const hard = getDifficultyConfig('hard');
        expect(hard.scoreMultiplier).toBe(0.7);
        expect(hard.timeBonus).toBe(-10);
    });

    it('falls back to normal config for unknown difficulty', () => {
        const config = getDifficultyConfig('invalid');
        expect(config.scoreMultiplier).toBe(1.0);
    });
});

describe('Smart Prompt Difficulty', () => {
    it('returns easy for null/invalid stats', () => {
        expect(getSmartPromptDifficulty(null)).toBe('easy');
        expect(getSmartPromptDifficulty('invalid')).toBe('easy');
    });

    it('returns easy for beginners', () => {
        expect(getSmartPromptDifficulty({ averageScore: 3, gamesPlayed: 1 })).toBe('easy');
    });

    it('returns hard for high performers', () => {
        expect(getSmartPromptDifficulty({ averageScore: 8, gamesPlayed: 15, winRate: 0.7 })).toBe('hard');
    });

    it('returns normal for mid-range players', () => {
        expect(getSmartPromptDifficulty({ averageScore: 6, gamesPlayed: 5, winRate: 0.4 })).toBe('normal');
    });
});

describe('AI Connection Generation', () => {
    it('generates a connection string', () => {
        const result = generateAIConnection('Sun', 'Moon');
        expect(result.connection).toBeTruthy();
        expect(typeof result.connection).toBe('string');
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it('produces deterministic results for same inputs', () => {
        const r1 = generateAIConnection('Sun', 'Moon');
        const r2 = generateAIConnection('Sun', 'Moon');
        expect(r1.connection).toBe(r2.connection);
    });
});

describe('AI Opponent Result', () => {
    it('returns score in easy range (3-7)', () => {
        for (let i = 0; i < 20; i++) {
            const r = getAIOpponentResult('easy');
            expect(r.score).toBeGreaterThanOrEqual(3);
            expect(r.score).toBeLessThanOrEqual(7);
        }
    });

    it('returns score in hard range (7-10)', () => {
        for (let i = 0; i < 20; i++) {
            const r = getAIOpponentResult('hard');
            expect(r.score).toBeGreaterThanOrEqual(7);
            expect(r.score).toBeLessThanOrEqual(10);
        }
    });

    it('includes response time', () => {
        const r = getAIOpponentResult('normal');
        expect(r.responseTime).toBeGreaterThanOrEqual(2000);
        expect(r.responseTime).toBeLessThanOrEqual(5000);
    });
});

describe('Connection Explanation', () => {
    it('returns high praise for score >= 9', () => {
        const explanation = getConnectionExplanation('test', 10, 'Sun', 'Moon');
        expect(explanation).toContain('Brilliant');
    });

    it('returns solid feedback for score 7-8', () => {
        const explanation = getConnectionExplanation('test', 7, 'Sun', 'Moon');
        expect(explanation).toContain('Solid');
    });

    it('returns decent feedback for score 5-6', () => {
        const explanation = getConnectionExplanation('test', 5, 'Sun', 'Moon');
        expect(explanation).toContain('Decent');
    });

    it('returns stretch feedback for score < 5', () => {
        const explanation = getConnectionExplanation('test', 3, 'Sun', 'Moon');
        expect(explanation).toContain('stretch');
    });
});

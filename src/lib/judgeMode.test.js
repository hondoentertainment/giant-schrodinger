import { describe, it, expect } from 'vitest';
import { JUDGE_MODES, getJudgeModeLabel, normalizeJudgeMode, getJudgeModeFromCollision } from './judgeMode';

describe('judgeMode helpers', () => {
    it('returns canonical labels for each mode', () => {
        expect(getJudgeModeLabel(JUDGE_MODES.AI)).toBe('AI Judge');
        expect(getJudgeModeLabel(JUDGE_MODES.HUMAN)).toBe('Manual Judge');
        expect(getJudgeModeLabel(JUDGE_MODES.FRIEND)).toBe('Friend Judge');
        expect(getJudgeModeLabel(JUDGE_MODES.ROOM_VOTE)).toBe('Room Vote');
    });

    it('normalizes legacy scoringMode values', () => {
        expect(normalizeJudgeMode(null, 'ai')).toBe(JUDGE_MODES.AI);
        expect(normalizeJudgeMode(undefined, 'human')).toBe(JUDGE_MODES.HUMAN);
    });

    it('reads judge mode from collision records', () => {
        expect(getJudgeModeFromCollision({ judgeMode: 'friend' })).toBe('Friend Judge');
        expect(getJudgeModeFromCollision({ scoringMode: 'ai' })).toBe('AI Judge');
    });
});

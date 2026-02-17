import { describe, it, expect, beforeEach } from 'vitest';
import { saveJudgement, getJudgement } from './judgements';

describe('judgements service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('saves and retrieves judgement by roundId', () => {
        const roundId = 'round-123';
        const judgement = {
            score: 8,
            relevance: 'Highly Logical',
            commentary: 'Nice!',
            judgeName: 'Alice',
        };
        saveJudgement(roundId, judgement);
        const retrieved = getJudgement(roundId);
        expect(retrieved.score).toBe(8);
        expect(retrieved.relevance).toBe('Highly Logical');
        expect(retrieved.commentary).toBe('Nice!');
        expect(retrieved.judgeName).toBe('Alice');
        expect(retrieved.timestamp).toBeDefined();
    });

    it('returns null for non-existent roundId', () => {
        expect(getJudgement('nonexistent')).toBeNull();
    });

    it('overwrites existing judgement for same roundId', () => {
        saveJudgement('r1', { score: 5 });
        saveJudgement('r1', { score: 9 });
        expect(getJudgement('r1').score).toBe(9);
    });

    it('preserves multiple rounds separately', () => {
        saveJudgement('r1', { score: 7 });
        saveJudgement('r2', { score: 9 });
        expect(getJudgement('r1').score).toBe(7);
        expect(getJudgement('r2').score).toBe(9);
    });
});

import { describe, it, expect } from 'vitest';
import { getScoreCoach } from './scoreCoach';

describe('getScoreCoach', () => {
    it('labels mock scores as practice', () => {
        const coach = getScoreCoach({ score: 8, isMock: true, breakdown: { wit: 8, logic: 8, originality: 8, clarity: 8 } });
        expect(coach.practice).toBe(true);
        expect(coach.reason).toMatch(/clear/i);
    });

    it('hints at the weakest axis', () => {
        const coach = getScoreCoach({
            score: 5,
            breakdown: { wit: 8, logic: 3, originality: 7, clarity: 6 },
        });
        expect(coach.weakAxis).toBe('logic');
        expect(coach.hint).toMatch(/Name both concepts/i);
    });

    it('calls out generic low scores', () => {
        const coach = getScoreCoach({ score: 2 });
        expect(coach.reason).toMatch(/generic/i);
    });
});

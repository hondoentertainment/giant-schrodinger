import { describe, it, expect } from 'vitest';
import { getScoreCoach } from './scoreCoach';

describe('getScoreCoach', () => {
    it('labels mock scores as practice', () => {
        const coach = getScoreCoach({ score: 8, isMock: true, breakdown: { wit: 8, logic: 8, originality: 8, clarity: 8 } });
        expect(coach.practice).toBe(true);
        expect(coach.reason).toMatch(/room heard it|collide/i);
    });

    it('rewrites their actual line on the weak axis', () => {
        const coach = getScoreCoach({
            score: 5,
            breakdown: { wit: 8, logic: 3, originality: 7, clarity: 6 },
            submission: 'they both wait',
            leftLabel: 'A lighthouse',
            rightLabel: 'An inbox',
        });
        expect(coach.weakAxis).toBe('logic');
        expect(coach.hint).toMatch(/they both wait/i);
        expect(coach.hint).toMatch(/lighthouse/i);
    });

    it('calls out generic low scores', () => {
        const coach = getScoreCoach({ score: 2 });
        expect(coach.reason).toMatch(/too safe/i);
    });
});

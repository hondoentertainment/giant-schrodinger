import { describe, it, expect } from 'vitest';
import { CURATED_PAIRS, getCuratedPairForSeed, getCuratedPairById, getDailyEditorialPair, getWeeklyEpisode, getWeeklyPairDrop } from './curatedPairs';

describe('curatedPairs', () => {
    it('has unique ids and two labels each', () => {
        const ids = CURATED_PAIRS.map((pair) => pair.id);
        expect(new Set(ids).size).toBe(CURATED_PAIRS.length);
        expect(CURATED_PAIRS.length).toBeGreaterThanOrEqual(150);
        CURATED_PAIRS.forEach((pair) => {
            expect(pair.id).toBeTruthy();
            expect(pair.id).not.toMatch(/^\s/);
            expect(pair.left).toBeTruthy();
            expect(pair.right).toBeTruthy();
            expect(pair.vibe).toBeTruthy();
        });
    });

    it('picks deterministically from a seed', () => {
        expect(getCuratedPairForSeed(0)).toEqual(getCuratedPairForSeed(CURATED_PAIRS.length));
        expect(getCuratedPairById('coffee-robot')?.left).toMatch(/coffee/i);
    });

    it('returns a 7-pair weekly drop and a stable daily editorial pair', () => {
        const date = new Date('2026-08-30T12:00:00');
        const drop = getWeeklyPairDrop(date);
        expect(drop).toHaveLength(7);
        expect(getDailyEditorialPair(date)).toEqual(drop[date.getDay()]);
        expect(getDailyEditorialPair(date)).toEqual(getDailyEditorialPair(new Date('2026-08-30T18:00:00')));
        expect(getWeeklyEpisode(date).title).toMatch(/^Week of /);
    });
});

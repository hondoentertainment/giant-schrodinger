import { describe, it, expect } from 'vitest';
import { CURATED_PAIRS, getCuratedPairForSeed, getCuratedPairById } from './curatedPairs';

describe('curatedPairs', () => {
    it('has unique ids and two labels each', () => {
        const ids = CURATED_PAIRS.map((pair) => pair.id);
        expect(new Set(ids).size).toBe(CURATED_PAIRS.length);
        expect(CURATED_PAIRS.length).toBeGreaterThanOrEqual(30);
        CURATED_PAIRS.forEach((pair) => {
            expect(pair.left).toBeTruthy();
            expect(pair.right).toBeTruthy();
        });
    });

    it('picks deterministically from a seed', () => {
        expect(getCuratedPairForSeed(0)).toEqual(getCuratedPairForSeed(CURATED_PAIRS.length));
        expect(getCuratedPairById('coffee-robot')?.left).toMatch(/coffee/i);
    });
});

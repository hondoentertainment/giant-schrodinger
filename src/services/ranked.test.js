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

import { getRankTier, recordRankedMatch, getPlayerRating, isPlacementComplete, getPlacementProgress } from './ranked';

describe('ranked service', () => {
    it('assigns correct tier based on rating', () => {
        expect(getRankTier(0).name).toBe('Bronze');
        expect(getRankTier(800).name).toBe('Silver');
        expect(getRankTier(1200).name).toBe('Gold');
        expect(getRankTier(1600).name).toBe('Platinum');
        expect(getRankTier(2000).name).toBe('Diamond');
        expect(getRankTier(2400).name).toBe('Venn Master');
    });

    it('records a win and increases rating via Elo', () => {
        const initial = getPlayerRating().rating; // 1000
        const result = recordRankedMatch(1000, true, 8);
        expect(result.newRating).toBeGreaterThan(initial);
        expect(result.ratingChange).toBeGreaterThan(0);
    });

    it('records a loss and decreases rating via Elo', () => {
        const initial = getPlayerRating().rating;
        const result = recordRankedMatch(1000, false, 3);
        expect(result.newRating).toBeLessThan(initial);
        expect(result.ratingChange).toBeLessThan(0);
    });

    it('tracks placement progress and completes after 5 games', () => {
        expect(isPlacementComplete()).toBe(false);
        for (let i = 0; i < 5; i++) {
            recordRankedMatch(1000, i % 2 === 0, 5);
        }
        expect(isPlacementComplete()).toBe(true);
        const progress = getPlacementProgress();
        expect(progress.completed).toBe(5);
        expect(progress.total).toBe(5);
    });

    it('winning against a stronger opponent yields larger rating change', () => {
        const r1 = recordRankedMatch(1000, true, 8);  // equal opponent
        // Reset for a clean comparison
        Object.keys(store).forEach(key => delete store[key]);
        const r2 = recordRankedMatch(1500, true, 8);  // stronger opponent
        expect(r2.ratingChange).toBeGreaterThan(r1.ratingChange);
    });
});

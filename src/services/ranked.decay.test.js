import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory localStorage replacement
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

import { checkDecay, recordRankedMatch, getPlayerRating, applyDecayOnLoad } from './ranked';

const STORAGE_KEY = 'vwf_ranked';
const DECAY_DAYS = 3;
const DECAY_AMOUNT = 15;

function seedData(overrides = {}) {
    const base = {
        rating: 1500,
        gamesPlayed: 10,
        wins: 5,
        losses: 5,
        seasonBest: 1500,
        placementWins: 3,
        placementLosses: 2,
        lastGameDate: null,
        seasonHistory: [],
        currentSeasonId: 'season_1',
        ...overrides,
    };
    store[STORAGE_KEY] = JSON.stringify(base);
    return base;
}

describe('ranked decay', () => {
    describe('checkDecay', () => {
        it('returns no decay when lastGameDate is null', () => {
            // Fresh player — ensureData will create defaults with null lastGameDate
            const result = checkDecay();
            expect(result.decayed).toBe(false);
            expect(result.rating).toBe(1000);
        });

        it('returns no decay when last game was within DECAY_DAYS', () => {
            const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
            seedData({ rating: 1500, lastGameDate: recent });

            const result = checkDecay();
            expect(result.decayed).toBe(false);
            expect(result.rating).toBe(1500);
        });

        it('applies DECAY_AMOUNT when inactive exactly DECAY_DAYS', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            const result = checkDecay();
            expect(result.decayed).toBe(true);
            expect(result.ratingLost).toBe(DECAY_AMOUNT);
            expect(result.rating).toBe(1500 - DECAY_AMOUNT);
        });

        it('applies multiple decay cycles when inactive for multiple DECAY_DAYS periods', () => {
            // 9 days ago → 3 decay cycles
            const daysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            const result = checkDecay();
            expect(result.decayed).toBe(true);
            expect(result.ratingLost).toBe(3 * DECAY_AMOUNT);
            expect(result.rating).toBe(1500 - 3 * DECAY_AMOUNT);
        });

        it('floors decayed rating at 0 (not below)', () => {
            const daysAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
            seedData({ rating: 20, lastGameDate: daysAgo });

            const result = checkDecay();
            expect(result.decayed).toBe(true);
            expect(result.rating).toBe(0);
            expect(result.ratingLost).toBe(20);
        });

        it('can decay a rating that is already below 1000 (no 1000 floor)', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 800, lastGameDate: daysAgo });

            const result = checkDecay();
            expect(result.decayed).toBe(true);
            expect(result.rating).toBe(800 - DECAY_AMOUNT);
        });

        it('does NOT update lastGameDate when decaying (per source)', () => {
            const lastGame = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
            seedData({ rating: 1500, lastGameDate: lastGame });

            checkDecay();

            const stored = JSON.parse(store[STORAGE_KEY]);
            expect(stored.lastGameDate).toBe(lastGame);
        });

        it('persists decayed rating to storage', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            checkDecay();
            const stored = JSON.parse(store[STORAGE_KEY]);
            expect(stored.rating).toBe(1500 - DECAY_AMOUNT);
        });

        it('after decay, getPlayerRating reflects the new (lower) rating', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            checkDecay();
            const rating = getPlayerRating();
            expect(rating.rating).toBe(1500 - DECAY_AMOUNT);
        });

        it('recording a match after decay updates lastGameDate (reset decay timer)', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            checkDecay();
            recordRankedMatch(1500, true, 7);

            const stored = JSON.parse(store[STORAGE_KEY]);
            // After recordRankedMatch, lastGameDate should be "now" (very recent)
            const diff = Date.now() - new Date(stored.lastGameDate).getTime();
            expect(diff).toBeLessThan(5_000);

            // And a subsequent decay check should be a no-op
            const result = checkDecay();
            expect(result.decayed).toBe(false);
        });
    });

    describe('applyDecayOnLoad', () => {
        it('returns null when no data exists', () => {
            const result = applyDecayOnLoad();
            expect(result).toBeNull();
        });

        it('returns null when last game was within DECAY_DAYS', () => {
            const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
            seedData({ rating: 1500, lastGameDate: recent });

            const result = applyDecayOnLoad();
            expect(result).toBeNull();
        });

        it('decays and returns {oldRating, newRating, decayAmount, daysSince} past threshold', () => {
            const daysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            const result = applyDecayOnLoad();
            expect(result).not.toBeNull();
            expect(result.oldRating).toBe(1500);
            expect(result.newRating).toBe(1500 - 2 * DECAY_AMOUNT); // 2 decay periods in 6 days
            expect(result.decayAmount).toBe(2 * DECAY_AMOUNT);
            expect(result.daysSince).toBe(6);
        });

        it('sets lastDecayAt timestamp in stored data', () => {
            const daysAgo = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000 - 60_000).toISOString();
            seedData({ rating: 1500, lastGameDate: daysAgo });

            applyDecayOnLoad();
            const stored = JSON.parse(store[STORAGE_KEY]);
            expect(typeof stored.lastDecayAt).toBe('number');
            expect(Date.now() - stored.lastDecayAt).toBeLessThan(5_000);
        });

        it('floors at 0 for applyDecayOnLoad', () => {
            const daysAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
            seedData({ rating: 10, lastGameDate: daysAgo });

            const result = applyDecayOnLoad();
            expect(result.newRating).toBe(0);
        });
    });
});

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

import {
    getBuiltInPacks,
    createCustomPack,
    getPackById,
    deleteCustomPack,
    getRandomPairing,
    getCustomPacks,
    recordPackPlay,
    getPackLeaderboard,
} from './promptPacks';

function makePairings(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
        left: `Left ${i}`,
        right: `Right ${i}`,
    }));
}

describe('promptPacks service', () => {
    describe('getBuiltInPacks', () => {
        it('includes Summer Heat during summer months', () => {
            const packs = getBuiltInPacks({ date: new Date('2026-07-15T12:00:00') });
            expect(packs.length).toBeGreaterThanOrEqual(4);
            expect(packs.some((pack) => pack.id === 'builtin-summer-heat')).toBe(true);
            packs.forEach(pack => {
                expect(pack.isBuiltIn).toBe(true);
                expect(pack.pairings.length).toBeGreaterThanOrEqual(10);
            });
        });

        it('rotates seasonal packs by calendar month', () => {
            const autumn = getBuiltInPacks({ date: new Date('2026-10-15T12:00:00') });
            expect(autumn.some((pack) => pack.id === 'builtin-autumn-ember')).toBe(true);
            expect(autumn.some((pack) => pack.id === 'builtin-summer-heat')).toBe(false);

            const winter = getBuiltInPacks({ date: new Date('2026-01-15T12:00:00') });
            expect(winter.some((pack) => pack.id === 'builtin-winter-glow')).toBe(true);
            expect(winter.some((pack) => pack.id === 'builtin-autumn-ember')).toBe(false);
        });

        it('always includes non-seasonal packs', () => {
            for (const date of ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']) {
                const names = getBuiltInPacks({ date: new Date(`${date}T12:00:00`) }).map(p => p.name);
                expect(names).toContain('Impossible Connections');
                expect(names).toContain('Pop Culture Mashup');
                expect(names).toContain('Deep Thoughts');
            }
        });

        it('lists off-season packs when includeOffSeason is set', () => {
            const packs = getBuiltInPacks({ date: new Date('2026-07-15T12:00:00'), includeOffSeason: true });
            expect(packs.some((pack) => pack.id === 'builtin-winter-glow')).toBe(true);
        });

        it('resolves seasonal packs by id year-round', () => {
            expect(getPackById('builtin-winter-glow')).not.toBeNull();
            expect(getPackById('builtin-autumn-ember')).not.toBeNull();
        });
    });

    describe('createCustomPack', () => {
        it('creates a custom pack with valid input', () => {
            const pack = createCustomPack({
                name: 'My Pack',
                description: 'Test pack',
                pairings: makePairings(10),
                creatorName: 'Tester',
            });
            expect(pack.name).toBe('My Pack');
            expect(pack.isBuiltIn).toBe(false);
            expect(pack.pairings).toHaveLength(10);
            expect(pack.creatorName).toBe('Tester');
            expect(pack.id).toMatch(/^custom_/);
        });

        it('throws when name is missing', () => {
            expect(() => createCustomPack({
                pairings: makePairings(10),
            })).toThrow('Pack name is required');
        });

        it('throws when fewer than 10 pairings are provided', () => {
            expect(() => createCustomPack({
                name: 'Small Pack',
                pairings: makePairings(5),
            })).toThrow('A minimum of 10 pairings is required');
        });

        it('throws when pairings are missing left or right', () => {
            const badPairings = makePairings(10);
            badPairings[3] = { left: 'Only Left', right: '' };
            expect(() => createCustomPack({
                name: 'Bad Pack',
                pairings: badPairings,
            })).toThrow('Each pairing must have a left and right value');
        });

        it('persists custom pack in localStorage', () => {
            createCustomPack({
                name: 'Stored Pack',
                pairings: makePairings(10),
            });
            const customs = getCustomPacks();
            expect(customs).toHaveLength(1);
            expect(customs[0].name).toBe('Stored Pack');
        });
    });

    describe('getPackById', () => {
        it('returns a built-in pack by id', () => {
            const pack = getPackById('builtin-impossible-connections');
            expect(pack).not.toBeNull();
            expect(pack.name).toBe('Impossible Connections');
        });

        it('returns a custom pack by id', () => {
            const created = createCustomPack({
                name: 'Custom One',
                pairings: makePairings(10),
            });
            const found = getPackById(created.id);
            expect(found).not.toBeNull();
            expect(found.name).toBe('Custom One');
        });

        it('returns null for non-existent id', () => {
            expect(getPackById('nonexistent')).toBeNull();
        });
    });

    describe('deleteCustomPack', () => {
        it('removes a custom pack', () => {
            const pack = createCustomPack({
                name: 'To Delete',
                pairings: makePairings(10),
            });
            expect(deleteCustomPack(pack.id)).toBe(true);
            expect(getPackById(pack.id)).toBeNull();
            expect(getCustomPacks()).toHaveLength(0);
        });

        it('returns false for non-existent pack', () => {
            expect(deleteCustomPack('nonexistent')).toBe(false);
        });

        it('does not delete built-in packs', () => {
            const result = deleteCustomPack('builtin-impossible-connections');
            expect(result).toBe(false);
            // Built-in pack still accessible
            expect(getPackById('builtin-impossible-connections')).not.toBeNull();
        });
    });

    describe('getRandomPairing', () => {
        it('returns a valid pairing from a built-in pack', () => {
            const pairing = getRandomPairing('builtin-deep-thoughts');
            expect(pairing).not.toBeNull();
            expect(pairing).toHaveProperty('left');
            expect(pairing).toHaveProperty('right');
            expect(typeof pairing.left).toBe('string');
            expect(typeof pairing.right).toBe('string');
        });

        it('returns a valid pairing from a custom pack', () => {
            const pack = createCustomPack({
                name: 'Random Test',
                pairings: makePairings(10),
            });
            const pairing = getRandomPairing(pack.id);
            expect(pairing).not.toBeNull();
            expect(pairing.left).toMatch(/^Left \d$/);
            expect(pairing.right).toMatch(/^Right \d$/);
        });

        it('returns null for non-existent pack', () => {
            expect(getRandomPairing('nonexistent')).toBeNull();
        });
    });

    describe('recordPackPlay and getPackLeaderboard', () => {
        it('records plays and returns leaderboard', () => {
            recordPackPlay('builtin-deep-thoughts', 8);
            recordPackPlay('builtin-deep-thoughts', 10);
            recordPackPlay('builtin-deep-thoughts', 6);
            const leaderboard = getPackLeaderboard('builtin-deep-thoughts');
            expect(leaderboard).toHaveLength(3);
            expect(leaderboard[0].score).toBe(10);
            expect(leaderboard[2].score).toBe(6);
        });

        it('returns empty array for pack with no plays', () => {
            expect(getPackLeaderboard('builtin-deep-thoughts')).toEqual([]);
        });
    });
});

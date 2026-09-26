import { describe, it, expect, beforeEach } from 'vitest';
import {
    applyLocalProgress,
    collectLocalProgress,
    mergeProgress,
    preparePush,
    reconcileShopWithGrants,
    slimGallery,
} from './progressSync';

describe('progress sync merge', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('uploads local progress when the cloud row is missing', () => {
        const local = {
            profile: { name: 'Ada', avatar: '🎯' },
            stats: { totalRounds: 3, currentStreak: 1 },
            gallery: [{ id: '1', submission: 'both are round' }],
            ranked: { rating: 1100, gamesPlayed: 2, wins: 1, losses: 1 },
            shop: { coins: { balance: 40, transactions: [] }, owned: [], equipped: {}, battlePass: null, appliedStripeGrantIds: [] },
            tournaments: [{ id: 't1' }],
            achievements: null,
            daily: null,
            stripeEntitlements: { battlePass: false, grants: [] },
        };
        const decision = mergeProgress(local, null);
        expect(decision.source).toBe('local-upload');
        expect(decision.shouldUpload).toBe(true);
        expect(decision.snapshot.profile.name).toBe('Ada');
        expect(decision.snapshot.ranked.rating).toBe(1100);
    });

    it('lets cloud win when both devices have ranked progress', () => {
        const decision = mergeProgress(
            {
                profile: { name: 'Local' },
                stats: { totalRounds: 4 },
                gallery: [{ id: 'local' }],
                ranked: { rating: 900, gamesPlayed: 3, wins: 1, losses: 2 },
                shop: { coins: { balance: 10, transactions: [] }, owned: [{ itemId: 'neon_glow' }], battlePass: null },
                tournaments: [],
                achievements: null,
                daily: null,
            },
            {
                profile: { name: 'Cloud' },
                stats: { totalRounds: 9, currentStreak: 2 },
                gallery: [{ id: 'cloud' }],
                ranked: { rating: 1400, gamesPlayed: 6, wins: 4, losses: 2 },
                shop: { coins: { balance: 80, transactions: [] }, owned: [], battlePass: { premium: false, xp: 20 } },
                tournaments: [{ id: 'cloud-tourney' }],
                achievements: null,
                daily: { date: '2026-09-25', history: [{ date: '2026-09-25' }] },
                stripeEntitlements: { battlePass: false, grants: [] },
            },
        );
        expect(decision.source).toBe('cloud');
        expect(decision.shouldUpload).toBe(false);
        expect(decision.snapshot.profile.name).toBe('Cloud');
        expect(decision.snapshot.ranked.rating).toBe(1400);
        expect(decision.snapshot.gallery).toEqual([{ id: 'cloud' }]);
        expect(decision.snapshot.shop.coins.balance).toBe(80);
    });

    it('keeps local gallery when the cloud domain is empty and does not invent a profile', () => {
        const decision = mergeProgress(
            {
                profile: { name: 'Ada', avatar: '🔥' },
                stats: null,
                gallery: [{ id: 'kept' }],
                ranked: null,
                shop: { coins: { balance: 0, transactions: [] }, owned: [] },
                tournaments: [],
                achievements: null,
                daily: null,
            },
            {
                profile: null,
                stats: null,
                gallery: [],
                ranked: null,
                shop: {},
                tournaments: [],
                achievements: null,
                daily: null,
                stripeEntitlements: { battlePass: true, grants: [] },
            },
        );
        expect(decision.shouldUpload).toBe(true);
        expect(decision.snapshot.profile.name).toBe('Ada');
        expect(decision.snapshot.gallery).toEqual([{ id: 'kept' }]);
        expect(decision.snapshot.stripeEntitlements.battlePass).toBe(true);
        expect(decision.snapshot.shop.battlePass.premium).toBe(true);
    });

    it('applies a coin grant once and ignores a second pass', () => {
        const entitlements = {
            battlePass: false,
            grants: [{ id: 'cs_1', sku: 'tier_small', kind: 'coins', coins: 100 }],
        };
        const once = reconcileShopWithGrants(
            { coins: { balance: 15, transactions: [] }, owned: [], appliedStripeGrantIds: [] },
            entitlements,
            { alreadyAppliedInShop: false },
        );
        expect(once.coins.balance).toBe(115);
        const twice = reconcileShopWithGrants(once, entitlements, { alreadyAppliedInShop: false });
        expect(twice.coins.balance).toBe(115);
    });

    it('does not add coins again when the cloud shop already includes the grant', () => {
        const shop = reconcileShopWithGrants(
            { coins: { balance: 100, transactions: [] }, owned: [], appliedStripeGrantIds: [] },
            { grants: [{ id: 'cs_1', kind: 'coins', coins: 100 }] },
            { alreadyAppliedInShop: true },
        );
        expect(shop.coins.balance).toBe(100);
        expect(shop.appliedStripeGrantIds).toEqual(['cs_1']);
    });

    it('preserves a cloud display name when the local profile was cleared', () => {
        const snapshot = preparePush(
            { profile: null, shop: { coins: { balance: 5, transactions: [] }, owned: [], appliedStripeGrantIds: [] } },
            { profile: { name: 'Ada', avatar: '🎯' }, stripeEntitlements: { battlePass: false, grants: [] } },
        );
        expect(snapshot.profile.name).toBe('Ada');
    });

    it('round-trips progress through local storage without data URLs', () => {
        applyLocalProgress({
            profile: { name: 'Ada', avatar: '🎯' },
            stats: { totalRounds: 2, currentStreak: 1 },
            gallery: [{ id: '1', imageUrl: 'data:image/png;base64,aaaa', submission: 'hi' }],
            ranked: { rating: 1000, gamesPlayed: 1, wins: 1, losses: 0 },
            shop: {
                coins: { balance: 12, transactions: [] },
                owned: [{ itemId: 'neon_glow' }],
                equipped: { VENN_SKINS: 'neon_glow' },
                battlePass: { premium: false, xp: 10, season: 1, claimedFree: [], claimedPremium: [] },
                appliedStripeGrantIds: ['cs_1'],
            },
            tournaments: [{ id: 'tourney_1' }],
            achievements: { unlocked: { first: true } },
            daily: { date: '2026-09-26', history: [] },
            stripeEntitlements: { battlePass: false, grants: [] },
        });
        const collected = collectLocalProgress();
        expect(collected.profile.name).toBe('Ada');
        expect(collected.shop.coins.balance).toBe(12);
        expect(collected.shop.owned[0].itemId).toBe('neon_glow');
        expect(collected.ranked.gamesPlayed).toBe(1);
        expect(collected.tournaments[0].id).toBe('tourney_1');
        expect(collected.gallery[0].imageUrl).toBeUndefined();
        expect(slimGallery([{ imageUrl: 'https://example.com/a.png' }])[0].imageUrl).toBe('https://example.com/a.png');
    });
});

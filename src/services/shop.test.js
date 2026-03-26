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
    getBalance,
    addCoins,
    spendCoins,
    purchaseItem,
    getShopItems,
    isItemOwned,
    equipItem,
    getEquippedItems,
    getTransactionHistory,
    getBattlePass,
    addBattlePassXp,
    getBattlePassProgress,
} from './shop';

describe('shop service', () => {

    describe('addCoins', () => {
        it('increases coin balance', () => {
            const newBalance = addCoins(100, 'test reward');
            expect(newBalance).toBe(100);
            expect(getBalance()).toBe(100);
        });

        it('accumulates coins across multiple calls', () => {
            addCoins(50, 'first');
            addCoins(75, 'second');
            expect(getBalance()).toBe(125);
        });

        it('records transaction history', () => {
            addCoins(100, 'round completed');
            const history = getTransactionHistory();
            expect(history).toHaveLength(1);
            expect(history[0].amount).toBe(100);
            expect(history[0].reason).toBe('round completed');
        });
    });

    describe('spendCoins', () => {
        it('deducts coins when balance is sufficient', () => {
            addCoins(200, 'test');
            const result = spendCoins(100, 'test_item');
            expect(result).toBe(true);
            expect(getBalance()).toBe(100);
        });

        it('returns false when balance is insufficient', () => {
            addCoins(50, 'test');
            const result = spendCoins(100, 'test_item');
            expect(result).toBe(false);
            expect(getBalance()).toBe(50);
        });
    });

    describe('getBalance', () => {
        it('returns 0 for a new player', () => {
            expect(getBalance()).toBe(0);
        });

        it('returns correct balance after transactions', () => {
            addCoins(500, 'test');
            spendCoins(200, 'purchase');
            expect(getBalance()).toBe(300);
        });
    });

    describe('purchaseItem', () => {
        it('deducts coins and adds item to owned', () => {
            addCoins(1000, 'test');
            const result = purchaseItem('pun_master');
            expect(result.success).toBe(true);
            expect(isItemOwned('pun_master')).toBe(true);
            expect(getBalance()).toBe(800); // 1000 - 200
        });

        it('fails when player cannot afford item', () => {
            addCoins(10, 'test');
            const result = purchaseItem('pun_master');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Insufficient coins');
            expect(isItemOwned('pun_master')).toBe(false);
        });

        it('fails for non-existent item', () => {
            addCoins(1000, 'test');
            const result = purchaseItem('nonexistent_item');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Item not found');
        });

        it('fails for already owned item', () => {
            addCoins(1000, 'test');
            purchaseItem('pun_master');
            const result = purchaseItem('pun_master');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Item already owned');
        });
    });

    describe('getShopItems', () => {
        it('returns flat array of all shop items', () => {
            const items = getShopItems();
            expect(items.length).toBeGreaterThan(0);
            expect(items[0]).toHaveProperty('id');
            expect(items[0]).toHaveProperty('name');
            expect(items[0]).toHaveProperty('price');
            expect(items[0]).toHaveProperty('category');
        });
    });

    describe('equipItem', () => {
        it('equips an owned item', () => {
            addCoins(1000, 'test');
            purchaseItem('pun_master');
            const result = equipItem('pun_master');
            expect(result.success).toBe(true);
            const equipped = getEquippedItems();
            expect(equipped.TITLE_BADGES).toBe('pun_master');
        });

        it('fails for unowned item', () => {
            const result = equipItem('pun_master');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Item not owned');
        });
    });

    describe('addBattlePassXp', () => {
        it('increases XP', () => {
            const xp = addBattlePassXp(50);
            expect(xp).toBe(50);
        });

        it('accumulates XP across calls', () => {
            addBattlePassXp(50);
            const xp = addBattlePassXp(75);
            expect(xp).toBe(125);
        });
    });

    describe('getBattlePass', () => {
        it('returns default battle pass for new player', () => {
            const bp = getBattlePass();
            expect(bp.season).toBe(1);
            expect(bp.xp).toBe(0);
            expect(bp.tiers).toHaveLength(30);
            expect(bp.premium).toBe(false);
        });
    });

    describe('getBattlePassProgress', () => {
        it('returns tier 0 for new player', () => {
            const progress = getBattlePassProgress();
            expect(progress.currentTier).toBe(0);
            expect(progress.xp).toBe(0);
        });

        it('advances tier based on XP', () => {
            addBattlePassXp(250);
            const progress = getBattlePassProgress();
            expect(progress.currentTier).toBe(2);
            expect(progress.xp).toBe(250);
        });
    });
});

/** Web shop SKUs. Keep unit amounts aligned with src callers via tests. */

export const STRIPE_SKUS = {
    tier_small: {
        id: 'tier_small',
        label: '100 Coins',
        unitAmount: 199,
        coins: 100,
        kind: 'coins',
    },
    tier_medium: {
        id: 'tier_medium',
        label: '500 Coins',
        unitAmount: 499,
        coins: 500,
        kind: 'coins',
        badge: 'Best Value',
    },
    tier_large: {
        id: 'tier_large',
        label: '1200 Coins',
        unitAmount: 999,
        coins: 1200,
        kind: 'coins',
        badge: 'Most Popular',
    },
    battle_pass: {
        id: 'battle_pass',
        label: 'Battle Pass Premium',
        unitAmount: 499,
        coins: 0,
        kind: 'battle_pass',
    },
};

export function getStripeSku(skuId) {
    return STRIPE_SKUS[skuId] || null;
}

/**
 * Apply a paid Checkout session to a progress record.
 * Duplicate session ids are ignored so webhook retries are safe.
 */
export function applyStripeGrant(record = {}, { sessionId, skuId, createdAt } = {}) {
    const sku = getStripeSku(skuId);
    if (!sessionId || !sku) {
        return { ok: false, reason: !sku ? 'unknown_sku' : 'missing_session', record };
    }

    const entitlements = record.stripeEntitlements || { battlePass: false, grants: [] };
    const grants = Array.isArray(entitlements.grants) ? entitlements.grants : [];
    if (grants.some((grant) => grant.id === sessionId)) {
        return { ok: true, duplicate: true, record };
    }

    const shop = record.shop || {};
    const coins = shop.coins || { balance: 0, transactions: [] };
    const at = createdAt || new Date().toISOString();
    let nextShop = { ...shop, coins: { ...coins, transactions: coins.transactions || [] } };
    let battlePass = Boolean(entitlements.battlePass);

    if (sku.kind === 'coins') {
        nextShop = {
            ...nextShop,
            coins: {
                balance: (Number(coins.balance) || 0) + sku.coins,
                transactions: [
                    { amount: sku.coins, reason: `stripe:${sku.id}`, timestamp: at },
                    ...(coins.transactions || []),
                ].slice(0, 50),
            },
        };
    }

    if (sku.kind === 'battle_pass') {
        battlePass = true;
        const current = shop.battlePass || {
            season: 1,
            xp: 0,
            claimedFree: [],
            claimedPremium: [],
            premium: false,
        };
        nextShop = {
            ...nextShop,
            battlePass: { ...current, premium: true },
        };
    }

    return {
        ok: true,
        duplicate: false,
        record: {
            ...record,
            shop: nextShop,
            stripeEntitlements: {
                battlePass,
                grants: [
                    { id: sessionId, sku: sku.id, kind: sku.kind, coins: sku.coins || 0, at },
                    ...grants,
                ].slice(0, 100),
            },
        },
    };
}

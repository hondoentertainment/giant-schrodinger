import { describe, it, expect, vi } from 'vitest';
import { createCheckoutSession, isStripeEnabled, PRICE_TIERS } from './stripe';
import { applyStripeGrant, STRIPE_SKUS } from '../../supabase/functions/_shared/stripeFulfillment.js';

describe('stripe checkout fallback', () => {
    it('reports purchases unavailable when the publishable key is missing', async () => {
        expect(isStripeEnabled({ VITE_STRIPE_PUBLISHABLE_KEY: '' })).toBe(false);
        const result = await createCheckoutSession('tier_small', {
            env: {},
            client: { auth: { getSession: vi.fn() }, functions: { invoke: vi.fn() } },
        });
        expect(result).toEqual({ ok: false, unavailable: true, error: 'Purchases unavailable' });
        expect(result.sessionId).toBeUndefined();
    });

    it('asks for an account instead of completing a purchase', async () => {
        const invoke = vi.fn();
        const result = await createCheckoutSession('battle_pass', {
            env: { VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_example' },
            client: {},
            getSession: async () => ({ data: { session: null } }),
            invoke,
        });
        expect(result.ok).toBe(false);
        expect(result.needsAccount).toBe(true);
        expect(invoke).not.toHaveBeenCalled();
        expect(JSON.stringify(result)).not.toMatch(/complete|mock_session/i);
    });

    it('returns the Checkout URL from the edge function', async () => {
        const invoke = vi.fn().mockResolvedValue({ data: { url: 'https://checkout.stripe.com/c/pay_123' }, error: null });
        const result = await createCheckoutSession('tier_medium', {
            env: { VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_example' },
            client: {},
            getSession: async () => ({ data: { session: { access_token: 'token' } } }),
            invoke,
        });
        expect(result.ok).toBe(true);
        expect(result.url).toContain('checkout.stripe.com');
        expect(invoke).toHaveBeenCalledWith({ sku: 'tier_medium', returnUrl: expect.any(String) });
    });

    it('keeps coin packs and the battle pass as known SKUs', () => {
        expect(PRICE_TIERS.map((tier) => tier.id)).toEqual(['tier_small', 'tier_medium', 'tier_large']);
        expect(STRIPE_SKUS.battle_pass.unitAmount).toBe(499);
    });
});

describe('stripe fulfillment', () => {
    it('grants coins once for a paid session', () => {
        const first = applyStripeGrant({ shop: { coins: { balance: 0, transactions: [] } } }, {
            sessionId: 'cs_test_1',
            skuId: 'tier_small',
        });
        expect(first.ok).toBe(true);
        expect(first.record.shop.coins.balance).toBe(100);
        const second = applyStripeGrant(first.record, { sessionId: 'cs_test_1', skuId: 'tier_small' });
        expect(second.duplicate).toBe(true);
        expect(second.record.shop.coins.balance).toBe(100);
    });

    it('turns on the battle pass without marking an unknown SKU as paid', () => {
        const granted = applyStripeGrant({ shop: {} }, { sessionId: 'cs_bp', skuId: 'battle_pass' });
        expect(granted.record.stripeEntitlements.battlePass).toBe(true);
        expect(granted.record.shop.battlePass.premium).toBe(true);
        const unknown = applyStripeGrant({}, { sessionId: 'cs_x', skuId: 'not-real' });
        expect(unknown.ok).toBe(false);
    });
});

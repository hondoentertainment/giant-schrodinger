import { supabase } from './supabase';
import { STRIPE_SKUS, getStripeSku } from '../../supabase/functions/_shared/stripeFulfillment.js';

export { STRIPE_SKUS, getStripeSku };

const PURCHASES_UNAVAILABLE = 'Purchases unavailable';

export function isStripeEnabled(env = import.meta.env) {
    return Boolean(env?.VITE_STRIPE_PUBLISHABLE_KEY);
}

export const PRICE_TIERS = Object.values(STRIPE_SKUS)
    .filter((sku) => sku.kind === 'coins')
    .map((sku) => ({
        id: sku.id,
        label: sku.label,
        price: sku.unitAmount,
        coins: sku.coins,
        badge: sku.badge,
    }));

/**
 * Start Stripe Checkout for a known SKU.
 * Without keys, or without a signed-in session, this never reports a completed purchase.
 */
export async function createCheckoutSession(skuId, deps = {}) {
    const env = deps.env || import.meta.env;
    const client = deps.client === undefined ? supabase : deps.client;
    const sku = getStripeSku(skuId);
    if (!sku) return { ok: false, error: 'Unknown item.' };
    if (!isStripeEnabled(env) || !client) {
        return { ok: false, unavailable: true, error: PURCHASES_UNAVAILABLE };
    }

    const sessionResult = deps.getSession
        ? await deps.getSession()
        : await client.auth.getSession();
    const session = sessionResult?.data?.session || sessionResult?.session || null;
    if (!session) {
        return { ok: false, needsAccount: true, error: 'Sign in to purchase.' };
    }

    const returnUrl = deps.returnUrl
        || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '');
    const invoke = deps.invoke || ((body) => client.functions.invoke('create-checkout-session', { body }));
    const { data, error } = await invoke({ sku: sku.id, returnUrl });
    if (error || !data?.url) {
        return { ok: false, unavailable: true, error: data?.error || PURCHASES_UNAVAILABLE };
    }
    return { ok: true, url: data.url };
}

export async function redirectToCheckout(skuId) {
    const result = await createCheckoutSession(skuId);
    if (result.ok && result.url && typeof window !== 'undefined') {
        window.location.assign(result.url);
    }
    return result;
}

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export function isStripeEnabled() { return !!STRIPE_KEY; }

export async function createCheckoutSession(itemId, priceInCents) {
  if (!isStripeEnabled()) return { error: 'Stripe not configured' };
  // In production, this would call a Supabase Edge Function
  // For now, return a mock session
  return { sessionId: `mock_session_${Date.now()}`, itemId, price: priceInCents };
}

export const PRICE_TIERS = [
  { id: 'tier_small', label: '100 Coins', price: 199, coins: 100 },
  { id: 'tier_medium', label: '500 Coins', price: 499, coins: 500, badge: 'Best Value' },
  { id: 'tier_large', label: '1200 Coins', price: 999, coins: 1200, badge: 'Most Popular' },
];

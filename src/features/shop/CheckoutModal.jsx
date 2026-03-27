import React, { useState } from 'react';
import { X, Coins, CreditCard, AlertTriangle } from 'lucide-react';
import { isStripeEnabled, createCheckoutSession, PRICE_TIERS } from '../../lib/stripe';

export function CheckoutModal({ onClose }) {
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const stripeReady = isStripeEnabled();

  const handlePurchase = async (tier) => {
    setPurchasing(tier.id);
    setError(null);
    try {
      const result = await createCheckoutSession(tier.id, tier.price);
      if (result.error) {
        setError(result.error);
      } else {
        setError(`Mock session created: ${result.sessionId}`);
      }
    } catch (err) {
      setError('Checkout failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <CreditCard size={22} className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">Buy Coins</h2>
        </div>

        {/* Stripe not configured warning */}
        {!stripeReady && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
            <AlertTriangle size={16} />
            <span>Stripe not configured — running in dev mode</span>
          </div>
        )}

        {/* Price Tiers */}
        <div className="space-y-3 mb-6">
          {PRICE_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="relative flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              {/* Badge */}
              {tier.badge && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  {tier.badge}
                </span>
              )}

              <div className="flex items-center gap-3">
                <Coins size={24} className="text-yellow-400" />
                <div>
                  <div className="text-white font-semibold">{tier.label}</div>
                  <div className="text-gray-400 text-sm">
                    ${(tier.price / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(tier)}
                disabled={purchasing === tier.id}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md transition-all disabled:opacity-50"
              >
                {purchasing === tier.id ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>

        {/* Error / Info Message */}
        {error && (
          <div className="text-center text-sm text-gray-400 bg-white/5 rounded-xl p-3">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

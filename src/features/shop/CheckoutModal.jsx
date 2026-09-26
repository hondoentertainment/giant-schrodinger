import React, { useState } from 'react';
import { X, Coins, CreditCard } from 'lucide-react';
import { isStripeEnabled, createCheckoutSession, PRICE_TIERS } from '../../lib/stripe';
import { useAccount } from '../../context/AccountContext';

export function CheckoutModal({ onClose }) {
  const account = useAccount();
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const stripeReady = isStripeEnabled();
  const purchasesUnavailable = !stripeReady;

  const handlePurchase = async (tier) => {
    if (purchasesUnavailable) return;
    setPurchasing(tier.id);
    setError(null);
    const result = await createCheckoutSession(tier.id);
    if (!result.ok) {
      setError(result.error || 'Purchases unavailable');
      setPurchasing(null);
      return;
    }
    if (result.url) window.location.assign(result.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close checkout"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <CreditCard size={22} className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">Buy Coins</h2>
        </div>

        {purchasesUnavailable && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm" role="status">
            Purchases unavailable. You can still browse the shop and spend Venn Coins earned in play.
          </div>
        )}

        {!purchasesUnavailable && account.status !== 'signed-in' && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
            Sign in to purchase. Guest play stays free, and coin packs are not granted without a receipt.
          </div>
        )}

        <div className="space-y-3 mb-6">
          {PRICE_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="relative flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5"
            >
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
                type="button"
                onClick={() => handlePurchase(tier)}
                disabled={purchasesUnavailable || purchasing === tier.id}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasesUnavailable ? 'Unavailable' : purchasing === tier.id ? 'Redirecting...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center text-sm text-amber-100 bg-white/5 rounded-xl p-3" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

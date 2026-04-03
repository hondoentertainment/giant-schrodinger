import React, { useState, useCallback } from 'react';
import { Crown, Lock, Check } from 'lucide-react';
import { getBattlePass, getBattlePassProgress, claimBattlePassReward, getBalance } from '../../services/shop';

const PREMIUM_PRICE = '$4.99';

export function BattlePassPanel({ onBalanceChange, toast }) {
  const [battlePass, setBattlePass] = useState(() => getBattlePass());
  const [progress, setProgress] = useState(() => getBattlePassProgress());

  const handleClaimReward = useCallback(
    (tier) => {
      const result = claimBattlePassReward(tier);
      if (result.success) {
        setBattlePass(getBattlePass());
        setProgress(getBattlePassProgress());
        if (onBalanceChange) onBalanceChange(getBalance());
        if (toast) toast.success(`Claimed tier ${tier} reward!`);
      } else {
        if (toast) toast.error(result.error || 'Claim failed');
      }
    },
    [onBalanceChange, toast]
  );

  const tiers = battlePass.tiers ?? [];
  const currentTier = progress?.currentTier ?? 0;
  const totalXp = progress?.xp ?? 0;
  const xpIntoTier = totalXp - currentTier * 100;
  const progressPct = currentTier < 30 ? Math.min((xpIntoTier / 100) * 100, 100) : 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Crown size={22} className="text-yellow-400" />
        <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-orange-300 bg-clip-text text-transparent">
          Battle Pass
        </h2>
        {battlePass.season && (
          <span className="text-xs text-gray-500 ml-auto">
            Season {battlePass.season}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Tier {currentTier} / 30</span>
          <span>{totalXp} XP</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((currentTier / 30) * 100, 100)}%` }}
          />
        </div>
        {currentTier < 30 && (
          <div className="text-[10px] text-gray-500 mt-1">
            {Math.round(progressPct)}% to next tier
          </div>
        )}
      </div>

      {/* Scrollable Tier Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tiers.map((tier) => {
          const reached = currentTier >= tier.tier;
          const freeClaimed = (battlePass.claimedFree ?? []).includes(tier.tier);
          const premiumClaimed = (battlePass.claimedPremium ?? []).includes(tier.tier);
          const hasPremium = !!tier.premiumReward;
          const isPremiumUser = battlePass.premium;
          const isCurrent = tier.tier === currentTier + 1;

          const freeReward = tier.freeReward;
          const freeIcon = freeReward?.type === 'coins' ? '🪙' : '🎁';
          const freeName = freeReward?.type === 'coins' ? `${freeReward.amount}` : (freeReward?.itemId || 'Reward');

          const premiumReward = tier.premiumReward;
          const premiumIcon = premiumReward?.type === 'coins' ? '🪙' : '🎁';
          const premiumName = premiumReward?.type === 'coins' ? `${premiumReward.amount}` : (premiumReward?.itemId || '');

          return (
            <div
              key={tier.tier}
              className={`flex-shrink-0 w-24 rounded-xl border text-center p-2 transition-all ${
                isCurrent
                  ? 'border-yellow-400/60 bg-yellow-500/10 ring-1 ring-yellow-400/30'
                  : freeClaimed
                  ? 'border-green-500/30 bg-green-500/10'
                  : reached
                  ? 'border-yellow-500/40 bg-yellow-500/10'
                  : 'border-white/5 bg-white/5 opacity-50'
              }`}
            >
              <div className="text-[10px] text-gray-400 mb-1">Tier {tier.tier}</div>
              <div className="text-[9px] text-gray-500 mb-1">{tier.xpRequired} XP</div>

              {/* Free Track */}
              <div className="mb-1">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Free</div>
                <div className="text-lg">{freeIcon}</div>
                <div className="text-[9px] text-gray-300 truncate">{freeName}</div>
                {freeClaimed ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-green-400">
                    <Check size={8} /> Claimed
                  </span>
                ) : reached ? (
                  <button
                    onClick={() => handleClaimReward(tier.tier)}
                    className="w-full text-[9px] font-bold py-0.5 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 transition-all mt-0.5"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="flex items-center justify-center text-[9px] text-gray-600">
                    <Lock size={8} className="mr-0.5" /> Locked
                  </span>
                )}
              </div>

              {/* Premium Track */}
              {hasPremium && (
                <div className="border-t border-white/5 pt-1 mt-1">
                  <div className="text-[9px] text-yellow-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                    <Crown size={8} /> Premium
                  </div>
                  {isPremiumUser ? (
                    <>
                      <div className="text-lg">{premiumIcon}</div>
                      <div className="text-[9px] text-gray-300 truncate">{premiumName}</div>
                      {premiumClaimed ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-green-400">
                          <Check size={8} /> Claimed
                        </span>
                      ) : reached ? (
                        <button
                          onClick={() => handleClaimReward(tier.tier)}
                          className="w-full text-[9px] font-bold py-0.5 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 text-black mt-0.5"
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="flex items-center justify-center text-[9px] text-gray-600">
                          <Lock size={8} className="mr-0.5" /> Locked
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-1">
                      <Lock size={14} className="text-yellow-500/60 mb-0.5" />
                      <span className="text-[8px] text-yellow-400/60">{PREMIUM_PRICE}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium Unlock Banner */}
      {!battlePass.premium && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-yellow-400" />
            <div>
              <div className="text-sm font-semibold text-yellow-300">Unlock Premium Track</div>
              <div className="text-[11px] text-gray-400">Get exclusive rewards every 3 tiers</div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 transition-all">
            {PREMIUM_PRICE}
          </button>
        </div>
      )}
    </div>
  );
}

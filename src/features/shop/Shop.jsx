import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { getBalance, getShopItems, purchaseItem, getOwnedItems, equipItem, getEquippedItems, getBattlePass, claimBattlePassReward, getBattlePassProgress } from '../../services/shop';
import { ArrowLeft, Coins, ShoppingBag, Sparkles, Crown, Star, Check, Lock } from 'lucide-react';

const CATEGORIES = ['ALL', 'AVATAR_PACKS', 'VENN_SKINS', 'SCORE_EFFECTS', 'TITLE_BADGES'];

const categoryLabels = {
  ALL: 'All',
  AVATAR_PACKS: 'Avatars',
  VENN_SKINS: 'Venn Skins',
  SCORE_EFFECTS: 'Effects',
  TITLE_BADGES: 'Badges',
};

const categoryIcons = {
  ALL: ShoppingBag,
  AVATAR_PACKS: Crown,
  VENN_SKINS: Sparkles,
  SCORE_EFFECTS: Star,
  TITLE_BADGES: Check,
};

export function Shop({ onBack }) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [balance, setBalance] = useState(() => getBalance());
  const [shopItems, setShopItems] = useState(() => getShopItems());
  const [ownedItemIds, setOwnedItemIds] = useState(() => new Set(getOwnedItems().map(e => e.itemId)));
  const [equippedItems, setEquippedItems] = useState(() => getEquippedItems());
  const [battlePass, setBattlePass] = useState(() => getBattlePass());
  const [battlePassProgress, setBattlePassProgress] = useState(() => getBattlePassProgress());
  const [purchasingId, setPurchasingId] = useState(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'ALL') return shopItems;
    return shopItems.filter(
      (item) => item.category === activeCategory
    );
  }, [shopItems, activeCategory]);

  const handlePurchase = useCallback(
    (item) => {
      if (balance < item.price) {
        toast.error('Not enough Venn Coins!');
        return;
      }
      setPurchasingId(item.id);
      const result = purchaseItem(item.id);
      if (result.success) {
        setBalance(getBalance());
        setShopItems(getShopItems());
        setOwnedItemIds(new Set(getOwnedItems().map(e => e.itemId)));
        toast.success(`Purchased ${item.name}!`);
      } else {
        toast.error(result.error || 'Purchase failed');
      }
      setPurchasingId(null);
    },
    [balance, toast]
  );

  const handleEquip = useCallback(
    (item) => {
      const result = equipItem(item.id);
      if (result.success) {
        setEquippedItems(getEquippedItems());
        toast.success(`Equipped ${item.name}!`);
      } else {
        toast.error(result.error || 'Equip failed');
      }
    },
    [toast]
  );

  const handleClaimReward = useCallback(
    (tier) => {
      const result = claimBattlePassReward(tier);
      if (result.success) {
        setBattlePass(getBattlePass());
        setBattlePassProgress(getBattlePassProgress());
        setBalance(getBalance());
        toast.success(`Claimed tier ${tier} reward!`);
      } else {
        toast.error(result.error || 'Claim failed');
      }
    },
    [toast]
  );

  const isEquipped = useCallback(
    (itemId) => Object.values(equippedItems).includes(itemId),
    [equippedItems]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Lobby</span>
          </button>

          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2">
            <Coins size={20} className="text-yellow-400" />
            <span className="text-yellow-300 font-bold text-lg">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag size={28} className="text-purple-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            Cosmetic Shop
          </h1>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                <Icon size={14} />
                {categoryLabels[cat] || cat}
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {filteredItems.map((item) => {
            const owned = ownedItemIds.has(item.id);
            const equipped = isEquipped(item.id);
            const canAfford = balance >= item.price;
            const purchasing = purchasingId === item.id;

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border backdrop-blur-md transition-all ${
                  equipped
                    ? 'border-purple-400/60 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/50'
                    : 'border-white/10 hover:border-white/20'
                } bg-white/5 overflow-hidden`}
              >
                {/* Equipped Glow */}
                {equipped && (
                  <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                )}

                {/* Item Preview */}
                <div className="flex items-center justify-center h-28 bg-gradient-to-b from-white/5 to-transparent">
                  {item.icon ? (
                    <span className="text-4xl">{item.icon}</span>
                  ) : (
                    <Sparkles size={36} className="text-purple-400/60" />
                  )}
                </div>

                {/* Item Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white truncate mb-1">
                    {item.name}
                  </h3>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {equipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        <Check size={10} />
                        Equipped
                      </span>
                    )}
                    {owned && !equipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full">
                        <Check size={10} />
                        Owned
                      </span>
                    )}
                    {!owned && (
                      <span className="flex items-center gap-1 text-sm">
                        <Coins size={14} className="text-yellow-400" />
                        <span className="text-yellow-300 font-bold">
                          {item.price}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {!owned ? (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || purchasing}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md'
                          : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {purchasing ? (
                        'Buying...'
                      ) : !canAfford ? (
                        <span className="flex items-center justify-center gap-1">
                          <Lock size={12} />
                          Insufficient
                        </span>
                      ) : (
                        'Buy'
                      )}
                    </button>
                  ) : !equipped ? (
                    <button
                      onClick={() => handleEquip(item)}
                      className="w-full py-2 rounded-xl text-sm font-semibold bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition-all"
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl text-sm font-semibold bg-purple-600/20 text-purple-400 cursor-default"
                    >
                      Equipped
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No items in this category</p>
            </div>
          )}
        </div>

        {/* Battle Pass Section */}
        {battlePass && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-8">
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
                <span>
                  Tier {battlePassProgress?.currentTier ?? 0} / 30
                </span>
                <span>
                  {battlePassProgress?.xp ?? 0} XP
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((battlePassProgress?.currentTier ?? 0) / 30) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Tier Rewards */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(battlePass.tiers ?? []).map((tier) => {
                const reached =
                  (battlePassProgress?.currentTier ?? 0) >= tier.tier;
                const claimed = (battlePass.claimedFree ?? []).includes(tier.tier);
                const reward = tier.freeReward;
                const rewardIcon = reward?.type === 'coins' ? '🪙' : '🎁';
                const rewardName = reward?.type === 'coins' ? `${reward.amount} coins` : (reward?.itemId || 'Reward');

                return (
                  <div
                    key={tier.tier}
                    className={`flex-shrink-0 w-20 rounded-xl border text-center p-2 transition-all ${
                      claimed
                        ? 'border-green-500/30 bg-green-500/10'
                        : reached
                        ? 'border-yellow-500/40 bg-yellow-500/10'
                        : 'border-white/5 bg-white/5 opacity-50'
                    }`}
                  >
                    <div className="text-[10px] text-gray-400 mb-1">
                      Tier {tier.tier}
                    </div>
                    <div className="text-xl mb-1">{rewardIcon}</div>
                    <div className="text-[10px] text-gray-300 truncate mb-2">
                      {rewardName}
                    </div>
                    {claimed ? (
                      <span className="text-[10px] text-green-400 font-medium">
                        Claimed
                      </span>
                    ) : reached ? (
                      <button
                        onClick={() => handleClaimReward(tier.tier)}
                        className="w-full text-[10px] font-bold py-1 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 transition-all"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="flex items-center justify-center text-[10px] text-gray-600">
                        <Lock size={10} className="mr-0.5" />
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

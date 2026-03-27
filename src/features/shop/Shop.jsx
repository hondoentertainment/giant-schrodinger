import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { getBalance, getShopItems, purchaseItem, getOwnedItems, equipItem, getEquippedItems, getSeasonalBundles, getCosmeticQuests, getQuestProgress } from '../../services/shop';
import { ArrowLeft, Coins, ShoppingBag, Sparkles, Crown, Star, Check, Lock, CreditCard, Gift, Target, Clock } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { BattlePassPanel } from './BattlePassPanel';

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
  const [purchasingId, setPurchasingId] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const seasonalBundle = useMemo(() => getSeasonalBundles(), []);
  const quests = useMemo(() => getCosmeticQuests(), []);

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

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2">
              <Coins size={20} className="text-yellow-400" />
              <span className="text-yellow-300 font-bold text-lg">
                {balance.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all shadow-md"
            >
              <CreditCard size={16} />
              Buy Coins
            </button>
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
        <BattlePassPanel
          onBalanceChange={setBalance}
          toast={toast}
        />

        {/* Seasonal Bundle Section */}
        {seasonalBundle && (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-purple-500/5 backdrop-blur-md p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={22} className="text-pink-400" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                {seasonalBundle.name}
              </h2>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
                <Clock size={12} />
                {seasonalBundle.expiresIn} days left
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex gap-2">
                {seasonalBundle.items.map((item) => (
                  <div
                    key={item}
                    className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
                  >
                    <Sparkles size={20} className="text-purple-400/60" />
                  </div>
                ))}
              </div>
              <div className="flex-1 text-right">
                <div className="text-sm text-gray-500 line-through">
                  {seasonalBundle.originalPrice} coins
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Coins size={16} className="text-yellow-400" />
                  <span className="text-xl font-bold text-yellow-300">
                    {seasonalBundle.price}
                  </span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  20% Off
                </span>
              </div>
            </div>

            <button
              disabled={balance < seasonalBundle.price}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                balance >= seasonalBundle.price
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {balance >= seasonalBundle.price ? 'Buy Bundle' : 'Insufficient Coins'}
            </button>
          </div>
        )}

        {/* Weekly Quests Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target size={22} className="text-green-400" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
              Weekly Quests
            </h2>
          </div>

          <div className="space-y-3">
            {quests.map((quest) => {
              const progress = getQuestProgress(quest.id);
              const pct = Math.min((progress.current / quest.target) * 100, 100);
              return (
                <div
                  key={quest.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    progress.completed
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {quest.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-yellow-300">
                        <Coins size={12} className="text-yellow-400" />
                        {quest.reward}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress.completed
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {progress.current} / {quest.target}
                      {progress.completed && (
                        <span className="ml-2 text-green-400 font-medium">
                          Completed!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <CheckoutModal onClose={() => setShowCheckout(false)} />
        )}
      </div>
    </div>
  );
}

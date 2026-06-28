import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { getBalance, getShopItems, purchaseItem, getOwnedItems, equipItem, getEquippedItems, getSeasonalBundles, getCosmeticQuests, getQuestProgress } from '../../services/shop';
import { Coins, ShoppingBag, Sparkles, Crown, Star, Check, Lock, CreditCard, Gift, Target, Clock } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { BattlePassPanel } from './BattlePassPanel';
import { GameScreenShell } from '../../components/GameScreenShell';
import { LocalPreviewBadge } from '../../components/LocalPreviewBadge';
import { EmptyState } from '../../components/EmptyState';
import { haptic } from '../../lib/haptics';

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
        haptic('success');
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
    <GameScreenShell
      onBack={onBack}
      title="Cosmetic Shop"
      icon={ShoppingBag}
      maxWidth="max-w-2xl"
      backLabel="Back to lobby"
      badge={(
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <LocalPreviewBadge />
          <div className="game-hud-chip text-amber-200">
            <Coins size={16} className="text-amber-300" />
            <span className="font-bold tabular-nums">{balance.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="wordle-button wordle-primary text-xs min-h-[40px] px-3 py-2"
          >
            <CreditCard size={14} />
            Buy Coins
          </button>
        </div>
      )}
    >
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`game-segment whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'game-segment-selected' : ''}`}
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
                className={`relative rounded-2xl border backdrop-blur-md transition-all wordle-card !p-0 overflow-hidden ${
                  equipped
                    ? 'border-game-accent/40 ring-2 ring-game-accent/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {equipped && (
                  <div className="absolute inset-0 bg-game-accent/5 pointer-events-none" />
                )}

                <div className="flex items-center justify-center h-28 bg-gradient-to-b from-white/5 to-transparent">
                  {item.icon ? (
                    <span className="text-4xl">{item.icon}</span>
                  ) : (
                    <Sparkles size={36} className="text-game-accent/60" />
                  )}
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white truncate mb-1">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-3">
                    {equipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-game-accent bg-game-accent/15 px-2 py-0.5 rounded-full">
                        <Check size={10} />
                        Equipped
                      </span>
                    )}
                    {owned && !equipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Check size={10} />
                        Owned
                      </span>
                    )}
                    {!owned && (
                      <span className="flex items-center gap-1 text-sm">
                        <Coins size={14} className="text-amber-300" />
                        <span className="text-amber-200 font-bold tabular-nums">
                          {item.price}
                        </span>
                      </span>
                    )}
                  </div>

                  {!owned ? (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || purchasing}
                      className={`w-full wordle-button text-sm ${canAfford ? 'wordle-primary' : 'opacity-50 cursor-not-allowed'}`}
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
                      type="button"
                      onClick={() => handleEquip(item)}
                      className="w-full wordle-button text-sm border border-game-accent/30 text-game-accent hover:bg-game-accent/10"
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full wordle-button text-sm opacity-60 cursor-default"
                    >
                      Equipped
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon="🛍️"
                title="Nothing here yet"
                description="Try another category or earn coins from weekly quests below."
              />
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
          <div className="wordle-card p-5 mb-8 !shadow-none border-amber-500/15">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={22} className="text-pink-300" />
              <h2 className="text-lg font-bold text-white">
                {seasonalBundle.name}
              </h2>
              <div className="ml-auto game-hud-chip text-orange-200 text-xs">
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
                    <Sparkles size={20} className="text-game-accent/60" />
                  </div>
                ))}
              </div>
              <div className="flex-1 text-right">
                <div className="text-sm text-white/40 line-through tabular-nums">
                  {seasonalBundle.originalPrice} coins
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Coins size={16} className="text-amber-300" />
                  <span className="text-xl font-bold text-amber-200 tabular-nums">
                    {seasonalBundle.price}
                  </span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-game-accent/20 text-game-accent">
                  20% Off
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={balance < seasonalBundle.price}
              className={`w-full wordle-button ${balance >= seasonalBundle.price ? 'wordle-primary' : 'opacity-50 cursor-not-allowed'}`}
            >
              {balance >= seasonalBundle.price ? 'Buy Bundle' : 'Insufficient Coins'}
            </button>
          </div>
        )}

        <div className="wordle-card p-5 mb-8 !shadow-none">
          <div className="flex items-center gap-2 mb-4">
            <Target size={22} className="text-emerald-300" />
            <h2 className="text-lg font-bold text-white">
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
                  className={`game-list-row flex-col items-stretch !py-3 ${
                    progress.completed ? 'border-emerald-500/30 bg-emerald-500/10' : ''
                  }`}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {quest.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-200">
                        <Coins size={12} className="text-amber-300" />
                        {quest.reward}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress.completed ? 'bg-emerald-400' : 'bg-game-accent'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-white/45 mt-0.5 tabular-nums">
                      {progress.current} / {quest.target}
                      {progress.completed && (
                        <span className="ml-2 text-emerald-400 font-medium">
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

        {showCheckout && (
          <CheckoutModal onClose={() => setShowCheckout(false)} />
        )}
    </GameScreenShell>
  );
}

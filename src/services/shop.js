// Cosmetic shop service with virtual currency (Venn Coins)
import { loadJSON, saveJSON } from '../lib/storage';

const STORAGE_KEYS = {
  coins: 'vwf_coins',
  owned: 'vwf_shop_owned',
  equipped: 'vwf_shop_equipped',
  battlePass: 'vwf_battle_pass',
};

const SHOP_ITEMS = {
  AVATAR_PACKS: {
    animated_fire: { name: 'Animated Fire', price: 500, icon: '🔥', category: 'AVATAR_PACKS' },
    animated_star: { name: 'Animated Star', price: 500, icon: '✨', category: 'AVATAR_PACKS' },
    seasonal_snowflake: { name: 'Snowflake', price: 300, icon: '❄️', category: 'AVATAR_PACKS' },
    seasonal_sun: { name: 'Summer Sun', price: 300, icon: '☀️', category: 'AVATAR_PACKS' },
  },
  VENN_SKINS: {
    neon_glow: { name: 'Neon Glow', price: 800, gradient: 'from-cyan-400 to-purple-500', category: 'VENN_SKINS' },
    hand_drawn: { name: 'Hand Drawn', price: 600, gradient: 'from-amber-200 to-amber-400', category: 'VENN_SKINS' },
    pixel_art: { name: 'Pixel Art', price: 600, gradient: 'from-green-400 to-emerald-500', category: 'VENN_SKINS' },
    holographic: { name: 'Holographic', price: 1200, gradient: 'from-pink-300 via-purple-300 to-cyan-300', category: 'VENN_SKINS' },
  },
  SCORE_EFFECTS: {
    fireworks: { name: 'Fireworks', price: 400, category: 'SCORE_EFFECTS' },
    lightning: { name: 'Lightning Strike', price: 400, category: 'SCORE_EFFECTS' },
    rainbow: { name: 'Rainbow Burst', price: 600, category: 'SCORE_EFFECTS' },
  },
  TITLE_BADGES: {
    pun_master: { name: 'The Pun Master', price: 200, category: 'TITLE_BADGES' },
    night_owl: { name: 'Night Owl', price: 200, category: 'TITLE_BADGES' },
    speed_demon: { name: 'Speed Demon', price: 200, category: 'TITLE_BADGES' },
    wordsmith: { name: 'Wordsmith', price: 300, category: 'TITLE_BADGES' },
    big_brain: { name: 'Big Brain', price: 500, category: 'TITLE_BADGES' },
  },
};

const BATTLE_PASS_TIERS = 30;
const XP_PER_TIER = 100;

/**
 * Generates battle pass tier rewards.
 * Free track: every tier. Premium track: every 3 tiers.
 */
function generateBattlePassTiers() {
  const tiers = [];
  const rewardTypes = ['coins', 'avatar', 'skin', 'effect'];
  const avatarRewards = ['animated_fire', 'animated_star', 'seasonal_snowflake', 'seasonal_sun'];
  const skinRewards = ['neon_glow', 'hand_drawn', 'pixel_art', 'holographic'];
  const effectRewards = ['fireworks', 'lightning', 'rainbow'];

  for (let i = 1; i <= BATTLE_PASS_TIERS; i++) {
    const typeIndex = (i - 1) % rewardTypes.length;
    const rewardType = rewardTypes[typeIndex];

    let freeReward;
    switch (rewardType) {
      case 'coins':
        freeReward = { type: 'coins', amount: 50 + (i * 10) };
        break;
      case 'avatar':
        freeReward = { type: 'avatar', itemId: avatarRewards[(i - 1) % avatarRewards.length] };
        break;
      case 'skin':
        freeReward = { type: 'skin', itemId: skinRewards[(i - 1) % skinRewards.length] };
        break;
      case 'effect':
        freeReward = { type: 'effect', itemId: effectRewards[(i - 1) % effectRewards.length] };
        break;
    }

    const tier = {
      tier: i,
      xpRequired: i * XP_PER_TIER,
      freeReward,
    };

    if (i % 3 === 0) {
      const premiumTypeIndex = ((i / 3) - 1) % rewardTypes.length;
      const premiumType = rewardTypes[premiumTypeIndex];
      switch (premiumType) {
        case 'coins':
          tier.premiumReward = { type: 'coins', amount: 100 + (i * 15) };
          break;
        case 'avatar':
          tier.premiumReward = { type: 'avatar', itemId: avatarRewards[((i / 3) - 1) % avatarRewards.length] };
          break;
        case 'skin':
          tier.premiumReward = { type: 'skin', itemId: skinRewards[((i / 3) - 1) % skinRewards.length] };
          break;
        case 'effect':
          tier.premiumReward = { type: 'effect', itemId: effectRewards[((i / 3) - 1) % effectRewards.length] };
          break;
      }
    }

    tiers.push(tier);
  }

  return tiers;
}

// --- Internal helpers ---

function loadCoinsData() {
  return loadJSON(STORAGE_KEYS.coins, { balance: 0, transactions: [] });
}

function saveCoinsData(data) {
  saveJSON(STORAGE_KEYS.coins, data);
}

function findItemById(itemId) {
  for (const category of Object.values(SHOP_ITEMS)) {
    if (category[itemId]) {
      return { ...category[itemId], id: itemId };
    }
  }
  return null;
}

// --- Exported API ---

/**
 * Returns the current Venn Coins balance
 * @returns {number} Current coin balance
 */
export function getBalance() {
  return loadCoinsData().balance;
}

/**
 * Adds coins to the balance with a transaction log entry
 * @param {number} amount - Number of coins to add
 * @param {string} reason - Description of why coins were added
 * @returns {number} New balance
 */
export function addCoins(amount, reason) {
  const data = loadCoinsData();
  data.balance += amount;
  data.transactions.unshift({
    amount,
    reason,
    timestamp: new Date().toISOString(),
  });
  saveCoinsData(data);
  return data.balance;
}

/**
 * Deducts coins if the balance is sufficient
 * @param {number} amount - Number of coins to spend
 * @param {string} itemId - Optional item identifier for the transaction
 * @returns {boolean} Whether the spend succeeded
 */
export function spendCoins(amount, itemId) {
  const data = loadCoinsData();
  if (data.balance < amount) {
    return false;
  }
  data.balance -= amount;
  data.transactions.unshift({
    amount: -amount,
    reason: 'purchase',
    itemId,
    timestamp: new Date().toISOString(),
  });
  saveCoinsData(data);
  return true;
}

/**
 * Returns recent transactions
 * @returns {Array} Array of transaction objects
 */
export function getTransactionHistory() {
  return loadCoinsData().transactions;
}

/**
 * Returns all purchasable shop items as a flat array
 * @returns {Array<{id: string, name: string, price: number, category: string}>}
 */
export function getShopItems() {
  const items = [];
  for (const category of Object.values(SHOP_ITEMS)) {
    for (const [id, item] of Object.entries(category)) {
      items.push({ ...item, id });
    }
  }
  return items;
}

/**
 * Purchases an item by ID, deducting coins and unlocking it
 * @param {string} itemId - The item to purchase
 * @returns {{ success: boolean, error?: string }} Result of the purchase
 */
export function purchaseItem(itemId) {
  const item = findItemById(itemId);
  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  if (isItemOwned(itemId)) {
    return { success: false, error: 'Item already owned' };
  }

  if (!spendCoins(item.price, itemId)) {
    return { success: false, error: 'Insufficient coins' };
  }

  const owned = loadJSON(STORAGE_KEYS.owned, []);
  owned.push({
    itemId,
    category: item.category,
    purchasedAt: new Date().toISOString(),
  });
  saveJSON(STORAGE_KEYS.owned, owned);

  return { success: true };
}

/**
 * Returns all purchased items
 * @returns {Array} Array of owned item records
 */
export function getOwnedItems() {
  return loadJSON(STORAGE_KEYS.owned, []);
}

/**
 * Checks whether the player owns a specific item
 * @param {string} itemId - The item to check
 * @returns {boolean}
 */
export function isItemOwned(itemId) {
  const owned = loadJSON(STORAGE_KEYS.owned, []);
  return owned.some(entry => entry.itemId === itemId);
}

/**
 * Equips an owned item, setting it as active for its category
 * @param {string} itemId - The item to equip
 * @returns {{ success: boolean, error?: string }}
 */
export function equipItem(itemId) {
  if (!isItemOwned(itemId)) {
    return { success: false, error: 'Item not owned' };
  }

  const item = findItemById(itemId);
  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  const equipped = loadJSON(STORAGE_KEYS.equipped, {});
  equipped[item.category] = itemId;
  saveJSON(STORAGE_KEYS.equipped, equipped);

  return { success: true };
}

/**
 * Returns currently equipped items keyed by category
 * @returns {Object} Map of category to equipped itemId
 */
export function getEquippedItems() {
  return loadJSON(STORAGE_KEYS.equipped, {});
}

/**
 * Returns the current season battle pass with all tiers
 * @returns {Object} Battle pass data including tiers and claimed rewards
 */
export function getBattlePass() {
  const saved = loadJSON(STORAGE_KEYS.battlePass, null);
  const tiers = generateBattlePassTiers();

  if (!saved) {
    return {
      season: 1,
      tiers,
      xp: 0,
      claimedFree: [],
      claimedPremium: [],
      premium: false,
    };
  }

  return { ...saved, tiers };
}

/**
 * Claims a reward at the given battle pass tier
 * @param {number} tier - The tier number to claim (1-based)
 * @returns {{ success: boolean, reward?: Object, error?: string }}
 */
export function claimBattlePassReward(tier) {
  const bp = getBattlePass();
  const { currentTier } = getBattlePassProgress();

  if (tier < 1 || tier > BATTLE_PASS_TIERS) {
    return { success: false, error: 'Invalid tier' };
  }

  if (tier > currentTier) {
    return { success: false, error: 'Tier not yet reached' };
  }

  const tierData = bp.tiers[tier - 1];

  // Determine which reward track to claim
  const isFreeClaimed = bp.claimedFree.includes(tier);
  const isPremiumAvailable = tierData.premiumReward && bp.premium;
  const isPremiumClaimed = bp.claimedPremium.includes(tier);

  let reward = null;

  if (!isFreeClaimed) {
    reward = tierData.freeReward;
    bp.claimedFree.push(tier);
  } else if (isPremiumAvailable && !isPremiumClaimed) {
    reward = tierData.premiumReward;
    bp.claimedPremium.push(tier);
  } else {
    return { success: false, error: 'Reward already claimed' };
  }

  // Grant the reward
  if (reward) {
    if (reward.type === 'coins') {
      addCoins(reward.amount, `Battle Pass Tier ${tier} reward`);
    } else if (reward.itemId) {
      if (!isItemOwned(reward.itemId)) {
        const owned = loadJSON(STORAGE_KEYS.owned, []);
        const item = findItemById(reward.itemId);
        owned.push({
          itemId: reward.itemId,
          category: item ? item.category : 'unknown',
          purchasedAt: new Date().toISOString(),
          source: 'battle_pass',
        });
        saveJSON(STORAGE_KEYS.owned, owned);
      }
    }
  }

  // Save updated battle pass state (without regenerated tiers)
  const { tiers: _tiers, ...bpState } = bp;
  saveJSON(STORAGE_KEYS.battlePass, bpState);

  return { success: true, reward };
}

/**
 * Returns the player's current battle pass progress
 * @returns {{ currentTier: number, xp: number, nextTierXp: number }}
 */
export function getBattlePassProgress() {
  const bp = getBattlePass();
  const totalXp = bp.xp || 0;
  const currentTier = Math.min(Math.floor(totalXp / XP_PER_TIER), BATTLE_PASS_TIERS);
  const xpIntoCurrentTier = totalXp - (currentTier * XP_PER_TIER);
  const nextTierXp = currentTier < BATTLE_PASS_TIERS ? XP_PER_TIER - xpIntoCurrentTier : 0;

  return {
    currentTier,
    xp: totalXp,
    nextTierXp,
  };
}

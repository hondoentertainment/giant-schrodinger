import { loadJSON, saveJSON } from '../lib/storage';

const STORAGE_KEY = 'vwf_ranked';
const PLACEMENT_TOTAL = 5;
const STARTING_RATING = 1000;
const K_FACTOR_PLACEMENT = 32;
const K_FACTOR_REGULAR = 24;
const DECAY_DAYS = 3;
const DECAY_AMOUNT = 15;
const SEASON_DURATION_WEEKS = 8;

const TIERS = [
  { tier: 0, name: 'Bronze', minRating: 0, color: 'from-amber-700 to-amber-800' },
  { tier: 1, name: 'Silver', minRating: 800, color: 'from-slate-300 to-slate-500' },
  { tier: 2, name: 'Gold', minRating: 1200, color: 'from-yellow-400 to-amber-500' },
  { tier: 3, name: 'Platinum', minRating: 1600, color: 'from-cyan-300 to-blue-500' },
  { tier: 4, name: 'Diamond', minRating: 2000, color: 'from-blue-400 to-purple-500' },
  { tier: 5, name: 'Venn Master', minRating: 2400, color: 'from-purple-400 to-pink-500' },
];

const SEASON_NAMES = [
  'The Wit Awakens',
  'Pun Intended',
  'Brain Storm',
  'Word Play',
  'Mind Meld',
  'Synapse Fire',
  'Neural Link',
  'Thought Forge',
];

const SEASON_REWARDS = [
  { tier: 0, name: 'Bronze', rewards: { coins: 100, badge: 'bronze_finisher', title: 'Bronze Thinker' } },
  { tier: 1, name: 'Silver', rewards: { coins: 250, badge: 'silver_finisher', title: 'Silver Strategist' } },
  { tier: 2, name: 'Gold', rewards: { coins: 500, badge: 'gold_finisher', title: 'Gold Wordsmith' } },
  { tier: 3, name: 'Platinum', rewards: { coins: 1000, badge: 'platinum_finisher', title: 'Platinum Prodigy' } },
  { tier: 4, name: 'Diamond', rewards: { coins: 2000, badge: 'diamond_finisher', title: 'Diamond Virtuoso' } },
  { tier: 5, name: 'Venn Master', rewards: { coins: 5000, badge: 'venn_master_finisher', title: 'Venn Master Supreme' } },
];

function loadData() {
  return loadJSON(STORAGE_KEY, null);
}

function saveData(data) {
  saveJSON(STORAGE_KEY, data);
}

function getDefaultData() {
  return {
    rating: STARTING_RATING,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    seasonBest: STARTING_RATING,
    placementWins: 0,
    placementLosses: 0,
    lastGameDate: null,
    seasonHistory: [],
    currentSeasonId: null,
  };
}

function ensureData() {
  let data = loadData();
  if (!data) {
    data = getDefaultData();
    const season = getCurrentSeason();
    data.currentSeasonId = season.id;
    saveData(data);
  }
  return data;
}

function computeSeasonFromIndex(index) {
  const epoch = new Date('2025-01-06T00:00:00Z');
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const seasonDurationMs = SEASON_DURATION_WEEKS * msPerWeek;

  const startDate = new Date(epoch.getTime() + index * seasonDurationMs);
  const endDate = new Date(startDate.getTime() + seasonDurationMs - 1);
  const name = SEASON_NAMES[index % SEASON_NAMES.length];
  const id = `season_${index + 1}`;

  return { id, index, name, startDate, endDate };
}

export function getCurrentSeason() {
  const now = new Date();
  const epoch = new Date('2025-01-06T00:00:00Z');
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const seasonDurationMs = SEASON_DURATION_WEEKS * msPerWeek;

  const elapsed = now.getTime() - epoch.getTime();
  const seasonIndex = Math.max(0, Math.floor(elapsed / seasonDurationMs));
  const season = computeSeasonFromIndex(seasonIndex);

  const withinSeason = now.getTime() - season.startDate.getTime();
  const weekNumber = Math.floor(withinSeason / msPerWeek) + 1;

  return {
    id: season.id,
    name: season.name,
    startDate: season.startDate.toISOString(),
    endDate: season.endDate.toISOString(),
    weekNumber,
  };
}

export function getRankTier(rating) {
  let result = TIERS[0];
  for (const tier of TIERS) {
    if (rating >= tier.minRating) {
      result = tier;
    }
  }
  return { ...result };
}

export function getSubRank(rating) {
  const tier = getRankTier(rating);
  const tierStart = tier.minRating;
  const nextTier = TIERS.find(t => t.tier === tier.tier + 1);
  const tierRange = (nextTier ? nextTier.minRating : 3000) - tierStart;
  const progress = rating - tierStart;
  const subRank = Math.min(4, Math.floor((progress / tierRange) * 4) + 1);
  return { ...tier, subRank, display: `${tier.name} ${['I','II','III','IV'][subRank-1]}` };
}

export function getPlayerRating() {
  const data = ensureData();
  const tierInfo = getRankTier(data.rating);

  return {
    rating: data.rating,
    tier: tierInfo.tier,
    tierName: tierInfo.name,
    gamesPlayed: data.gamesPlayed,
    wins: data.wins,
    losses: data.losses,
    seasonBest: data.seasonBest,
  };
}

export function isPlacementComplete() {
  const data = ensureData();
  return (data.placementWins + data.placementLosses) >= PLACEMENT_TOTAL;
}

export function getPlacementProgress() {
  const data = ensureData();
  return {
    completed: data.placementWins + data.placementLosses,
    total: PLACEMENT_TOTAL,
    wins: data.placementWins,
    losses: data.placementLosses,
  };
}

export function recordRankedMatch(opponentRating, won, score) {
  const data = ensureData();
  const inPlacement = !isPlacementComplete();
  const kFactor = inPlacement ? K_FACTOR_PLACEMENT : K_FACTOR_REGULAR;

  const expected = 1 / (1 + Math.pow(10, (opponentRating - data.rating) / 400));
  const actual = won ? 1 : 0;
  const ratingChange = Math.round(kFactor * (actual - expected));

  data.rating = Math.max(0, data.rating + ratingChange);
  data.gamesPlayed += 1;

  if (won) {
    data.wins += 1;
    if (inPlacement) data.placementWins += 1;
  } else {
    data.losses += 1;
    if (inPlacement) data.placementLosses += 1;
  }

  if (data.rating > data.seasonBest) {
    data.seasonBest = data.rating;
  }

  data.lastGameDate = new Date().toISOString();

  saveData(data);

  return {
    newRating: data.rating,
    ratingChange,
    tier: getRankTier(data.rating),
    placementComplete: isPlacementComplete(),
    score,
  };
}

export function getSeasonRewards(tier) {
  const entry = SEASON_REWARDS.find((r) => r.tier === tier);
  if (!entry) return null;
  return { ...entry.rewards };
}

export function checkDecay() {
  const data = ensureData();
  if (!data.lastGameDate) return { decayed: false, rating: data.rating };

  const lastGame = new Date(data.lastGameDate);
  const now = new Date();
  const daysSinceLastGame = (now.getTime() - lastGame.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastGame >= DECAY_DAYS) {
    const decayCycles = Math.floor(daysSinceLastGame / DECAY_DAYS);
    const totalDecay = decayCycles * DECAY_AMOUNT;
    const oldRating = data.rating;
    data.rating = Math.max(0, data.rating - totalDecay);
    saveData(data);

    return {
      decayed: true,
      ratingLost: oldRating - data.rating,
      rating: data.rating,
      daysSinceLastGame: Math.floor(daysSinceLastGame),
    };
  }

  return { decayed: false, rating: data.rating };
}

export const SEASON_RESET_TYPE = 'soft'; // 'soft' | 'hard'

export function applyDecayOnLoad() {
  const data = loadData();
  if (!data?.lastGameDate) return null;

  const daysSince = Math.floor((Date.now() - new Date(data.lastGameDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince < DECAY_DAYS) return null;

  const decayPeriods = Math.floor(daysSince / DECAY_DAYS);
  const totalDecay = decayPeriods * DECAY_AMOUNT;
  const oldRating = data.rating;
  const newRating = Math.max(0, oldRating - totalDecay);

  saveData({ ...data, rating: newRating, lastDecayAt: Date.now() });

  return { oldRating, newRating, decayAmount: oldRating - newRating, daysSince };
}

export function applySeasonalReset() {
  const data = loadData();
  if (!data) return null;

  const season = getCurrentSeason();
  if (data.currentSeasonId === season.id) return null; // Already reset for this season

  const oldRating = data.rating;
  let newRating;

  if (SEASON_RESET_TYPE === 'soft') {
    // Pull toward 1000 by 50%
    newRating = Math.round(1000 + (oldRating - 1000) * 0.5);
  } else {
    newRating = 1000;
  }

  // Archive old season
  const archive = JSON.parse(localStorage.getItem('venn_season_archive') || '[]');
  if (data.currentSeasonId && data.gamesPlayed > 0) {
    archive.push({
      seasonId: data.currentSeasonId,
      finalRating: oldRating,
      tier: getRankTier(oldRating)?.name,
      timestamp: Date.now(),
    });
    localStorage.setItem('venn_season_archive', JSON.stringify(archive));
  }

  // Apply reset
  saveData({
    ...data,
    rating: newRating,
    seasonBest: newRating,
    currentSeasonId: season.id,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    placementWins: 0,
    placementLosses: 0,
    lastGameDate: null,
  });

  return { oldRating, newRating, seasonName: season.name };
}

export function getSeasonArchive() {
  return JSON.parse(localStorage.getItem('venn_season_archive') || '[]');
}

export function getSeasonHistory() {
  const data = ensureData();
  return [...data.seasonHistory];
}

export function resetForNewSeason() {
  const data = ensureData();
  const season = getCurrentSeason();

  // Archive current season
  if (data.currentSeasonId && data.gamesPlayed > 0) {
    const tierInfo = getRankTier(data.rating);
    data.seasonHistory.push({
      seasonId: data.currentSeasonId,
      finalRating: data.rating,
      seasonBest: data.seasonBest,
      tier: tierInfo.tier,
      tierName: tierInfo.name,
      gamesPlayed: data.gamesPlayed,
      wins: data.wins,
      losses: data.losses,
    });
  }

  // Soft reset: pull rating toward the starting rating
  const softResetRating = Math.round((data.rating + STARTING_RATING) / 2);

  data.rating = softResetRating;
  data.gamesPlayed = 0;
  data.wins = 0;
  data.losses = 0;
  data.seasonBest = softResetRating;
  data.placementWins = 0;
  data.placementLosses = 0;
  data.lastGameDate = null;
  data.currentSeasonId = season.id;

  saveData(data);

  return {
    newRating: softResetRating,
    seasonId: season.id,
    seasonName: season.name,
  };
}

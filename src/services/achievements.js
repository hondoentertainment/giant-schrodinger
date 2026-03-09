import { loadJSON, saveJSON } from '../lib/storage';

const STORAGE_KEY = 'vwf_achievements';

const ACHIEVEMENT_DEFINITIONS = [
  // MASTERY
  { id: 'perfect_10', name: 'Perfect 10', description: 'Score 10/10 on any round', category: 'MASTERY', points: 10, icon: '🎯' },
  { id: 'double_perfect', name: 'Double Trouble', description: 'Score 10/10 twice in one session', category: 'MASTERY', points: 25, icon: '🎯🎯' },
  { id: 'flawless_week', name: 'Flawless Week', description: '7 daily challenges with all scores 8+', category: 'MASTERY', points: 50, icon: '🌟' },
  { id: 'score_streak_3', name: 'Hat Trick', description: '3 consecutive scores of 8+', category: 'MASTERY', points: 15, icon: '🎩' },
  { id: 'score_streak_5', name: 'On Fire', description: '5 consecutive scores of 8+', category: 'MASTERY', points: 30, icon: '🔥' },
  { id: 'avg_8_over_20', name: 'Wordsmith', description: 'Average 8+ over 20 rounds', category: 'MASTERY', points: 40, icon: '✍️' },
  { id: 'avg_9_over_10', name: 'Genius', description: 'Average 9+ over 10 rounds', category: 'MASTERY', points: 60, icon: '🧠' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Score 9+ on a Speed Round', category: 'MASTERY', points: 20, icon: '⚡' },
  { id: 'double_or_nothing_win', name: 'High Roller', description: 'Win Double or Nothing with 9+', category: 'MASTERY', points: 25, icon: '🎰' },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Score 9+ after scoring below 4', category: 'MASTERY', points: 15, icon: '💪' },

  // SOCIAL
  { id: 'first_share', name: 'Sharer', description: 'Share your first result', category: 'SOCIAL', points: 5, icon: '📤' },
  { id: 'ten_shares', name: 'Broadcaster', description: 'Share 10 results', category: 'SOCIAL', points: 15, icon: '📡' },
  { id: 'first_challenge', name: 'Challenger', description: 'Send first challenge', category: 'SOCIAL', points: 5, icon: '⚔️' },
  { id: 'win_challenge', name: 'Champion', description: 'Win a challenge', category: 'SOCIAL', points: 10, icon: '🏆' },
  { id: 'win_5_challenges', name: 'Dominator', description: 'Win 5 challenges', category: 'SOCIAL', points: 25, icon: '👑' },
  { id: 'influencer', name: 'Influencer', description: 'Get 10 referrals', category: 'SOCIAL', points: 40, icon: '🌐' },
  { id: 'judge_10', name: 'Fair Judge', description: 'Judge 10 connections', category: 'SOCIAL', points: 15, icon: '⚖️' },
  { id: 'rivalry', name: 'Rivalry', description: 'Beat same friend 5 times', category: 'SOCIAL', points: 30, icon: '🥊' },

  // EXPLORER
  { id: 'theme_tourist', name: 'Theme Tourist', description: 'Play every theme', category: 'EXPLORER', points: 20, icon: '🗺️' },
  { id: 'night_owl', name: 'Night Owl', description: 'Play between 2-4am', category: 'EXPLORER', points: 10, icon: '🦉' },
  { id: 'early_bird', name: 'Early Bird', description: 'Play before 6am', category: 'EXPLORER', points: 10, icon: '🐦' },
  { id: 'marathon', name: 'Marathon', description: 'Play 10 rounds in one session', category: 'EXPLORER', points: 20, icon: '🏃' },
  { id: 'daily_devotee', name: 'Daily Devotee', description: 'Complete 30 daily challenges', category: 'EXPLORER', points: 35, icon: '📅' },
  { id: 'custom_creator', name: 'Creator', description: 'Create a custom theme', category: 'EXPLORER', points: 15, icon: '🎨' },
  { id: 'pack_explorer', name: 'Pack Explorer', description: 'Play all built-in prompt packs', category: 'EXPLORER', points: 20, icon: '📦' },

  // STREAK
  { id: 'streak_3', name: 'Getting Started', description: '3-day streak', category: 'STREAK', points: 5, icon: '🔗' },
  { id: 'streak_7', name: 'Committed', description: '7-day streak', category: 'STREAK', points: 15, icon: '⛓️' },
  { id: 'streak_14', name: 'Dedicated', description: '14-day streak', category: 'STREAK', points: 30, icon: '💎' },
  { id: 'streak_30', name: 'Legendary', description: '30-day streak', category: 'STREAK', points: 60, icon: '🏅' },
  { id: 'streak_50', name: 'Unstoppable', description: '50-day streak', category: 'STREAK', points: 100, icon: '🚀' },

  // RANKED
  { id: 'placement_done', name: 'Ranked Ready', description: 'Complete placement matches', category: 'RANKED', points: 10, icon: '🎖️' },
  { id: 'reach_silver', name: 'Silver Tongue', description: 'Reach Silver tier', category: 'RANKED', points: 15, icon: '🥈' },
  { id: 'reach_gold', name: 'Golden Words', description: 'Reach Gold tier', category: 'RANKED', points: 25, icon: '🥇' },
  { id: 'reach_platinum', name: 'Platinum Prose', description: 'Reach Platinum tier', category: 'RANKED', points: 40, icon: '💠' },
  { id: 'reach_diamond', name: 'Diamond Mind', description: 'Reach Diamond tier', category: 'RANKED', points: 60, icon: '💎' },
  { id: 'venn_master', name: 'Venn Master', description: 'Reach Venn Master tier', category: 'RANKED', points: 100, icon: '👁️' },
];

function loadState() {
  return loadJSON(STORAGE_KEY, { unlocked: {}, sessionPerfectCount: 0, highScoreStreak: 0 });
}

function saveState(state) {
  saveJSON(STORAGE_KEY, state);
}

function buildAchievement(def, unlockedAt) {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    points: def.points,
    icon: def.icon,
    unlockedAt: unlockedAt || null,
  };
}

function unlock(state, id) {
  if (!state.unlocked[id]) {
    state.unlocked[id] = Date.now();
    return true;
  }
  return false;
}

/**
 * Checks all achievements against the current context and returns newly unlocked ones.
 *
 * @param {Object} context
 * @param {number} context.score - Current round score (0-10)
 * @param {boolean} context.isSpeedRound
 * @param {boolean} context.isDoubleOrNothing
 * @param {number} context.previousScore - Score from the prior round
 * @param {Object} context.stats - Player stats (totalRounds, averageScore, currentStreak, scores, dailyScores, etc.)
 * @param {Object} context.rankedData - Ranked mode data (placementComplete, tier, etc.)
 * @param {number} context.shareCount
 * @param {number} context.challengeWins
 * @param {number} context.judgeCount
 * @param {number} context.referralCount
 * @param {string[]} context.themesPlayed
 * @param {string[]} context.packsPlayed
 * @param {number} context.customThemesCreated
 * @param {number} context.dailyChallengesCompleted
 * @param {number} context.sessionRoundCount
 * @returns {Object[]} Array of newly unlocked achievement objects
 */
export function checkAchievements(context = {}) {
  const state = loadState();
  const newlyUnlocked = [];

  const {
    score,
    isSpeedRound,
    isDoubleOrNothing,
    previousScore,
    stats = {},
    rankedData = {},
    shareCount = 0,
    challengeWins = 0,
    judgeCount = 0,
    referralCount = 0,
    themesPlayed = [],
    packsPlayed = [],
    customThemesCreated = 0,
    dailyChallengesCompleted = 0,
    sessionRoundCount = 0,
  } = context;

  const scores = stats.scores || [];
  const currentStreak = stats.currentStreak || 0;
  const totalRounds = stats.totalRounds || 0;
  const dailyScores = stats.dailyScores || [];
  const rivalryWins = stats.rivalryWins || 0;
  const challengesSent = stats.challengesSent || 0;
  const totalThemes = stats.totalThemes || 0;
  const totalPacks = stats.totalPacks || 0;

  const hour = new Date().getHours();

  // Track session perfect count
  if (score === 10) {
    state.sessionPerfectCount = (state.sessionPerfectCount || 0) + 1;
  }

  // Track high score streak
  if (score !== undefined) {
    if (score >= 8) {
      state.highScoreStreak = (state.highScoreStreak || 0) + 1;
    } else {
      state.highScoreStreak = 0;
    }
  }

  // ---- MASTERY ----

  if (score === 10) {
    if (unlock(state, 'perfect_10')) {
      newlyUnlocked.push('perfect_10');
    }
  }

  if ((state.sessionPerfectCount || 0) >= 2) {
    if (unlock(state, 'double_perfect')) {
      newlyUnlocked.push('double_perfect');
    }
  }

  if (dailyScores.length >= 7) {
    const lastSeven = dailyScores.slice(-7);
    if (lastSeven.every((s) => s >= 8)) {
      if (unlock(state, 'flawless_week')) {
        newlyUnlocked.push('flawless_week');
      }
    }
  }

  if ((state.highScoreStreak || 0) >= 3) {
    if (unlock(state, 'score_streak_3')) {
      newlyUnlocked.push('score_streak_3');
    }
  }

  if ((state.highScoreStreak || 0) >= 5) {
    if (unlock(state, 'score_streak_5')) {
      newlyUnlocked.push('score_streak_5');
    }
  }

  if (scores.length >= 20) {
    const last20 = scores.slice(-20);
    const avg = last20.reduce((a, b) => a + b, 0) / last20.length;
    if (avg >= 8) {
      if (unlock(state, 'avg_8_over_20')) {
        newlyUnlocked.push('avg_8_over_20');
      }
    }
  }

  if (scores.length >= 10) {
    const last10 = scores.slice(-10);
    const avg = last10.reduce((a, b) => a + b, 0) / last10.length;
    if (avg >= 9) {
      if (unlock(state, 'avg_9_over_10')) {
        newlyUnlocked.push('avg_9_over_10');
      }
    }
  }

  if (isSpeedRound && score >= 9) {
    if (unlock(state, 'speed_demon')) {
      newlyUnlocked.push('speed_demon');
    }
  }

  if (isDoubleOrNothing && score >= 9) {
    if (unlock(state, 'double_or_nothing_win')) {
      newlyUnlocked.push('double_or_nothing_win');
    }
  }

  if (score >= 9 && previousScore !== undefined && previousScore < 4) {
    if (unlock(state, 'comeback_kid')) {
      newlyUnlocked.push('comeback_kid');
    }
  }

  // ---- SOCIAL ----

  if (shareCount >= 1) {
    if (unlock(state, 'first_share')) {
      newlyUnlocked.push('first_share');
    }
  }

  if (shareCount >= 10) {
    if (unlock(state, 'ten_shares')) {
      newlyUnlocked.push('ten_shares');
    }
  }

  if (challengesSent >= 1) {
    if (unlock(state, 'first_challenge')) {
      newlyUnlocked.push('first_challenge');
    }
  }

  if (challengeWins >= 1) {
    if (unlock(state, 'win_challenge')) {
      newlyUnlocked.push('win_challenge');
    }
  }

  if (challengeWins >= 5) {
    if (unlock(state, 'win_5_challenges')) {
      newlyUnlocked.push('win_5_challenges');
    }
  }

  if (referralCount >= 10) {
    if (unlock(state, 'influencer')) {
      newlyUnlocked.push('influencer');
    }
  }

  if (judgeCount >= 10) {
    if (unlock(state, 'judge_10')) {
      newlyUnlocked.push('judge_10');
    }
  }

  if (rivalryWins >= 5) {
    if (unlock(state, 'rivalry')) {
      newlyUnlocked.push('rivalry');
    }
  }

  // ---- EXPLORER ----

  if (totalThemes > 0 && themesPlayed.length >= totalThemes) {
    if (unlock(state, 'theme_tourist')) {
      newlyUnlocked.push('theme_tourist');
    }
  }

  if (hour >= 2 && hour < 4) {
    if (unlock(state, 'night_owl')) {
      newlyUnlocked.push('night_owl');
    }
  }

  if (hour < 6) {
    if (unlock(state, 'early_bird')) {
      newlyUnlocked.push('early_bird');
    }
  }

  if (sessionRoundCount >= 10) {
    if (unlock(state, 'marathon')) {
      newlyUnlocked.push('marathon');
    }
  }

  if (dailyChallengesCompleted >= 30) {
    if (unlock(state, 'daily_devotee')) {
      newlyUnlocked.push('daily_devotee');
    }
  }

  if (customThemesCreated >= 1) {
    if (unlock(state, 'custom_creator')) {
      newlyUnlocked.push('custom_creator');
    }
  }

  if (totalPacks > 0 && packsPlayed.length >= totalPacks) {
    if (unlock(state, 'pack_explorer')) {
      newlyUnlocked.push('pack_explorer');
    }
  }

  // ---- STREAK ----

  if (currentStreak >= 3) {
    if (unlock(state, 'streak_3')) {
      newlyUnlocked.push('streak_3');
    }
  }

  if (currentStreak >= 7) {
    if (unlock(state, 'streak_7')) {
      newlyUnlocked.push('streak_7');
    }
  }

  if (currentStreak >= 14) {
    if (unlock(state, 'streak_14')) {
      newlyUnlocked.push('streak_14');
    }
  }

  if (currentStreak >= 30) {
    if (unlock(state, 'streak_30')) {
      newlyUnlocked.push('streak_30');
    }
  }

  if (currentStreak >= 50) {
    if (unlock(state, 'streak_50')) {
      newlyUnlocked.push('streak_50');
    }
  }

  // ---- RANKED ----

  if (rankedData.placementComplete) {
    if (unlock(state, 'placement_done')) {
      newlyUnlocked.push('placement_done');
    }
  }

  const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Venn Master'];
  const tierIndex = tierOrder.indexOf(rankedData.tier);

  if (tierIndex >= 1) {
    if (unlock(state, 'reach_silver')) {
      newlyUnlocked.push('reach_silver');
    }
  }
  if (tierIndex >= 2) {
    if (unlock(state, 'reach_gold')) {
      newlyUnlocked.push('reach_gold');
    }
  }
  if (tierIndex >= 3) {
    if (unlock(state, 'reach_platinum')) {
      newlyUnlocked.push('reach_platinum');
    }
  }
  if (tierIndex >= 4) {
    if (unlock(state, 'reach_diamond')) {
      newlyUnlocked.push('reach_diamond');
    }
  }
  if (tierIndex >= 5) {
    if (unlock(state, 'venn_master')) {
      newlyUnlocked.push('venn_master');
    }
  }

  saveState(state);

  return newlyUnlocked.map((id) => {
    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
    return buildAchievement(def, state.unlocked[id]);
  });
}

/**
 * Returns all achievements with their current unlock status.
 * @returns {Object[]}
 */
export function getAchievements() {
  const state = loadState();
  return ACHIEVEMENT_DEFINITIONS.map((def) =>
    buildAchievement(def, state.unlocked[def.id] || null)
  );
}

/**
 * Returns only unlocked achievements.
 * @returns {Object[]}
 */
export function getUnlockedAchievements() {
  const state = loadState();
  return ACHIEVEMENT_DEFINITIONS
    .filter((def) => state.unlocked[def.id])
    .map((def) => buildAchievement(def, state.unlocked[def.id]));
}

/**
 * Returns progress toward a specific achievement.
 * @param {string} achievementId
 * @returns {{ current: number, target: number, percentage: number }}
 */
export function getAchievementProgress(achievementId) {
  const state = loadState();

  if (state.unlocked[achievementId]) {
    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
    if (!def) return { current: 0, target: 0, percentage: 0 };
    return { current: 1, target: 1, percentage: 100 };
  }

  const progressMap = {
    perfect_10: () => ({ current: 0, target: 1 }),
    double_perfect: () => ({ current: state.sessionPerfectCount || 0, target: 2 }),
    flawless_week: () => ({ current: 0, target: 7 }),
    score_streak_3: () => ({ current: Math.min(state.highScoreStreak || 0, 3), target: 3 }),
    score_streak_5: () => ({ current: Math.min(state.highScoreStreak || 0, 5), target: 5 }),
    avg_8_over_20: () => ({ current: 0, target: 20 }),
    avg_9_over_10: () => ({ current: 0, target: 10 }),
    speed_demon: () => ({ current: 0, target: 1 }),
    double_or_nothing_win: () => ({ current: 0, target: 1 }),
    comeback_kid: () => ({ current: 0, target: 1 }),
    first_share: () => ({ current: 0, target: 1 }),
    ten_shares: () => ({ current: 0, target: 10 }),
    first_challenge: () => ({ current: 0, target: 1 }),
    win_challenge: () => ({ current: 0, target: 1 }),
    win_5_challenges: () => ({ current: 0, target: 5 }),
    influencer: () => ({ current: 0, target: 10 }),
    judge_10: () => ({ current: 0, target: 10 }),
    rivalry: () => ({ current: 0, target: 5 }),
    theme_tourist: () => ({ current: 0, target: 1 }),
    night_owl: () => ({ current: 0, target: 1 }),
    early_bird: () => ({ current: 0, target: 1 }),
    marathon: () => ({ current: 0, target: 10 }),
    daily_devotee: () => ({ current: 0, target: 30 }),
    custom_creator: () => ({ current: 0, target: 1 }),
    pack_explorer: () => ({ current: 0, target: 1 }),
    streak_3: () => ({ current: 0, target: 3 }),
    streak_7: () => ({ current: 0, target: 7 }),
    streak_14: () => ({ current: 0, target: 14 }),
    streak_30: () => ({ current: 0, target: 30 }),
    streak_50: () => ({ current: 0, target: 50 }),
    placement_done: () => ({ current: 0, target: 1 }),
    reach_silver: () => ({ current: 0, target: 1 }),
    reach_gold: () => ({ current: 0, target: 1 }),
    reach_platinum: () => ({ current: 0, target: 1 }),
    reach_diamond: () => ({ current: 0, target: 1 }),
    venn_master: () => ({ current: 0, target: 1 }),
  };

  const getter = progressMap[achievementId];
  if (!getter) {
    return { current: 0, target: 0, percentage: 0 };
  }

  const { current, target } = getter();
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return { current, target, percentage };
}

/**
 * Returns total points from all unlocked achievements.
 * @returns {number}
 */
export function getAchievementPoints() {
  const state = loadState();
  return ACHIEVEMENT_DEFINITIONS
    .filter((def) => state.unlocked[def.id])
    .reduce((sum, def) => sum + def.points, 0);
}

/**
 * Returns achievements filtered by category.
 * @param {string} category - One of MASTERY, SOCIAL, EXPLORER, STREAK, RANKED
 * @returns {Object[]}
 */
export function getAchievementsByCategory(category) {
  const state = loadState();
  return ACHIEVEMENT_DEFINITIONS
    .filter((def) => def.category === category)
    .map((def) => buildAchievement(def, state.unlocked[def.id] || null));
}

/**
 * Returns share text for an achievement.
 * @param {Object} achievement
 * @returns {string}
 */
export function shareAchievement(achievement) {
  if (!achievement) return '';
  const status = achievement.unlockedAt ? 'Unlocked' : 'Locked';
  return `${achievement.icon} ${achievement.name} - ${achievement.description} (${achievement.points} pts) [${status}]`;
}

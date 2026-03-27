/**
 * Leaderboard Service
 *
 * Daily/weekly leaderboard system using localStorage.
 * Simulates what would be a server-side leaderboard.
 */

const STORAGE_KEY = 'vwf_leaderboard';

/**
 * Returns today's date key in YYYY-MM-DD format.
 */
export function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Returns the current week's key in YYYY-WNN format (ISO week).
 */
export function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Reads all leaderboard entries from localStorage.
 */
function readEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read leaderboard entries:', e);
    return [];
  }
}

/**
 * Writes leaderboard entries to localStorage.
 */
function writeEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to write leaderboard entries:', e);
  }
}

/**
 * Adds a score entry to today's leaderboard.
 *
 * @param {string} playerName - The player's display name.
 * @param {number} score - The player's score.
 * @param {string} avatar - The player's avatar identifier.
 * @param {number} roundCount - Number of rounds played.
 * @returns {object|null} The created entry, or null on failure.
 */
export function submitScore(playerName, score, avatar, roundCount) {
  try {
    const entries = readEntries();

    // Periodic cleanup: prune entries older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const fresh = entries.filter((e) => e.timestamp >= thirtyDaysAgo);

    const entry = {
      playerName,
      score,
      avatar,
      roundCount,
      timestamp: Date.now(),
      dateKey: getTodayKey(),
      weekKey: getWeekKey(),
    };
    fresh.push(entry);
    writeEntries(fresh);
    return entry;
  } catch (e) {
    console.error('Failed to submit score:', e);
    return null;
  }
}

/**
 * Returns today's leaderboard entries sorted by score descending (top 50).
 *
 * @returns {Array} Sorted array of today's top entries.
 */
function getLeaderboard(keyField, keyValue) {
  try {
    const entries = readEntries();
    return entries
      .filter((entry) => entry[keyField] === keyValue)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  } catch (e) {
    console.error('Failed to get leaderboard:', e);
    return [];
  }
}

export function getDailyLeaderboard() {
  return getLeaderboard('dateKey', getTodayKey());
}

export function getWeeklyLeaderboard() {
  return getLeaderboard('weekKey', getWeekKey());
}

/**
 * Returns the player's rank and percentile for today.
 *
 * @param {string} playerName - The player's display name.
 * @returns {object} { rank, total, percentile } or { rank: null, total: 0, percentile: 0 }
 */
export function getPlayerRank(playerName) {
  try {
    const daily = getDailyLeaderboard();
    const total = daily.length;
    if (total === 0) {
      return { rank: null, total: 0, percentile: 0 };
    }

    const rankIndex = daily.findIndex((entry) => entry.playerName === playerName);
    if (rankIndex === -1) {
      return { rank: null, total, percentile: 0 };
    }

    const rank = rankIndex + 1;
    const percentile = Math.round(((total - rank) / total) * 100);
    return { rank, total, percentile };
  } catch (e) {
    console.error('Failed to get player rank:', e);
    return { rank: null, total: 0, percentile: 0 };
  }
}

/**
 * Returns the player's all-time best score and rank among all entries.
 *
 * @param {string} playerName - The player's display name.
 * @returns {object} { bestScore, bestRank, totalPlayers } or defaults if not found.
 */
export function getPlayerBest(playerName) {
  try {
    const entries = readEntries();
    if (entries.length === 0) {
      return { bestScore: null, bestRank: null, totalPlayers: 0 };
    }

    const playerEntries = entries.filter((entry) => entry.playerName === playerName);
    if (playerEntries.length === 0) {
      return { bestScore: null, bestRank: null, totalPlayers: 0 };
    }

    const bestScore = Math.max(...playerEntries.map((e) => e.score));

    const allSorted = [...entries].sort((a, b) => b.score - a.score);
    const bestRankIndex = allSorted.findIndex(
      (entry) => entry.playerName === playerName && entry.score === bestScore
    );
    const bestRank = bestRankIndex !== -1 ? bestRankIndex + 1 : null;

    const uniquePlayers = new Set(entries.map((e) => e.playerName));
    return { bestScore, bestRank, totalPlayers: uniquePlayers.size };
  } catch (e) {
    console.error('Failed to get player best:', e);
    return { bestScore: null, bestRank: null, totalPlayers: 0 };
  }
}

/**
 * Removes entries older than 30 days to save storage space.
 *
 * @returns {number} Number of entries removed.
 */
export function clearOldEntries() {
  try {
    const entries = readEntries();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = entries.filter((entry) => entry.timestamp >= thirtyDaysAgo);
    const removed = entries.length - filtered.length;
    writeEntries(filtered);
    return removed;
  } catch (e) {
    console.error('Failed to clear old entries:', e);
    return 0;
  }
}

// ============================================================
// Seasonal Leaderboard
// ============================================================

/**
 * Returns the current season identifier and display name.
 */
export function getCurrentSeason() {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  return { id: `${year}-${now.getMonth() + 1}`, name: `${month} ${year}`, startDate: new Date(year, now.getMonth(), 1) };
}

/**
 * Reads the seasonal leaderboard for the current month.
 */
export function getSeasonalLeaderboard() {
  const season = getCurrentSeason();
  const key = `venn_leaderboard_${season.id}`;
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
}

/**
 * Submits (or updates) a player's score in the current seasonal leaderboard.
 */
export function submitSeasonalScore(name, score, avatar) {
  const season = getCurrentSeason();
  const key = `venn_leaderboard_${season.id}`;
  const board = getSeasonalLeaderboard();
  const existing = board.find(e => e.name === name);
  if (existing) {
    if (score > existing.bestScore) existing.bestScore = score;
    existing.totalRounds++;
    existing.totalScore += score;
  } else {
    board.push({ name, avatar, bestScore: score, totalScore: score, totalRounds: 1 });
  }
  board.sort((a, b) => b.bestScore - a.bestScore);
  localStorage.setItem(key, JSON.stringify(board.slice(0, 100)));
  return board;
}

/**
 * Returns an archive of all seasonal leaderboards stored in localStorage.
 */
export function getSeasonArchive() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('venn_leaderboard_')) keys.push(key);
  }
  return keys.map(k => ({ seasonId: k.replace('venn_leaderboard_', ''), data: JSON.parse(localStorage.getItem(k) || '[]') }));
}

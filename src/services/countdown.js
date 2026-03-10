/**
 * Countdown Service
 *
 * Countdown utility for the next daily challenge.
 */

const LAST_DAILY_PLAYED_KEY = 'vwf_last_daily_played';

/**
 * Returns the time remaining until midnight (next daily challenge).
 *
 * @returns {object} { hours, minutes, seconds, totalMs }
 */
export function getTimeUntilNextChallenge() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const totalMs = tomorrow - now;

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalMs };
}

/**
 * Formats a countdown time object into a human-readable string.
 * Returns "14h 23m" for times >= 1 hour, or "23m 15s" for times under 1 hour.
 *
 * @param {object} timeObj - Object with hours, minutes, seconds properties.
 * @returns {string} Formatted countdown string.
 */
export function formatCountdown(timeObj) {
  const { hours, minutes, seconds } = timeObj;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

/**
 * Returns true if it's a new day and the daily challenge hasn't been played yet.
 *
 * @returns {boolean} Whether a new daily challenge is available.
 */
export function isNewDailyAvailable() {
  try {
    const lastPlayed = localStorage.getItem(LAST_DAILY_PLAYED_KEY);
    if (!lastPlayed) {
      return true;
    }

    const today = new Date().toISOString().split('T')[0];
    return lastPlayed !== today;
  } catch (e) {
    console.error('Failed to check daily availability:', e);
    return true;
  }
}

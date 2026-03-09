/**
 * Analytics tracking service for Venn with Friends
 *
 * Stores events in localStorage so the game can derive engagement metrics
 * locally. The API is structured so it can easily be wired to a real
 * analytics backend (e.g. Mixpanel, Amplitude, PostHog) later — just
 * replace the persistence calls inside trackEvent().
 *
 * Supported event types:
 *   - 'game_start'           — Player starts a new game
 *   - 'round_complete'       — A single round finishes (props: { score, category })
 *   - 'session_complete'     — Full game session ends (props: { totalScore, rounds })
 *   - 'share_click'          — Player taps a share button
 *   - 'challenge_sent'       — Player sends a challenge to a friend
 *   - 'challenge_accepted'   — Player accepts an incoming challenge
 *   - 'daily_complete'       — Player finishes the daily challenge
 *   - 'referral_click'       — Player clicks a referral link
 *   - 'judge_submit'         — Player submits a judgement
 *   - 'streak_milestone'     — Player reaches a streak milestone (props: { streak })
 *
 * Usage:
 *   import { trackEvent, getSessionMetrics } from './analytics';
 *
 *   trackEvent('game_start');
 *   trackEvent('round_complete', { score: 8, category: 'animals' });
 *   const metrics = getSessionMetrics();
 */

const STORAGE_KEY = 'vwf_analytics';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the full event log from localStorage.
 * @returns {Array<{event: string, properties: object, timestamp: number}>}
 */
function readEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist the event log to localStorage.
 * @param {Array} events
 */
function writeEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage full or unavailable — silently drop.
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record an analytics event.
 *
 * @param {string}  eventName   — One of the documented event types.
 * @param {object}  [properties] — Arbitrary key/value metadata for the event.
 */
export function trackEvent(eventName, properties = {}) {
  try {
    const events = readEvents();
    events.push({
      event: eventName,
      properties,
      timestamp: Date.now(),
    });
    writeEvents(events);
  } catch {
    // Never let analytics break the app.
  }
}

/**
 * Return all recorded events of a given type.
 *
 * @param {string} eventName
 * @returns {Array<{event: string, properties: object, timestamp: number}>}
 */
export function getEvents(eventName) {
  try {
    return readEvents().filter((e) => e.event === eventName);
  } catch {
    return [];
  }
}

/**
 * Return the total count of a given event type.
 *
 * @param {string} eventName
 * @returns {number}
 */
export function getEventCount(eventName) {
  try {
    return getEvents(eventName).length;
  } catch {
    return 0;
  }
}

/**
 * Compute high-level session metrics from stored events.
 *
 * @returns {{
 *   totalSessions: number,
 *   avgScore: number,
 *   shareRate: number,
 *   challengesSent: number,
 *   dailyChallengesCompleted: number,
 *   d1Retention: number,
 *   d7Retention: number,
 * }}
 */
export function getSessionMetrics() {
  try {
    const all = readEvents();

    const sessions = all.filter((e) => e.event === 'session_complete');
    const totalSessions = sessions.length;

    // Average score across completed sessions
    const scores = sessions
      .map((e) => e.properties && e.properties.totalScore)
      .filter((s) => typeof s === 'number');
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0;

    // Share rate = share clicks / sessions (guard against division by zero)
    const shareClicks = all.filter((e) => e.event === 'share_click').length;
    const shareRate = totalSessions > 0 ? shareClicks / totalSessions : 0;

    const challengesSent = all.filter((e) => e.event === 'challenge_sent').length;
    const dailyChallengesCompleted = all.filter((e) => e.event === 'daily_complete').length;

    // Retention helpers — compute based on distinct active days
    const gameStarts = all.filter((e) => e.event === 'game_start');
    const daySet = new Set(
      gameStarts.map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
    );
    const sortedDays = [...daySet].sort();

    let d1Retention = 0;
    let d7Retention = 0;

    if (sortedDays.length >= 2) {
      const first = new Date(sortedDays[0]).getTime();

      // D1: did the user come back on the day after their first session?
      const dayAfterFirst = new Date(first + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      d1Retention = daySet.has(dayAfterFirst) ? 1 : 0;

      // D7: did the user come back on the 7th day after their first session?
      const weekAfterFirst = new Date(first + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      d7Retention = daySet.has(weekAfterFirst) ? 1 : 0;
    }

    return {
      totalSessions,
      avgScore,
      shareRate,
      challengesSent,
      dailyChallengesCompleted,
      d1Retention,
      d7Retention,
    };
  } catch {
    return {
      totalSessions: 0,
      avgScore: 0,
      shareRate: 0,
      challengesSent: 0,
      dailyChallengesCompleted: 0,
      d1Retention: 0,
      d7Retention: 0,
    };
  }
}

/**
 * Remove events older than 30 days to keep localStorage usage reasonable.
 */
export function clearOldEvents() {
  try {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const events = readEvents().filter((e) => e.timestamp >= cutoff);
    writeEvents(events);
  } catch {
    // ignore
  }
}

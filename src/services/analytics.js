/**
 * Analytics tracking service for Venn with Friends
 *
 * Stores events in localStorage so the game can derive engagement metrics
 * locally. Events are buffered in memory and flushed periodically to
 * avoid serializing the full event log on every call.
 */

const STORAGE_KEY = 'vwf_analytics';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FLUSH_INTERVAL_MS = 5000;

// In-memory buffer for new events
let _buffer = [];
let _flushTimer = null;

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

function writeEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage full or unavailable
  }
}

function flushBuffer() {
  if (_buffer.length === 0) return;
  try {
    const events = readEvents();
    events.push(..._buffer);
    writeEvents(events);
    _buffer = [];
  } catch {
    // ignore
  }
}

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flushBuffer();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Record an analytics event. Buffered in memory and flushed periodically.
 */
export function trackEvent(eventName, properties = {}) {
  try {
    _buffer.push({
      event: eventName,
      properties,
      timestamp: Date.now(),
    });
    scheduleFlush();
  } catch {
    // Never let analytics break the app.
  }
}

/**
 * Return all recorded events of a given type.
 */
export function getEvents(eventName) {
  try {
    flushBuffer();
    return readEvents().filter((e) => e.event === eventName);
  } catch {
    return [];
  }
}

/**
 * Return the total count of a given event type.
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
 */
export function getSessionMetrics() {
  try {
    flushBuffer();
    const all = readEvents();

    const sessions = all.filter((e) => e.event === 'session_complete');
    const totalSessions = sessions.length;

    const scores = sessions
      .map((e) => e.properties && e.properties.totalScore)
      .filter((s) => typeof s === 'number');
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0;

    const shareClicks = all.filter((e) => e.event === 'share_click').length;
    const shareRate = totalSessions > 0 ? shareClicks / totalSessions : 0;

    const challengesSent = all.filter((e) => e.event === 'challenge_sent').length;
    const dailyChallengesCompleted = all.filter((e) => e.event === 'daily_complete').length;

    const gameStarts = all.filter((e) => e.event === 'game_start');
    const daySet = new Set(
      gameStarts.map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
    );
    const sortedDays = [...daySet].sort();

    let d1Retention = 0;
    let d7Retention = 0;

    if (sortedDays.length >= 2) {
      const first = new Date(sortedDays[0]).getTime();
      const dayAfterFirst = new Date(first + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      d1Retention = daySet.has(dayAfterFirst) ? 1 : 0;
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
 * Remove events older than 30 days.
 */
export function clearOldEvents() {
  try {
    flushBuffer();
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const events = readEvents().filter((e) => e.timestamp >= cutoff);
    writeEvents(events);
  } catch {
    // ignore
  }
}

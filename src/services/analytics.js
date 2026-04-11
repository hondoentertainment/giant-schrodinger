/**
 * Analytics tracking service for Venn with Friends
 *
 * Stores events in localStorage so the game can derive engagement metrics
 * locally. Events are buffered in memory and flushed periodically to
 * avoid serializing the full event log on every call.
 *
 * Supports pluggable analytics providers for sending events to different
 * backends (console, Supabase, PostHog, etc.).
 */

import posthog from 'posthog-js';

const STORAGE_KEY = 'vwf_analytics';
const SESSION_ID_KEY = 'vwf_session_id';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FLUSH_INTERVAL_MS = 5000;

// In-memory buffer for new events
let _buffer = [];
let _flushTimer = null;

// --- Provider system ---

const providers = [];

// Tracks whether a "real" (non-console) provider is active. When true,
// attempts to register ConsoleAnalyticsProvider are skipped so we don't
// duplicate logs in production.
let _realProviderActive = false;

/**
 * Register an analytics provider. Each provider must have a `track(event, props)` method.
 *
 * When a real (non-console) provider such as PostHog is registered, any
 * previously-registered ConsoleAnalyticsProvider is removed, and any later
 * attempt to register ConsoleAnalyticsProvider becomes a no-op. This keeps
 * production free of duplicate console noise while still letting App.jsx
 * safely register the console provider as its default.
 */
export function registerAnalyticsProvider(provider) {
  if (!provider || typeof provider.track !== 'function') return;

  // If a real provider is already installed, don't let the console
  // provider sneak back in on a later registration call.
  if (_realProviderActive && provider === ConsoleAnalyticsProvider) {
    return;
  }

  // If this provider is a real provider (not the console one), mark the
  // flag and evict any existing console provider from the array.
  if (provider !== ConsoleAnalyticsProvider) {
    _realProviderActive = true;
    for (let i = providers.length - 1; i >= 0; i--) {
      if (providers[i] === ConsoleAnalyticsProvider) {
        providers.splice(i, 1);
      }
    }
  }

  // Avoid registering the exact same provider instance twice.
  if (providers.includes(provider)) return;

  providers.push(provider);
}

/**
 * Get or create a session ID for the current browser session.
 */
function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

// --- Providers ---

/**
 * Console provider for development - logs events to the browser console.
 */
export const ConsoleAnalyticsProvider = {
  track: (event, props) => {
    if (import.meta.env.DEV) {
      console.debug(`[Analytics] ${event}`, props);
    }
  },
  identify: (userId, traits) => {
    if (import.meta.env.DEV) {
      console.debug('[Analytics] identify', userId, traits);
    }
  },
};

/**
 * Supabase provider - writes events to an analytics_events table when backend is available.
 */
export const SupabaseAnalyticsProvider = {
  track: async () => {
    try {
      const { isBackendEnabled } = await import('./backend.js');
      if (!isBackendEnabled()) return;
      // Stub: when Supabase is configured, insert into analytics_events table
    } catch {
      /* silent */
    }
  },
};

// --- PostHog provider ---

let _posthogInitialized = false;

/**
 * Returns true if the PostHog SDK has been initialized in this process.
 */
export function isPosthogInitialized() {
  return _posthogInitialized;
}

/**
 * PostHog analytics provider. Matches the {track, identify} shape used by
 * ConsoleAnalyticsProvider so it can be swapped in via
 * registerAnalyticsProvider().
 *
 * All methods are guarded by _posthogInitialized so that importing this
 * module in environments without a POSTHOG key is a pure no-op.
 */
export const PosthogAnalyticsProvider = {
  track: (event, props) => {
    if (!_posthogInitialized) return;
    try {
      posthog.capture(event, props);
    } catch {
      /* never let a provider break the app */
    }
  },
  identify: (userId, traits) => {
    if (!_posthogInitialized) return;
    try {
      posthog.identify(userId, traits);
    } catch {
      /* silent */
    }
  },
};

/**
 * Initialize PostHog lazily. No-op (returns false) if VITE_POSTHOG_KEY is
 * missing, so local dev without analytics keys doesn't fail.
 *
 * Privacy-conscious defaults:
 *   - capture_pageview: false (we send explicit events)
 *   - capture_pageleave: true
 *   - persistence: localStorage (no third-party cookies)
 *   - disable_session_recording: true (no session replay / PII capture)
 *
 * Returns true if PostHog was initialized, false otherwise.
 */
export function initPosthogAnalytics() {
  if (_posthogInitialized) return true;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return false;
  try {
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage',
      disable_session_recording: true,
    });
    _posthogInitialized = true;
    registerAnalyticsProvider(PosthogAnalyticsProvider);
    return true;
  } catch {
    // Never let analytics init break the app.
    return false;
  }
}

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
 * Also dispatched to all registered providers with enriched properties.
 */
export function trackEvent(eventName, properties = {}) {
  try {
    const enriched = {
      ...properties,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    _buffer.push({
      event: eventName,
      properties: enriched,
      timestamp: enriched.timestamp,
    });
    scheduleFlush();

    // Dispatch to all registered providers
    providers.forEach((p) => {
      try {
        p.track(eventName, enriched);
      } catch {
        /* never let a provider break the app */
      }
    });
  } catch {
    // Never let analytics break the app.
  }
}

// --- Key metric tracking functions ---

/**
 * Track completion of a round with score, mode, and duration.
 */
export function trackRoundComplete(score, mode, duration) {
  trackEvent('round_complete', { score, mode, duration });
}

/**
 * Track a share action with platform and share type.
 */
export function trackShare(platform, type) {
  trackEvent('share_click', { platform, type });
}

/**
 * Track daily challenge completion.
 */
export function trackDailyChallenge(completed) {
  trackEvent('daily_complete', { completed });
}

/**
 * Track retention - call on app load to track DAU.
 */
export function trackRetention() {
  trackEvent('app_load', { date: new Date().toISOString().slice(0, 10) });
}

// --- Query functions ---

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
 * Single-pass bucketing for efficiency.
 */
export function getSessionMetrics() {
  try {
    flushBuffer();
    const all = readEvents();

    const scores = [];
    let shareClicks = 0;
    let challengesSent = 0;
    let dailyChallengesCompleted = 0;
    const gameStartDays = new Set();

    for (const e of all) {
      switch (e.event) {
        case 'session_complete':
          if (typeof e.properties?.totalScore === 'number') {
            scores.push(e.properties.totalScore);
          }
          break;
        case 'share_click':
          shareClicks++;
          break;
        case 'challenge_sent':
          challengesSent++;
          break;
        case 'daily_complete':
          dailyChallengesCompleted++;
          break;
        case 'game_start':
          gameStartDays.add(new Date(e.timestamp).toISOString().slice(0, 10));
          break;
      }
    }

    const totalSessions = scores.length;
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const shareRate = totalSessions > 0 ? shareClicks / totalSessions : 0;

    const sortedDays = [...gameStartDays].sort();

    let d1Retention = 0;
    let d7Retention = 0;

    if (sortedDays.length >= 2) {
      const first = new Date(sortedDays[0]).getTime();
      const dayAfterFirst = new Date(first + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      d1Retention = gameStartDays.has(dayAfterFirst) ? 1 : 0;
      const weekAfterFirst = new Date(first + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      d7Retention = gameStartDays.has(weekAfterFirst) ? 1 : 0;
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

// Auto-prune old events on module load
try {
  clearOldEvents();
} catch {
  /* ignore */
}

/**
 * Error monitoring service for Venn with Friends.
 * Captures unhandled errors and dispatches them to pluggable reporters.
 * Includes a LocalStorage reporter by default and a real Sentry reporter.
 */

import * as Sentry from '@sentry/react';

const STORAGE_KEY = 'vwf_error_log';
const SENTRY_QUEUE_KEY = 'vwf_sentry_queue';
const MAX_ERRORS = 50;

// --- Sentry lazy initialization ---

let _sentryInitialized = false;

/**
 * Returns true if Sentry has been initialized in this process.
 */
export function isSentryInitialized() {
  return _sentryInitialized;
}

/**
 * Expose the Sentry namespace so callers (e.g. main.jsx) can use
 * Sentry.ErrorBoundary without re-importing the SDK.
 */
export { Sentry };

/**
 * Initialize Sentry lazily. No-op if the DSN env var is missing so that
 * dev environments without a DSN don't fail.
 */
export function initSentry() {
  if (_sentryInitialized) return true;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;
  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,
      tracesSampleRate: 0.1,
      // No session replay for now - privacy-conscious defaults.
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
    });
    _sentryInitialized = true;
    return true;
  } catch {
    // Never let monitoring setup break the app.
    return false;
  }
}

/**
 * Report an error to Sentry if initialized, otherwise log to the console.
 * Keeps the public surface simple for call sites.
 */
export function captureError(error, context) {
  if (_sentryInitialized) {
    try {
      Sentry.captureException(error, { extra: context });
      return;
    } catch {
      // Fall through to console logging below.
    }
  }
  try {
    // eslint-disable-next-line no-console
    console.error('[errorMonitoring]', error, context);
  } catch {
    /* silent */
  }
}

// --- Reporter system ---

const reporters = [];

/**
 * Register an error reporter. Each reporter must have a `report(error, context)` method.
 */
export function registerErrorReporter(reporter) {
  reporters.push(reporter);
}

// --- Context enrichment ---

/**
 * Gather contextual information for error reports.
 */
function getErrorContext() {
  return {
    userId:
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('venn_user_id') || 'anonymous'
        : 'anonymous',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  };
}

// --- Reporters ---

/**
 * LocalStorage reporter - stores errors in localStorage for local diagnostics.
 */
export const LocalStorageReporter = {
  report: (errorData, context) => {
    try {
      const errors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      errors.push({
        ...errorData,
        ...context,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(errors.slice(-MAX_ERRORS)));
    } catch {
      // Never let error logging break the app
    }
  },
};

/**
 * Sentry reporter - forwards errors to Sentry when the SDK is initialized.
 *
 * Also writes every report into a LocalStorage queue so that events produced
 * while offline are preserved. The queue acts as a secondary buffer that can
 * be flushed back to Sentry when connectivity is restored.
 *
 * TODO: wire an offline-queue flush that replays entries from
 * `vwf_sentry_queue` via `Sentry.captureException` when the app regains
 * network connectivity. The queue is populated below but not yet drained.
 */
export const SentryReporter = {
  report: (errorData, context) => {
    // Always persist into the offline buffer first so nothing is lost if
    // Sentry itself throws or the network is unavailable.
    try {
      const queue = JSON.parse(localStorage.getItem(SENTRY_QUEUE_KEY) || '[]');
      queue.push({ ...errorData, ...context });
      localStorage.setItem(SENTRY_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_ERRORS)));
    } catch {
      /* silent */
    }

    if (!_sentryInitialized) return;
    try {
      const message = errorData?.message || 'Unknown error';
      const err = new Error(message);
      if (errorData?.stack) err.stack = errorData.stack;
      Sentry.captureException(err, {
        extra: { ...errorData, ...context },
      });
    } catch {
      /* never let a reporter break the app */
    }
  },
};

// --- Core functions ---

/**
 * Dispatch an error to all registered reporters with enriched context.
 */
function dispatchToReporters(errorData) {
  const context = getErrorContext();
  reporters.forEach((r) => {
    try {
      r.report(errorData, context);
    } catch {
      /* never let a reporter break the app */
    }
  });
}

/**
 * Initialize global error handlers.
 * Call once at app startup. Returns a cleanup function that removes event listeners.
 */
export function initErrorMonitoring() {
  const onError = (event) => {
    logError({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack?.slice(0, 500),
    });
  };

  const onUnhandledRejection = (event) => {
    logError({
      message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
      stack: event.reason?.stack?.slice(0, 500),
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  // Register the default LocalStorage reporter
  registerErrorReporter(LocalStorageReporter);

  // Register Sentry reporter (will only activate if DSN is configured)
  registerErrorReporter(SentryReporter);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}

/**
 * Log an error. Dispatches to all registered reporters.
 */
export function logError(errorData) {
  try {
    dispatchToReporters(errorData);
  } catch {
    // Never let error logging break the app
  }
}

/**
 * Report an error from a component boundary (e.g., ErrorBoundary).
 */
export function reportBoundaryError(error, errorInfo) {
  logError({
    message: error?.message || 'Unknown error',
    stack: error?.stack?.slice(0, 500),
    componentStack: errorInfo?.componentStack?.slice(0, 500),
    source: 'ErrorBoundary',
  });
}

/**
 * Get all stored errors.
 */
export function getErrors() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear all stored errors.
 */
export function clearErrors() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get error summary statistics.
 */
export function getErrorStats() {
  const errors = getErrors();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    total: errors.length,
    last24h: errors.filter((e) => now - new Date(e.timestamp).getTime() < dayMs).length,
    last7d: errors.filter((e) => now - new Date(e.timestamp).getTime() < 7 * dayMs).length,
    mostRecent: errors[errors.length - 1] || null,
  };
}

/**
 * Error monitoring service for Venn with Friends.
 * Captures unhandled errors and dispatches them to pluggable reporters.
 * Includes a LocalStorage reporter by default and a Sentry reporter that
 * talks directly to the Sentry public ingestion HTTP API (no SDK dependency).
 */

/* global __SENTRY_RELEASE__ */

const STORAGE_KEY = 'vwf_error_log';
const MAX_ERRORS = 50;
const SENTRY_QUEUE_KEY = 'vwf_sentry_queue';
const SENTRY_QUEUE_MAX = 10;

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
        userId: typeof localStorage !== 'undefined'
            ? (localStorage.getItem('venn_user_id') || 'anonymous')
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

// --- Sentry DSN parsing ---

/**
 * Parse a Sentry DSN of the form `https://<public_key>@<host>/<project_id>`.
 * Returns `{publicKey, host, projectId}` or `null` when the DSN is missing
 * or malformed.
 */
export function parseSentryDsn(dsn) {
    if (!dsn || typeof dsn !== 'string') return null;
    try {
        const url = new URL(dsn);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        const publicKey = url.username;
        const host = url.host;
        // pathname is like "/2" -> strip leading slash. Project id must be non-empty.
        const projectId = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
        if (!publicKey || !host || !projectId) return null;
        if (projectId.includes('/')) return null;
        return { publicKey, host, projectId };
    } catch {
        return null;
    }
}

// --- Sentry reporter ---

let sentryParsed; // undefined = not yet tried, null = failed/disabled, object = ok
let sentryParseAttempted = false;

function getSentryConfig() {
    if (sentryParseAttempted) return sentryParsed;
    sentryParseAttempted = true;
    const dsn = import.meta.env?.VITE_SENTRY_DSN;
    if (!dsn) {
        sentryParsed = null;
        return null;
    }
    const parsed = parseSentryDsn(dsn);
    if (!parsed) {
        // eslint-disable-next-line no-console
        console.warn('[errorMonitoring] Invalid VITE_SENTRY_DSN; Sentry reporting disabled.');
        sentryParsed = null;
        return null;
    }
    sentryParsed = parsed;
    return parsed;
}

/**
 * Reset cached DSN parse state. Exported for tests.
 */
export function _resetSentryParseCache() {
    sentryParsed = undefined;
    sentryParseAttempted = false;
}

function generateEventId() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '');
        }
    } catch { /* fall through */ }
    return Math.random().toString(16).slice(2).padStart(32, '0').slice(0, 32);
}

function queueToLocalStorage(errorData, context) {
    try {
        const queue = JSON.parse(localStorage.getItem(SENTRY_QUEUE_KEY) || '[]');
        queue.push({ ...errorData, ...context });
        localStorage.setItem(
            SENTRY_QUEUE_KEY,
            JSON.stringify(queue.slice(-SENTRY_QUEUE_MAX))
        );
    } catch { /* silent */ }
}

/**
 * Sentry reporter - posts events directly to the Sentry ingestion API.
 * Falls back to a small localStorage queue when no DSN is configured so
 * developers still have local visibility.
 */
export const SentryReporter = {
    report: (errorData, context) => {
        const cfg = getSentryConfig();
        if (!cfg) {
            // No DSN or bad DSN - keep a small local queue for dev visibility.
            queueToLocalStorage(errorData, context);
            return;
        }
        try {
            const { publicKey, host, projectId } = cfg;
            const endpoint = `https://${host}/api/${projectId}/store/`;
            const message = errorData?.message || 'Unknown error';
            const release = typeof __SENTRY_RELEASE__ !== 'undefined' ? __SENTRY_RELEASE__ : 'dev';
            const event = {
                event_id: generateEventId(),
                timestamp: Math.floor(Date.now() / 1000),
                level: 'error',
                platform: 'javascript',
                release,
                message,
                exception: {
                    values: [{
                        type: 'Error',
                        value: message,
                        stacktrace: { frames: [] },
                    }],
                },
                tags: { source: errorData?.source || 'unknown' },
                user: { id: context?.userId || 'anonymous' },
                extra: {
                    url: context?.url || '',
                    userAgent: context?.userAgent || '',
                    componentStack: errorData?.componentStack || '',
                },
            };
            const headers = {
                'Content-Type': 'application/json',
                'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=venn-with-friends/1.0`,
            };
            // Fire and forget. Never block the UI or throw.
            const p = fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(event),
                headers,
                keepalive: true,
            });
            if (p && typeof p.catch === 'function') {
                p.catch(() => {});
            }
        } catch {
            // Never let error logging break the app.
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
        } catch { /* never let a reporter break the app */ }
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
        last24h: errors.filter(e => now - new Date(e.timestamp).getTime() < dayMs).length,
        last7d: errors.filter(e => now - new Date(e.timestamp).getTime() < 7 * dayMs).length,
        mostRecent: errors[errors.length - 1] || null,
    };
}

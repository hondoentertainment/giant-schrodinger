/**
 * Error monitoring service for Venn with Friends.
 * Captures unhandled errors and dispatches them to pluggable reporters.
 * Includes a LocalStorage reporter by default and a Sentry reporter stub.
 */

const STORAGE_KEY = 'vwf_error_log';
const MAX_ERRORS = 50;

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

/**
 * Sentry reporter - dynamically imports @sentry/browser to avoid main bundle bloat.
 */
let _sentryModule = null;
let _sentryInitialized = false;

export const SentryReporter = {
    async init() {
        const dsn = import.meta.env.VITE_SENTRY_DSN;
        if (!dsn || _sentryInitialized) return;
        try {
            const sentryPkg = '@sentry/browser';
            _sentryModule = await import(/* @vite-ignore */ sentryPkg);
            _sentryModule.init({
                dsn,
                environment: import.meta.env.DEV ? 'development' : 'production',
                sampleRate: 1.0,
                maxBreadcrumbs: 50,
            });
            _sentryInitialized = true;
            // Flush any queued errors
            try {
                const queue = JSON.parse(localStorage.getItem('vwf_sentry_queue') || '[]');
                queue.forEach(err => _sentryModule.captureMessage(err.message, { extra: err }));
                localStorage.removeItem('vwf_sentry_queue');
            } catch { /* ignore */ }
        } catch { /* Sentry SDK not installed — silent fallback */ }
    },
    report(errorData, context) {
        if (_sentryModule && _sentryInitialized) {
            _sentryModule.withScope(scope => {
                scope.setUser({ id: context.userId });
                scope.setExtra('url', context.url);
                scope.setExtra('timestamp', context.timestamp);
                if (errorData.source) scope.setTag('source', errorData.source);
                if (errorData.stack) {
                    const err = new Error(errorData.message);
                    err.stack = errorData.stack;
                    _sentryModule.captureException(err);
                } else {
                    _sentryModule.captureMessage(errorData.message, { extra: errorData });
                }
            });
        } else {
            // Queue for when Sentry initializes
            try {
                const queue = JSON.parse(localStorage.getItem('vwf_sentry_queue') || '[]');
                queue.push({ ...errorData, ...context });
                localStorage.setItem('vwf_sentry_queue', JSON.stringify(queue.slice(-MAX_ERRORS)));
            } catch { /* silent */ }
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

    // Initialize Sentry asynchronously
    SentryReporter.init();

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

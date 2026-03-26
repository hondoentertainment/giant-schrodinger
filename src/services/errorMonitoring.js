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
 * Sentry reporter stub - ready to activate when a Sentry DSN is configured.
 */
export const SentryReporter = {
    report: (errorData, context) => {
        const dsn = import.meta.env.VITE_SENTRY_DSN;
        if (!dsn) return;
        // Sentry SDK would be initialized here
        // For now, queue errors for when Sentry is configured
        try {
            const queue = JSON.parse(localStorage.getItem('vwf_sentry_queue') || '[]');
            queue.push({ ...errorData, ...context });
            localStorage.setItem('vwf_sentry_queue', JSON.stringify(queue.slice(-MAX_ERRORS)));
        } catch { /* silent */ }
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

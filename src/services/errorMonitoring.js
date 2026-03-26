/**
 * Error monitoring service for Venn with Friends.
 * Captures unhandled errors and stores them in localStorage.
 * Can be replaced with Sentry/Datadog integration later.
 */

const STORAGE_KEY = 'vwf_error_log';
const MAX_ERRORS = 50;

/**
 * Initialize global error handlers.
 * Call once at app startup.
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

    return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
}

/**
 * Log an error to localStorage.
 */
export function logError(errorData) {
    try {
        const errors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        errors.push({
            ...errorData,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.slice(0, 200),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(errors.slice(-MAX_ERRORS)));
    } catch {
        // Never let error logging break the app
    }
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
        last24h: errors.filter(e => now - e.timestamp < dayMs).length,
        last7d: errors.filter(e => now - e.timestamp < 7 * dayMs).length,
        mostRecent: errors[errors.length - 1] || null,
    };
}

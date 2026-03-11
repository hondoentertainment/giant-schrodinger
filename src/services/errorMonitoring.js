/**
 * Error monitoring service for Venn with Friends.
 * Captures unhandled errors and stores them in localStorage.
 * Can be replaced with Sentry/Datadog integration later.
 */

import { trackEvent } from './analytics';

const STORAGE_KEY = 'vwf_error_log';
const MAX_ERRORS = 50;

/**
 * Error categories for classification.
 */
export const ErrorCategory = {
    SCORING: 'scoring_error',
    NETWORK: 'network_error',
    MULTIPLAYER: 'multiplayer_error',
    SHARE: 'share_error',
    RENDER: 'render_error',
    UNHANDLED: 'unhandled_error',
    UNKNOWN: 'unknown_error',
};

/**
 * Initialize global error handlers.
 * Call once at app startup.
 */
export function initErrorMonitoring() {
    window.addEventListener('error', (event) => {
        logError({
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack?.slice(0, 500),
            category: ErrorCategory.UNHANDLED,
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        logError({
            message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
            stack: event.reason?.stack?.slice(0, 500),
            category: ErrorCategory.UNHANDLED,
        });
    });
}

/**
 * Log an error to localStorage.
 * @param {object} errorData - Error details
 * @param {string} [errorData.category] - One of ErrorCategory values
 * @param {string} [errorData.context] - What the user was doing when the error occurred
 */
export function logError(errorData) {
    try {
        const errors = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        errors.push({
            ...errorData,
            category: errorData.category || ErrorCategory.UNKNOWN,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.slice(0, 200),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(errors.slice(-MAX_ERRORS)));

        // Also record error as an analytics event for dashboard visibility
        try {
            trackEvent('error_occurred', {
                category: errorData.category || ErrorCategory.UNKNOWN,
                message: (errorData.message || '').slice(0, 200),
                context: errorData.context || undefined,
            });
        } catch { /* never let analytics break error logging */ }
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

    // Count by category
    const byCategory = {};
    for (const e of errors) {
        const cat = e.category || ErrorCategory.UNKNOWN;
        byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
        total: errors.length,
        last24h: errors.filter(e => now - e.timestamp < dayMs).length,
        last7d: errors.filter(e => now - e.timestamp < 7 * dayMs).length,
        mostRecent: errors[errors.length - 1] || null,
        byCategory,
    };
}

/**
 * Generate a copyable bug report string with error history and device info.
 * @returns {string} Formatted bug report
 */
export function reportBug() {
    const errors = getErrors();
    const stats = getErrorStats();
    const now = new Date();

    const deviceInfo = [
        `Platform: ${navigator.platform || 'unknown'}`,
        `User Agent: ${navigator.userAgent}`,
        `Screen: ${screen.width}x${screen.height} (${window.devicePixelRatio || 1}x)`,
        `Viewport: ${window.innerWidth}x${window.innerHeight}`,
        `Language: ${navigator.language}`,
        `Online: ${navigator.onLine}`,
        `URL: ${window.location.href}`,
    ].join('\n');

    const statsBlock = [
        `Total errors logged: ${stats.total}`,
        `Errors in last 24h: ${stats.last24h}`,
        `Errors in last 7d: ${stats.last7d}`,
        ...Object.entries(stats.byCategory).map(([cat, count]) => `  ${cat}: ${count}`),
    ].join('\n');

    const recentErrors = errors.slice(-10).map((e, i) => {
        const time = new Date(e.timestamp).toISOString();
        const lines = [`[${i + 1}] ${time} [${e.category || 'unknown'}]`];
        lines.push(`  Message: ${e.message || 'N/A'}`);
        if (e.context) lines.push(`  Context: ${e.context}`);
        if (e.stack) lines.push(`  Stack: ${e.stack.slice(0, 300)}`);
        return lines.join('\n');
    }).join('\n\n');

    return [
        `=== Venn with Friends Bug Report ===`,
        `Generated: ${now.toISOString()}`,
        ``,
        `--- Device Info ---`,
        deviceInfo,
        ``,
        `--- Error Stats ---`,
        statsBlock,
        ``,
        `--- Recent Errors (last 10) ---`,
        recentErrors || '(none)',
        ``,
        `--- End of Report ---`,
    ].join('\n');
}

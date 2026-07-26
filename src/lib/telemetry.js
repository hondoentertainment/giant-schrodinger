function getTelemetryTarget() {
    if (typeof window !== 'undefined') return window;
    return globalThis;
}

function bridgeToAnalytics(entry) {
    if (typeof window === 'undefined') return;

    import('../services/analytics.js').then(({ trackEvent }) => {
        if (entry.type === 'event' && entry.name) {
            trackEvent(entry.name, {
                ...entry.payload,
                telemetryLevel: entry.level,
            });
        } else if (entry.type === 'error') {
            trackEvent('app_error', {
                scope: entry.scope,
                message: entry.message,
                ...entry.payload,
            });
        }
    }).catch(() => {
        // Analytics bridge must never break gameplay.
    });
}

function bridgeToErrorMonitoring(entry) {
    if (typeof window === 'undefined' || entry.type !== 'error') return;

    import('../services/errorMonitoring.js').then(({ logError }) => {
        logError({
            message: entry.message || 'Unknown error',
            stack: entry.stack ? String(entry.stack).slice(0, 500) : undefined,
            source: entry.scope || 'reportAppError',
            scope: entry.scope,
            ...entry.payload,
        });
    }).catch(() => {
        // Error monitoring bridge must never break gameplay.
    });
}

function emitTelemetry(entry) {
    const target = getTelemetryTarget();
    const sink = target.__VWF_TELEMETRY__;

    if (Array.isArray(sink)) {
        sink.push(entry);
    } else if (typeof sink === 'function') {
        try {
            sink(entry);
        } catch {
            // Do not let host sink failures break the app.
        }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vwf:telemetry', { detail: entry }));
    }

    bridgeToAnalytics(entry);
    bridgeToErrorMonitoring(entry);

    return entry;
}

export function reportAppEvent(name, payload = {}, level = 'info') {
    return emitTelemetry({
        type: 'event',
        name,
        level,
        payload,
        timestamp: new Date().toISOString(),
    });
}

export function reportAppError(scope, error, payload = {}) {
    return emitTelemetry({
        type: 'error',
        scope,
        level: 'error',
        message: error?.message || String(error || 'Unknown error'),
        stack: error?.stack || null,
        payload,
        timestamp: new Date().toISOString(),
    });
}

function getTelemetryTarget() {
    if (typeof window !== 'undefined') return window;
    return globalThis;
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

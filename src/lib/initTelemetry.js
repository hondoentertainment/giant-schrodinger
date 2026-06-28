import { registerAnalyticsProvider } from '../services/analytics';

let initialized = false;

function createPostHogProvider(apiKey, host) {
    if (!apiKey || typeof window === 'undefined') return null;

    return {
        track: (eventName, properties) => {
            try {
                const endpoint = `${host.replace(/\/$/, '')}/capture/`;
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: apiKey,
                        event: eventName,
                        properties: {
                            ...properties,
                            $lib: 'venn-with-friends',
                        },
                        distinct_id: properties?.sessionId || 'anonymous',
                    }),
                    keepalive: true,
                }).catch(() => {});
            } catch {
                // Telemetry must never break gameplay.
            }
        },
    };
}

/**
 * Register optional production telemetry sinks (PostHog, etc.).
 * Core events also flow through reportAppEvent → analytics bridge in telemetry.js.
 */
export function initTelemetry() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    const posthogKey = import.meta.env?.VITE_POSTHOG_KEY;
    const posthogHost = import.meta.env?.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
    const posthogProvider = createPostHogProvider(posthogKey, posthogHost);
    if (posthogProvider) {
        registerAnalyticsProvider(posthogProvider);
    }
}

export function _resetTelemetryInit() {
    initialized = false;
}

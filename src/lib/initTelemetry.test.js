import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTelemetry, _resetTelemetryInit } from './initTelemetry';
import { registerAnalyticsProvider } from '../services/analytics';

vi.mock('../services/analytics', () => ({
    registerAnalyticsProvider: vi.fn(),
}));

describe('initTelemetry', () => {
    beforeEach(() => {
        _resetTelemetryInit();
        vi.clearAllMocks();
    });

    it('registers PostHog provider when key is configured', () => {
        vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');
        vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com');

        initTelemetry();

        expect(registerAnalyticsProvider).toHaveBeenCalledTimes(1);
        expect(registerAnalyticsProvider.mock.calls[0][0]).toHaveProperty('track');

        vi.unstubAllEnvs();
    });

    it('is idempotent when called multiple times without optional providers', () => {
        initTelemetry();
        initTelemetry();
        expect(registerAnalyticsProvider).not.toHaveBeenCalled();
    });
});

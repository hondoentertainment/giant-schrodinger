import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    trackEvent,
    trackFunnel,
    getEvents,
    getEventCount,
    teardownAnalytics,
    registerAnalyticsProvider,
} from './analytics';

const FUNNEL_KEY = 'vwf_funnel_seen';

describe('analytics service', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        teardownAnalytics();
    });

    describe('trackEvent', () => {
        it('buffers an event and persists it on flush', () => {
            trackEvent('test_event', { foo: 'bar' });
            // getEvents forces a flush via flushBuffer
            const events = getEvents('test_event');
            expect(events).toHaveLength(1);
            expect(events[0].event).toBe('test_event');
            expect(events[0].properties.foo).toBe('bar');
            expect(events[0].properties.sessionId).toBeTruthy();
        });

        it('dispatches to registered providers with enriched properties', () => {
            const provider = { track: vi.fn() };
            registerAnalyticsProvider(provider);
            trackEvent('provider_event', { a: 1 });
            expect(provider.track).toHaveBeenCalledWith(
                'provider_event',
                expect.objectContaining({ a: 1, sessionId: expect.any(String), timestamp: expect.any(Number) }),
            );
        });

        it('never throws when a provider throws', () => {
            const bad = { track: () => { throw new Error('boom'); } };
            registerAnalyticsProvider(bad);
            expect(() => trackEvent('safe_event', {})).not.toThrow();
        });
    });

    describe('trackFunnel', () => {
        it('fires a funnel event on first call for a stage', () => {
            trackFunnel('first_play_started');
            const events = getEvents('funnel_first_play_started');
            expect(events).toHaveLength(1);
            expect(events[0].properties.stage).toBe('first_play_started');
        });

        it('dedupes repeat calls for the same stage within a session', () => {
            trackFunnel('first_play_started');
            trackFunnel('first_play_started');
            trackFunnel('first_play_started');
            expect(getEventCount('funnel_first_play_started')).toBe(1);
        });

        it('records each distinct stage independently', () => {
            trackFunnel('first_play_started');
            trackFunnel('first_round_submitted');
            trackFunnel('first_score_revealed');
            trackFunnel('first_share_clicked');
            expect(getEventCount('funnel_first_play_started')).toBe(1);
            expect(getEventCount('funnel_first_round_submitted')).toBe(1);
            expect(getEventCount('funnel_first_score_revealed')).toBe(1);
            expect(getEventCount('funnel_first_share_clicked')).toBe(1);
        });

        it('persists the seen-set to sessionStorage', () => {
            trackFunnel('first_play_started');
            const raw = sessionStorage.getItem(FUNNEL_KEY);
            expect(raw).toBeTruthy();
            expect(JSON.parse(raw)).toContain('first_play_started');
        });

        it('fires again after sessionStorage is cleared (simulated new session)', () => {
            trackFunnel('first_play_started');
            expect(getEventCount('funnel_first_play_started')).toBe(1);
            // Simulate a fresh session
            sessionStorage.clear();
            trackFunnel('first_play_started');
            expect(getEventCount('funnel_first_play_started')).toBe(2);
        });

        it('never throws if sessionStorage is unavailable', () => {
            const original = globalThis.sessionStorage;
            // Simulate sessionStorage being inaccessible
            Object.defineProperty(globalThis, 'sessionStorage', {
                configurable: true,
                get() { throw new Error('unavailable'); },
            });
            expect(() => trackFunnel('first_play_started')).not.toThrow();
            Object.defineProperty(globalThis, 'sessionStorage', {
                configurable: true,
                value: original,
            });
        });
    });
});

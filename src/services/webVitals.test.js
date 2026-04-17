import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the web-vitals module with vi.fn() subscribers.
vi.mock('web-vitals', () => ({
    onCLS: vi.fn(),
    onLCP: vi.fn(),
    onINP: vi.fn(),
    onFCP: vi.fn(),
    onTTFB: vi.fn(),
}));

// Mock the analytics module so we can assert trackEvent invocations.
vi.mock('./analytics', () => ({
    trackEvent: vi.fn(),
}));

import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';
import { trackEvent } from './analytics';
import { initWebVitals } from './webVitals';

describe('webVitals service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('registers a callback with every Core Web Vital subscriber', () => {
        initWebVitals();
        expect(onCLS).toHaveBeenCalledTimes(1);
        expect(onLCP).toHaveBeenCalledTimes(1);
        expect(onINP).toHaveBeenCalledTimes(1);
        expect(onFCP).toHaveBeenCalledTimes(1);
        expect(onTTFB).toHaveBeenCalledTimes(1);
        for (const subscriber of [onCLS, onLCP, onINP, onFCP, onTTFB]) {
            expect(subscriber.mock.calls[0][0]).toBeInstanceOf(Function);
        }
    });

    it('forwards an incoming metric to trackEvent with the expected shape', () => {
        initWebVitals();
        const handler = onLCP.mock.calls[0][0];
        handler({
            name: 'LCP',
            value: 2456.7,
            rating: 'good',
            id: 'v4-abc-123',
            navigationType: 'navigate',
        });
        expect(trackEvent).toHaveBeenCalledWith('web_vital', {
            name: 'LCP',
            value: 2457, // rounded
            rating: 'good',
            id: 'v4-abc-123',
            navigationType: 'navigate',
        });
    });

    it('rounds fractional metric values to integers', () => {
        initWebVitals();
        const handler = onCLS.mock.calls[0][0];
        handler({
            name: 'CLS',
            value: 0.123,
            rating: 'good',
            id: 'v4-cls-1',
            navigationType: 'navigate',
        });
        const [, props] = trackEvent.mock.calls[0];
        expect(Number.isInteger(props.value)).toBe(true);
        expect(props.value).toBe(0);
    });

    it('passes through the rating and navigationType fields unchanged', () => {
        initWebVitals();
        const handler = onINP.mock.calls[0][0];
        handler({
            name: 'INP',
            value: 400,
            rating: 'needs-improvement',
            id: 'v4-inp-42',
            navigationType: 'reload',
        });
        expect(trackEvent).toHaveBeenCalledWith('web_vital', expect.objectContaining({
            rating: 'needs-improvement',
            navigationType: 'reload',
        }));
    });

    it('never throws if a subscriber throws synchronously', () => {
        onCLS.mockImplementationOnce(() => {
            throw new Error('web-vitals broke');
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => initWebVitals()).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith('web-vitals init failed:', expect.any(Error));
        warnSpy.mockRestore();
    });
});

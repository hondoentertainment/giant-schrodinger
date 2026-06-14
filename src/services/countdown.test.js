import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTimeUntilNextChallenge, formatCountdown, isNewDailyAvailable } from './countdown';

describe('countdown service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getTimeUntilNextChallenge', () => {
        it('returns a positive totalMs and 24h-or-less structure', () => {
            const t = getTimeUntilNextChallenge();
            expect(t.totalMs).toBeGreaterThan(0);
            expect(t.totalMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
            expect(t.hours).toBeGreaterThanOrEqual(0);
            expect(t.hours).toBeLessThan(24);
            expect(t.minutes).toBeGreaterThanOrEqual(0);
            expect(t.minutes).toBeLessThan(60);
            expect(t.seconds).toBeGreaterThanOrEqual(0);
            expect(t.seconds).toBeLessThan(60);
        });

        it('returns near full day close to midnight', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 3, 12, 0, 0, 1)); // Apr 12 2026 00:00:01
            const t = getTimeUntilNextChallenge();
            expect(t.hours).toBe(23);
            expect(t.minutes).toBe(59);
        });
    });

    describe('formatCountdown', () => {
        it('formats with hours when > 0', () => {
            expect(formatCountdown({ hours: 3, minutes: 15, seconds: 30 })).toBe('3h 15m');
        });

        it('formats with minutes and seconds when under an hour', () => {
            expect(formatCountdown({ hours: 0, minutes: 23, seconds: 15 })).toBe('23m 15s');
        });
    });

    describe('isNewDailyAvailable', () => {
        it('returns true when no last-played key is set', () => {
            expect(isNewDailyAvailable()).toBe(true);
        });

        it('returns false when last-played is today', () => {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('vwf_last_daily_played', today);
            expect(isNewDailyAvailable()).toBe(false);
        });

        it('returns true when last-played is a previous day', () => {
            localStorage.setItem('vwf_last_daily_played', '2020-01-01');
            expect(isNewDailyAvailable()).toBe(true);
        });
    });
});

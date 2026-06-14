import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    getCurrentWeeklyEvent,
    getTimeUntilNextWeek,
    formatWeeklyCountdown,
} from './weeklyEvents';

describe('weeklyEvents service', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getCurrentWeeklyEvent', () => {
        it('returns an event with expected shape', () => {
            const event = getCurrentWeeklyEvent();
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('name');
            expect(event).toHaveProperty('description');
            expect(event).toHaveProperty('themeId');
            expect(event).toHaveProperty('modifier');
        });

        it('returns the same event for two times in the same week', () => {
            vi.setSystemTime(new Date('2026-04-06T10:00:00')); // Monday
            const a = getCurrentWeeklyEvent();
            vi.setSystemTime(new Date('2026-04-08T10:00:00')); // Wed of same week-of-year
            const b = getCurrentWeeklyEvent();
            expect(a.id).toBe(b.id);
        });

        it('rotates events across different week numbers', () => {
            // Collect 10 weeks of events; at least two of them should differ
            const ids = new Set();
            for (let w = 0; w < 10; w++) {
                vi.setSystemTime(new Date(2026, 0, 1 + w * 7));
                ids.add(getCurrentWeeklyEvent().id);
            }
            expect(ids.size).toBeGreaterThan(1);
        });
    });

    describe('getTimeUntilNextWeek', () => {
        it('returns a positive number of milliseconds', () => {
            vi.setSystemTime(new Date('2026-04-12T10:00:00'));
            const ms = getTimeUntilNextWeek();
            expect(ms).toBeGreaterThan(0);
            // Must be less than 8 days (upper bound)
            expect(ms).toBeLessThan(8 * 24 * 60 * 60 * 1000);
        });

        it('points to the next Monday at midnight', () => {
            // 2026-04-12 is a Sunday
            vi.setSystemTime(new Date('2026-04-12T00:00:00'));
            const ms = getTimeUntilNextWeek();
            // 24 hours until Monday at midnight
            expect(ms).toBe(24 * 60 * 60 * 1000);
        });
    });

    describe('formatWeeklyCountdown', () => {
        it('formats days and hours when days > 0', () => {
            expect(formatWeeklyCountdown((3 * 24 + 5) * 60 * 60 * 1000)).toBe('3d 5h');
        });

        it('formats hours only when under a day', () => {
            expect(formatWeeklyCountdown(5 * 60 * 60 * 1000)).toBe('5h');
        });

        it('returns 0h for zero input', () => {
            expect(formatWeeklyCountdown(0)).toBe('0h');
        });
    });
});

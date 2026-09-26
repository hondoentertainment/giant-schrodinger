import { describe, it, expect } from 'vitest';
import { getReturnNudge } from './returnNudge';

describe('getReturnNudge', () => {
    const today = new Date('2026-09-26T15:00:00');

    it('nudges on the day after a played day', () => {
        expect(getReturnNudge({
            name: 'Ada',
            lastPlayedDate: '2026-09-25',
            totalRounds: 2,
            today,
        })).toEqual({
            id: 'day-2',
            message: "Day 2, Ada. Yesterday counted. Play today's pair and the streak is real.",
        });
    });

    it('stays quiet after today is already played', () => {
        expect(getReturnNudge({
            name: 'Ada',
            lastPlayedDate: '2026-09-26',
            totalRounds: 4,
            today,
        })).toBeNull();
    });

    it('does not invent a nudge for a brand-new profile', () => {
        expect(getReturnNudge({ name: 'Ada', lastPlayedDate: null, totalRounds: 0, today })).toBeNull();
    });
});

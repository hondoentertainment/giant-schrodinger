import { describe, it, expect } from 'vitest';
import { getScoreBand } from './scoreBands';

describe('scoreBands', () => {
    it('returns Amazing for score >= 9', () => {
        expect(getScoreBand(9).label).toBe('Amazing!');
        expect(getScoreBand(10).label).toBe('Amazing!');
    });

    it('returns Great for score 7-8', () => {
        expect(getScoreBand(7).label).toBe('Great');
        expect(getScoreBand(8).label).toBe('Great');
    });

    it('returns Solid for score 4-6', () => {
        expect(getScoreBand(4).label).toBe('Solid');
        expect(getScoreBand(5).label).toBe('Solid');
        expect(getScoreBand(6).label).toBe('Solid');
    });

    it('returns Room to grow for score < 4', () => {
        expect(getScoreBand(0).label).toBe('Room to grow');
        expect(getScoreBand(3).label).toBe('Room to grow');
    });

    it('returns color class for each band', () => {
        expect(getScoreBand(9).color).toContain('amber');
        expect(getScoreBand(7).color).toContain('emerald');
        expect(getScoreBand(5).color).toContain('blue');
        expect(getScoreBand(2).color).toContain('slate');
    });
});

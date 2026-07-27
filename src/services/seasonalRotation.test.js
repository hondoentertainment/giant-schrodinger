import { describe, it, expect } from 'vitest';
import { SEASONS, getActiveSeason, getActiveSeasonId, isInSeason } from './seasonalRotation';
import { getAvailableThemes, THEMES } from '../data/themes';

describe('seasonalRotation', () => {
    it('covers all twelve months exactly once', () => {
        const months = SEASONS.flatMap((season) => season.months).sort((a, b) => a - b);
        expect(months).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('maps dates to the expected season', () => {
        expect(getActiveSeasonId(new Date('2026-01-15T12:00:00'))).toBe('winter');
        expect(getActiveSeasonId(new Date('2026-04-15T12:00:00'))).toBe('spring');
        expect(getActiveSeasonId(new Date('2026-07-15T12:00:00'))).toBe('summer');
        expect(getActiveSeasonId(new Date('2026-10-15T12:00:00'))).toBe('autumn');
        expect(getActiveSeasonId(new Date('2026-12-15T12:00:00'))).toBe('winter');
    });

    it('returns the full season object', () => {
        expect(getActiveSeason(new Date('2026-07-15T12:00:00'))?.label).toBe('Summer');
    });

    it('treats untagged items as always in season', () => {
        expect(isInSeason(null)).toBe(true);
        expect(isInSeason(undefined)).toBe(true);
    });

    it('gates tagged items to their window', () => {
        const july = new Date('2026-07-15T12:00:00');
        expect(isInSeason('summer', july)).toBe(true);
        expect(isInSeason('winter', july)).toBe(false);
    });
});

describe('getAvailableThemes', () => {
    it('shows the summer theme in July and hides other seasonals', () => {
        const ids = getAvailableThemes(new Date('2026-07-15T12:00:00')).map((theme) => theme.id);
        expect(ids).toContain('summer-heat');
        expect(ids).not.toContain('autumn-ember');
        expect(ids).not.toContain('winter-frost');
    });

    it('rotates to autumn and winter themes in their months', () => {
        const octoberIds = getAvailableThemes(new Date('2026-10-15T12:00:00')).map((theme) => theme.id);
        expect(octoberIds).toContain('autumn-ember');
        expect(octoberIds).not.toContain('summer-heat');

        const januaryIds = getAvailableThemes(new Date('2026-01-15T12:00:00')).map((theme) => theme.id);
        expect(januaryIds).toContain('winter-frost');
        expect(januaryIds).not.toContain('autumn-ember');
    });

    it('always includes every non-seasonal theme', () => {
        const nonSeasonal = THEMES.filter((theme) => !theme.seasonal).map((theme) => theme.id);
        for (const date of ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']) {
            const ids = getAvailableThemes(new Date(`${date}T12:00:00`)).map((theme) => theme.id);
            for (const id of nonSeasonal) {
                expect(ids).toContain(id);
            }
        }
    });
});

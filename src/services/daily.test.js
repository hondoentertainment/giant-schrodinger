import { describe, it, expect, vi } from 'vitest';
import { getDailyPair } from './daily';
import * as assetsModule from '../data/assets';

vi.mock('../data/assets', () => ({
    getAssetsForTheme: vi.fn(),
}));

describe('getDailyPair', () => {
    it('returns deterministic pairs for the same date', () => {
        assetsModule.getAssetsForTheme.mockReturnValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);

        const date1 = new Date('2026-03-18T10:00:00Z');
        const result1 = getDailyPair(date1);

        const date2 = new Date('2026-03-18T23:59:59Z');
        const result2 = getDailyPair(date2);

        expect(result1.assets).toEqual(result2.assets);
        expect(result1.id).toEqual(result2.id);
    });
});

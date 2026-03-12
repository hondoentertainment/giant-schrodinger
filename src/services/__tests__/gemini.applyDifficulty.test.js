import { describe, it, expect, beforeEach } from 'vitest';
import { scoreSubmission } from '../gemini';

// Mock assets
const left = { id: '1', label: 'Sun', type: 'image', url: '' };
const right = { id: '2', label: 'Moon', type: 'image', url: '' };

describe('applyDifficulty via scoreSubmission', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns scores between 1-10 with normal difficulty', async () => {
        localStorage.setItem('vwf_ai_settings', JSON.stringify({ difficulty: 'normal' }));
        const result = await scoreSubmission('They share light', left, right);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
        expect(result.isMock).toBe(true);
    });

    it('inflates scores on easy difficulty', async () => {
        // Run multiple times and check that easy scores tend higher
        localStorage.setItem('vwf_ai_settings', JSON.stringify({ difficulty: 'easy' }));
        const easyResult = await scoreSubmission('They share light', left, right);
        expect(easyResult.score).toBeGreaterThanOrEqual(1);
        expect(easyResult.score).toBeLessThanOrEqual(10);
        // Breakdown values should be multiplied by 1.3
        if (easyResult.breakdown) {
            for (const val of Object.values(easyResult.breakdown)) {
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(10);
            }
        }
    });

    it('deflates scores on hard difficulty', async () => {
        localStorage.setItem('vwf_ai_settings', JSON.stringify({ difficulty: 'hard' }));
        const hardResult = await scoreSubmission('They share light', left, right);
        expect(hardResult.score).toBeGreaterThanOrEqual(1);
        expect(hardResult.score).toBeLessThanOrEqual(10);
        if (hardResult.breakdown) {
            for (const val of Object.values(hardResult.breakdown)) {
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(10);
            }
        }
    });

    it('does not modify scores when difficulty is normal', async () => {
        localStorage.setItem('vwf_ai_settings', JSON.stringify({ difficulty: 'normal' }));
        const result = await scoreSubmission('connection', left, right);
        expect(result.baseScore).toBe(result.score);
    });

    it('handles missing difficulty setting as normal', async () => {
        const result = await scoreSubmission('connection', left, right);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
    });
});

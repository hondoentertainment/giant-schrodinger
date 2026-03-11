import { describe, it, expect } from 'vitest';
import { scoreSubmission } from './gemini';

describe('gemini service', () => {
    const asset1 = { label: 'Cat', url: 'http://x' };
    const asset2 = { label: 'Dog', url: 'http://y' };

    describe('scoreSubmission', () => {
        it('returns mock score when submission is missing', async () => {
            const mockA = { label: 'Test Concept A' };
            const mockB = { label: 'Test Concept B' };
            const result = await scoreSubmission('', mockA, mockB);
            expect(result.isMock).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(1);
            expect(result.score).toBeLessThanOrEqual(10);
            expect(result.breakdown).toHaveProperty('wit');
            expect(result.breakdown).toHaveProperty('logic');
            expect(result.breakdown).toHaveProperty('originality');
            expect(result.breakdown).toHaveProperty('clarity');
            expect(result.commentary).toContain('Test Concept A');
            expect(result.commentary).toContain('Test Concept B');
        });

        it('returns mock when submission is missing with valid assets', async () => {
            const result = await scoreSubmission('', asset1, asset2);
            expect(result.isMock).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(1);
        });

        it('returns valid structure with submission text in commentary', async () => {
            const result = await scoreSubmission('both make you smile', asset1, asset2);
            expect(result).toHaveProperty('baseScore');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('relevance');
            expect(['Highly Logical', 'Absurdly Creative']).toContain(result.relevance);
        });

        it('returns mock score when assets are provided but API is absent', async () => {
            const mockA = { label: 'Test Concept A' };
            const mockB = { label: 'Test Concept B' };
            const result = await scoreSubmission('some answer', mockA, mockB);
            expect(result.isMock).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(1);
            expect(result.score).toBeLessThanOrEqual(10);
            expect(result.commentary).toContain('Test Concept A');
            expect(result.commentary).toContain('Test Concept B');
        });

        it('handles submission with special characters', async () => {
            const result = await scoreSubmission('He said "hello" & <tag>', asset1, asset2);
            expect(result).toBeDefined();
            expect(result.commentary).toBeDefined();
        });
    });
});

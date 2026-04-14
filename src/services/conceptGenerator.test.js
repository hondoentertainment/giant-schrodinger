import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock @google/genai so we can control what generateContent returns
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(),
}));

import { GoogleGenAI } from '@google/genai';
import { getCachedConcepts, generateConceptPairs, getSupplementalConcepts } from './conceptGenerator';

describe('conceptGenerator service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        // Reset env each test
        import.meta.env.VITE_GEMINI_API_KEY = '';
    });

    describe('getCachedConcepts', () => {
        it('returns null when nothing cached', () => {
            expect(getCachedConcepts()).toBeNull();
        });

        it('returns cached concepts when fresh', () => {
            const concepts = [{ left: { label: 'X' }, right: { label: 'Y' } }];
            localStorage.setItem(
                'venn_generated_concepts',
                JSON.stringify({ concepts, timestamp: Date.now() })
            );
            expect(getCachedConcepts()).toEqual(concepts);
        });

        it('returns null when cache is stale (>24h old)', () => {
            const concepts = [{ left: { label: 'X' }, right: { label: 'Y' } }];
            localStorage.setItem(
                'venn_generated_concepts',
                JSON.stringify({ concepts, timestamp: Date.now() - 25 * 60 * 60 * 1000 })
            );
            expect(getCachedConcepts()).toBeNull();
        });

        it('returns null on malformed JSON', () => {
            localStorage.setItem('venn_generated_concepts', '{bad');
            expect(getCachedConcepts()).toBeNull();
        });
    });

    describe('generateConceptPairs', () => {
        it('returns null when no API key is configured and no cache', async () => {
            import.meta.env.VITE_GEMINI_API_KEY = '';
            const result = await generateConceptPairs('nature', 3);
            expect(result).toBeNull();
        });

        it('returns cached concepts when enough are cached', async () => {
            const cached = [
                { left: { label: 'A' }, right: { label: 'B' } },
                { left: { label: 'C' }, right: { label: 'D' } },
            ];
            localStorage.setItem(
                'venn_generated_concepts',
                JSON.stringify({ concepts: cached, timestamp: Date.now() })
            );
            const result = await generateConceptPairs('anything', 2);
            expect(result).toEqual(cached);
        });

        it('returns null when API responds with no JSON array', async () => {
            import.meta.env.VITE_GEMINI_API_KEY = 'fake-key';
            GoogleGenAI.mockImplementation(() => ({
                models: { generateContent: vi.fn().mockResolvedValue({ text: 'no json here' }) },
            }));
            const result = await generateConceptPairs('sci-fi', 3);
            expect(result).toBeNull();
        });

        it('parses pairs and caches the result on success', async () => {
            import.meta.env.VITE_GEMINI_API_KEY = 'fake-key';
            const pairs = [
                { left: 'Rubber Duck', right: 'Philosophy' },
                { left: '3AM Taxi', right: 'Religion' },
            ];
            GoogleGenAI.mockImplementation(() => ({
                models: {
                    generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify(pairs) }),
                },
            }));
            const result = await generateConceptPairs('weird', 2);
            expect(result).toHaveLength(2);
            expect(result[0].left.label).toBe('Rubber Duck');
            expect(result[0].right.categories).toEqual(['ai-generated']);
            // cached
            const cached = JSON.parse(localStorage.getItem('venn_generated_concepts'));
            expect(cached.concepts).toHaveLength(2);
        });

        it('returns null when API throws', async () => {
            import.meta.env.VITE_GEMINI_API_KEY = 'fake-key';
            GoogleGenAI.mockImplementation(() => ({
                models: { generateContent: vi.fn().mockRejectedValue(new Error('network')) },
            }));
            expect(await generateConceptPairs('x', 3)).toBeNull();
        });
    });

    describe('getSupplementalConcepts', () => {
        it('returns empty array when no cache exists', () => {
            expect(getSupplementalConcepts(new Set(['x']), 'theme')).toEqual([]);
        });

        it('filters out already-used concept labels', () => {
            const concepts = [
                { left: { label: 'A' }, right: { label: 'B' } },
                { left: { label: 'C' }, right: { label: 'D' } },
            ];
            localStorage.setItem(
                'venn_generated_concepts',
                JSON.stringify({ concepts, timestamp: Date.now() })
            );
            const result = getSupplementalConcepts(new Set(['A']), 'theme');
            expect(result).toHaveLength(1);
            expect(result[0].left.label).toBe('C');
        });
    });
});

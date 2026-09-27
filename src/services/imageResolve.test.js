import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => false),
    supabase: null,
}));

import { buildLocalConceptImage, isBrittleImageUrl } from '../lib/conceptArt';
import {
    getCachedImageUrl,
    normalizeResolvedImage,
    resolveImageUrl,
    resolveImageUrls,
    isPicsumUrl,
} from './imageResolve';

describe('imageResolve service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('isPicsumUrl', () => {
        it('detects picsum urls', () => {
            expect(isPicsumUrl('https://picsum.photos/seed/test/800/800')).toBe(true);
            expect(isPicsumUrl('https://images.pexels.com/photos/123.jpeg')).toBe(false);
        });
    });

    describe('normalizeResolvedImage', () => {
        it('keeps pexels photos and uses bundled art as the fallback', () => {
            const result = normalizeResolvedImage('Neon City', {
                url: 'https://images.pexels.com/photos/1/pexels-photo-1.jpeg',
                fallbackUrl: 'https://picsum.photos/seed/neon/1080/1080',
                source: 'pexels',
                photographer: 'Ada',
            });
            expect(result.url).toContain('images.pexels.com');
            expect(result.fallbackUrl).toMatch(/\/art\/plates\/.+\.jpg$/);
            expect(result.source).toBe('pexels');
            expect(result.photographer).toBe('Ada');
        });

        it('drops picsum and unsplash results', () => {
            const picsum = normalizeResolvedImage('Forest', {
                url: 'https://picsum.photos/seed/forest/1080/1080',
                source: 'picsum',
            });
            const unsplash = normalizeResolvedImage('Forest', {
                url: 'https://images.unsplash.com/photo-1?w=1080',
                source: 'unsplash',
            });
            expect(picsum.source).toBe('local');
            expect(isBrittleImageUrl(picsum.url)).toBe(false);
            expect(unsplash.url).toBe(buildLocalConceptImage('Forest'));
        });
    });

    describe('resolveImageUrl', () => {
        it('uses bundled concept art when backend is disabled', async () => {
            const result = await resolveImageUrl('Neon City');
            expect(result.url).toMatch(/\/art\/plates\/.+\.jpg$/);
            expect(result.source).toBe('local');
            expect(result.url).not.toContain('picsum');
            expect(getCachedImageUrl('Neon City')).toBeNull();
        });

        it('reads a cached provider image on subsequent lookups', async () => {
            localStorage.setItem('vwf_image_resolve_cache', JSON.stringify({
                'forest mist': {
                    url: 'https://images.pexels.com/photos/9/pexels-photo-9.jpeg',
                    fallbackUrl: 'https://picsum.photos/seed/forest/1080/1080',
                    source: 'pexels',
                    timestamp: Date.now(),
                },
            }));

            const cached = getCachedImageUrl('Forest Mist');
            expect(cached?.url).toContain('images.pexels.com');
            expect(cached?.fallbackUrl).not.toContain('picsum');

            const second = await resolveImageUrl('Forest Mist');
            expect(second.url).toBe(cached.url);
        });

        it('ignores cached picsum hotlinks', async () => {
            localStorage.setItem('vwf_image_resolve_cache', JSON.stringify({
                old: {
                    url: 'https://picsum.photos/seed/old/1080/1080',
                    source: 'picsum',
                    timestamp: Date.now(),
                },
            }));
            expect(getCachedImageUrl('old')).toBeNull();
            const result = await resolveImageUrl('old');
            expect(result.url).toMatch(/\/art\/plates\/.+\.jpg$/);
        });
    });

    describe('resolveImageUrls', () => {
        it('returns cached and fresh entries together', async () => {
            localStorage.setItem('vwf_image_resolve_cache', JSON.stringify({
                'cached concept': {
                    url: 'https://example.com/cached.jpg',
                    fallbackUrl: buildLocalConceptImage('cached concept'),
                    source: 'cache',
                    timestamp: Date.now(),
                },
            }));

            const results = await resolveImageUrls(['cached concept', 'new concept']);
            expect(results['cached concept'].url).toBe('https://example.com/cached.jpg');
            expect(results['new concept'].url).toMatch(/\/art\/plates\/.+\.jpg$/);
            expect(results['new concept'].url).not.toContain('picsum');
        });
    });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => false),
    supabase: null,
}));

import { buildPicsumFallback } from '../lib/imageUrls';
import {
    getCachedImageUrl,
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

    describe('resolveImageUrl', () => {
        it('falls back to picsum when backend is disabled', async () => {
            const result = await resolveImageUrl('Neon City');
            expect(result.url).toContain('picsum.photos');
            expect(result.source).toBe('picsum');
        });

        it('reads from cache on subsequent lookups', async () => {
            const first = await resolveImageUrl('Forest Mist');
            const cached = getCachedImageUrl('Forest Mist');
            expect(cached?.url).toBe(first.url);

            const second = await resolveImageUrl('Forest Mist');
            expect(second.url).toBe(first.url);
        });
    });

    describe('resolveImageUrls', () => {
        it('returns cached and fresh entries together', async () => {
            localStorage.setItem('vwf_image_resolve_cache', JSON.stringify({
                'cached concept': {
                    url: 'https://example.com/cached.jpg',
                    fallbackUrl: buildPicsumFallback('cached concept'),
                    source: 'cache',
                    timestamp: Date.now(),
                },
            }));

            const results = await resolveImageUrls(['cached concept', 'new concept']);
            expect(results['cached concept'].url).toBe('https://example.com/cached.jpg');
            expect(results['new concept'].url).toContain('picsum.photos');
        });
    });
});

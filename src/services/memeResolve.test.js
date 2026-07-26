import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => false),
    supabase: null,
}));

import { MEDIA_TYPES } from '../data/themes';
import {
    getMemeSearchQuery,
    getCachedMemeUrl,
    resolveMemeUrl,
    resolveMemeUrls,
    resolveAssetsMemes,
    needsMemeApiResolve,
    isGiphyUrl,
} from './memeResolve';

describe('memeResolve service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('isGiphyUrl', () => {
        it('detects giphy urls', () => {
            expect(isGiphyUrl('https://media.giphy.com/media/abc/giphy.gif')).toBe(true);
            expect(isGiphyUrl('https://images.unsplash.com/photo-123')).toBe(false);
        });
    });

    describe('needsMemeApiResolve', () => {
        it('flags static meme assets for api lookup', () => {
            expect(needsMemeApiResolve({
                type: MEDIA_TYPES.MEME,
                label: 'Big Brain Moment',
                searchQuery: 'thinking face',
                url: 'https://images.unsplash.com/photo-123',
            })).toBe(true);
        });

        it('skips already resolved giphy assets', () => {
            expect(needsMemeApiResolve({
                type: MEDIA_TYPES.MEME,
                label: 'Resolved',
                url: 'https://media.giphy.com/media/abc/giphy.gif',
            })).toBe(false);
        });
    });

    describe('resolveMemeUrl', () => {
        it('falls back to static asset when backend is disabled', async () => {
            const fallbackUrl = 'https://images.unsplash.com/photo-123';
            const result = await resolveMemeUrl('thinking face', { fallbackUrl });
            expect(result.url).toBe(fallbackUrl);
            expect(result.source).toBe('static');
        });

        it('reads from cache on subsequent lookups', async () => {
            localStorage.setItem('vwf_meme_resolve_cache', JSON.stringify({
                'party reaction': {
                    url: 'https://media.giphy.com/media/test/giphy.gif',
                    fallbackUrl: 'https://images.unsplash.com/photo-456',
                    source: 'giphy',
                    timestamp: Date.now(),
                },
            }));

            const cached = getCachedMemeUrl('party reaction');
            expect(cached?.url).toContain('giphy.com');

            const second = await resolveMemeUrl('party reaction');
            expect(second.url).toContain('giphy.com');
        });
    });

    describe('resolveAssetsMemes', () => {
        it('leaves non-meme assets unchanged', async () => {
            const assets = [
                { type: MEDIA_TYPES.VIDEO, label: 'Clip', url: 'https://videos.pexels.com/a.mp4' },
                {
                    type: MEDIA_TYPES.MEME,
                    label: 'This Is Fine',
                    searchQuery: 'calm chaos',
                    url: 'https://images.unsplash.com/photo-789',
                },
            ];

            const resolved = await resolveAssetsMemes(assets);
            expect(resolved[0]).toEqual(assets[0]);
            expect(resolved[1].url).toBe(assets[1].url);
        });
    });

    describe('getMemeSearchQuery', () => {
        it('prefers searchQuery over label', () => {
            expect(getMemeSearchQuery({
                label: 'POV: 3AM on the Dance Floor',
                searchQuery: 'party reaction',
            })).toBe('party reaction');
        });
    });

    describe('resolveMemeUrls', () => {
        it('returns cached and fresh entries together', async () => {
            localStorage.setItem('vwf_meme_resolve_cache', JSON.stringify({
                'cached meme': {
                    url: 'https://media.giphy.com/media/cached/giphy.gif',
                    fallbackUrl: 'https://example.com/fallback.jpg',
                    source: 'giphy',
                    timestamp: Date.now(),
                },
            }));

            const results = await resolveMemeUrls([
                { query: 'cached meme', fallbackUrl: 'https://example.com/fallback.jpg' },
                { query: 'new meme', fallbackUrl: 'https://example.com/new.jpg' },
            ]);

            expect(results['cached meme'].url).toContain('giphy.com');
            expect(results['new meme'].url).toBe('https://example.com/new.jpg');
        });
    });
});

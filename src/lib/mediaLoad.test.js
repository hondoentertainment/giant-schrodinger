import { describe, it, expect, beforeEach } from 'vitest';
import {
    buildBlurPlaceholderUrl,
    getGiphyPreviewUrl,
    buildResponsiveSrcSet,
    enrichAssetForDisplay,
    preloadImageUrl,
    _resetMediaPreloadCacheForTests,
} from './mediaLoad';
import { MEDIA_TYPES } from '../data/themes';

describe('mediaLoad', () => {
    beforeEach(() => {
        _resetMediaPreloadCacheForTests();
    });

    it('builds unsplash blur placeholders', () => {
        const url = 'https://images.unsplash.com/photo-123?w=1080&h=1080';
        expect(buildBlurPlaceholderUrl(url)).toContain('w=32');
        expect(buildBlurPlaceholderUrl(url)).toContain('blur=10');
    });

    it('builds pexels blur placeholders', () => {
        const url = 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg?w=800';
        const blur = buildBlurPlaceholderUrl(url);
        expect(blur).toContain('w=32');
        expect(blur).toContain('blur=2');
    });

    it('derives giphy preview urls', () => {
        expect(getGiphyPreviewUrl('https://media.giphy.com/media/abc123/giphy.gif'))
            .toBe('https://media.giphy.com/media/abc123/200w.gif');
    });

    it('builds unsplash srcset', () => {
        const srcset = buildResponsiveSrcSet('https://images.unsplash.com/photo-abc123?w=1080');
        expect(srcset).toContain('400w');
        expect(srcset).toContain('1080w');
    });

    it('enriches youtube assets with poster thumbnails', () => {
        const enriched = enrichAssetForDisplay({
            type: MEDIA_TYPES.VIDEO,
            youtubeId: 'dQw4w9WgXcQ',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        });
        expect(enriched.posterUrl).toContain('img.youtube.com');
        expect(enriched.blurUrl).toBeTruthy();
    });

    it('enriches giphy memes with preview urls', () => {
        const enriched = enrichAssetForDisplay({
            type: MEDIA_TYPES.MEME,
            url: 'https://media.giphy.com/media/test/giphy.gif',
        });
        expect(enriched.previewUrl).toContain('200w.gif');
    });

    it('deduplicates preload promises', async () => {
        const results = await Promise.all([
            preloadImageUrl('data:image/png;base64,abc'),
            preloadImageUrl('data:image/png;base64,abc'),
        ]);
        expect(results).toEqual(['skipped', 'skipped']);
    });
});

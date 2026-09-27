import { describe, expect, it } from 'vitest';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../data/themes';
import {
    buildLocalConceptImage,
    buildPicsumFallback,
    isBrittleImageUrl,
    isPexelsPhotoUrl,
    reliableImageUrl,
} from './conceptArt';

describe('concept art', () => {
    it('builds a stable data-uri image without remote hotlinks', () => {
        const first = buildLocalConceptImage('Neon City', { id: 'neon-1', categories: ['urban', 'neon'] });
        const second = buildLocalConceptImage('Neon City', { id: 'neon-1', categories: ['urban', 'neon'] });
        expect(first).toBe(second);
        expect(first.startsWith('data:image/svg+xml,')).toBe(true);
        expect(first.length).toBeLessThan(4000);
        expect(first).not.toContain('unsplash');
        expect(first).not.toContain('picsum');
    });

    it('varies art when the concept identity changes', () => {
        const left = buildLocalConceptImage('Waterfall', { id: 'a', categories: ['nature'] });
        const right = buildLocalConceptImage('Subway', { id: 'b', categories: ['urban'] });
        expect(left).not.toBe(right);
    });

    it('keeps the old fallback name pointed at local art', () => {
        expect(buildPicsumFallback('forest')).toBe(buildLocalConceptImage('forest'));
        expect(buildPicsumFallback('forest')).not.toContain('picsum.photos');
    });

    it('detects brittle hotlinks and rewrites them', () => {
        expect(isBrittleImageUrl('https://images.unsplash.com/photo-1?w=1080')).toBe(true);
        expect(isBrittleImageUrl('https://picsum.photos/seed/dog/1080/1080')).toBe(true);
        expect(isBrittleImageUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg')).toBe(false);
        expect(isPexelsPhotoUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg')).toBe(true);
        expect(isPexelsPhotoUrl('https://videos.pexels.com/video-files/1.mp4')).toBe(false);

        const rewritten = reliableImageUrl('https://picsum.photos/seed/venn/800/800', 'gallery');
        expect(rewritten.startsWith('data:image/svg+xml,')).toBe(true);
        expect(reliableImageUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg', 'x'))
            .toContain('images.pexels.com');
    });

    it('ships theme, fusion, and audio covers without unsplash or picsum', () => {
        for (const theme of THEMES) {
            for (const asset of [...(theme.assets || []), ...(theme.fusionImages || [])]) {
                expect(asset.url || '').not.toMatch(/unsplash|picsum/);
                expect(asset.fallbackUrl || '').not.toMatch(/unsplash|picsum/);
                expect(asset.url.startsWith('data:image/svg+xml,')).toBe(true);
            }
        }

        const audio = buildThemeAssets(getThemeById('neon'), 4, MEDIA_TYPES.AUDIO, {
            seed: 3,
            preferDiverse: false,
        });
        expect(audio.length).toBeGreaterThan(0);
        for (const asset of audio) {
            expect(asset.coverUrl || '').not.toMatch(/unsplash|picsum/);
            expect(asset.coverUrl.startsWith('data:image/svg+xml,')).toBe(true);
        }
    });
});

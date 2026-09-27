import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../data/themes';
import {
    CONCEPT_ART_SOURCES,
    CONCEPT_PLATES,
    FUSION_PLATES,
    buildLocalConceptImage,
    buildPicsumFallback,
    isBrittleImageUrl,
    isBundledConceptArtUrl,
    isPexelsPhotoUrl,
    isPlaceholderArtUrl,
    reliableImageUrl,
} from './conceptArt';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const jpegMagic = Buffer.from([0xff, 0xd8, 0xff]);

function readArt(file) {
    return readFileSync(join(root, 'public', 'art', file));
}

describe('concept art', () => {
    it('builds a stable same-origin still without remote hotlinks', () => {
        const first = buildLocalConceptImage('Neon City', { id: 'neon-1', categories: ['urban', 'neon'] });
        const second = buildLocalConceptImage('Neon City', { id: 'neon-1', categories: ['urban', 'neon'] });
        expect(first).toBe(second);
        expect(isBundledConceptArtUrl(first)).toBe(true);
        expect(first).toMatch(/\/art\/plates\/.+\.jpg$/);
        expect(first).not.toContain('unsplash');
        expect(first).not.toContain('picsum');
        expect(first.startsWith('data:')).toBe(false);
    });

    it('varies art when the concept identity changes', () => {
        const left = buildLocalConceptImage('Waterfall', { id: 'a', categories: ['nature'] });
        const right = buildLocalConceptImage('Subway', { id: 'b', categories: ['urban'] });
        expect(left).not.toBe(right);
        expect(CONCEPT_PLATES.some((plate) => left.endsWith(plate))).toBe(true);
        expect(CONCEPT_PLATES.some((plate) => right.endsWith(plate))).toBe(true);
    });

    it('sends fusion surfaces to the fusion stills', () => {
        const fusion = buildLocalConceptImage('Sunday scaries x leftover sparkler', {
            id: 'fusion-1',
            role: 'fusion',
        });
        const fallback = buildLocalConceptImage('Sunday scaries x leftover sparkler', {
            id: 'fusion-1',
            role: 'fusion',
            variant: 'fallback',
        });
        expect(FUSION_PLATES.some((plate) => fusion.endsWith(plate))).toBe(true);
        expect(fallback).not.toBe(fusion);
        expect(FUSION_PLATES.some((plate) => fallback.endsWith(plate))).toBe(true);
    });

    it('keeps the old fallback name pointed at local art', () => {
        expect(buildPicsumFallback('forest')).toBe(buildLocalConceptImage('forest'));
        expect(buildPicsumFallback('forest')).not.toContain('picsum.photos');
    });

    it('detects brittle hotlinks and rewrites them to bundled stills', () => {
        expect(isBrittleImageUrl('https://images.unsplash.com/photo-1?w=1080')).toBe(true);
        expect(isBrittleImageUrl('https://picsum.photos/seed/dog/1080/1080')).toBe(true);
        expect(isBrittleImageUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg')).toBe(false);
        expect(isPexelsPhotoUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg')).toBe(true);
        expect(isPexelsPhotoUrl('https://videos.pexels.com/video-files/1.mp4')).toBe(false);
        expect(isPlaceholderArtUrl('data:image/svg+xml,abc')).toBe(true);
        expect(isPlaceholderArtUrl('data:image/png;base64,abc')).toBe(false);

        const rewritten = reliableImageUrl('https://picsum.photos/seed/venn/800/800', 'gallery', { role: 'fusion' });
        expect(FUSION_PLATES.some((plate) => rewritten.endsWith(plate))).toBe(true);
        expect(reliableImageUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg', 'x'))
            .toContain('images.pexels.com');
        expect(reliableImageUrl('data:image/svg+xml,<svg></svg>', 'old-gallery', { role: 'fusion' }))
            .toMatch(/fusion-scaries-sparkler/);
    });

    it('ships the exact source frames and derived square plates as JPEGs', () => {
        const files = [...CONCEPT_ART_SOURCES, ...CONCEPT_PLATES, ...FUSION_PLATES];
        expect(new Set(files).size).toBe(files.length);
        for (const file of files) {
            const bytes = readArt(file);
            expect(bytes.subarray(0, 3)).toEqual(jpegMagic);
            expect(bytes.length).toBeGreaterThan(10_000);
        }
    });

    it('ships theme, fusion, and audio covers without unsplash or picsum', () => {
        for (const theme of THEMES) {
            expect(theme.assets.length).toBeGreaterThan(8);
            for (const asset of theme.assets || []) {
                expect(asset.url || '').not.toMatch(/unsplash|picsum/);
                expect(asset.fallbackUrl || '').not.toMatch(/unsplash|picsum/);
                expect(asset.url).toMatch(/\/art\/plates\/.+\.jpg$/);
                expect(CONCEPT_PLATES.some((plate) => asset.url.endsWith(plate))).toBe(true);
            }
            for (const asset of theme.fusionImages || []) {
                expect(asset.url).toMatch(/fusion-scaries-sparkler/);
                expect(asset.imageSource).toBe('local');
            }
        }

        const audio = buildThemeAssets(getThemeById('neon'), 4, MEDIA_TYPES.AUDIO, {
            seed: 3,
            preferDiverse: false,
        });
        expect(audio.length).toBeGreaterThan(0);
        for (const asset of audio) {
            expect(asset.coverUrl || '').not.toMatch(/unsplash|picsum/);
            expect(asset.coverUrl).toMatch(/\/art\/plates\/.+\.jpg$/);
        }
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { buildThemeAssets, getThemeById, MEDIA_TYPES } from '../data/themes';
import {
    selectRoundAssets,
    getAssetKey,
    getRecentAssetKeys,
    trackRecentAssets,
    resolveSelectedAssets,
} from './assetSelection';

describe('assetSelection', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getAssetKey', () => {
        it('prefers stable asset id', () => {
            expect(getAssetKey({ id: 'neon-1', label: 'Cat', url: 'https://example.com/a.jpg' })).toBe('neon-1');
        });

        it('falls back to label and url', () => {
            expect(getAssetKey({ label: 'Cat', url: 'https://example.com/a.jpg' })).toBe('Cat::https://example.com/a.jpg');
        });
    });

    describe('recent asset history', () => {
        it('tracks and retrieves recent asset keys', () => {
            trackRecentAssets([
                { id: 'a1', label: 'A', url: 'https://example.com/a.jpg' },
                { id: 'a2', label: 'B', url: 'https://example.com/b.jpg' },
            ]);
            expect(getRecentAssetKeys()).toEqual(['a1', 'a2']);
        });
    });

    describe('buildThemeAssets', () => {
        it('returns deterministic pairs for the same seed', () => {
            const theme = getThemeById('neon');
            const first = buildThemeAssets(theme, 2, MEDIA_TYPES.IMAGE, { seed: 42, preferDiverse: false });
            const second = buildThemeAssets(theme, 2, MEDIA_TYPES.IMAGE, { seed: 42, preferDiverse: false });
            expect(first.map((asset) => asset.label)).toEqual(second.map((asset) => asset.label));
        });

        it('excludes recently used assets when alternatives exist', () => {
            const theme = getThemeById('neon');
            const first = buildThemeAssets(theme, 2, MEDIA_TYPES.IMAGE, { seed: 100, preferDiverse: false });
            const excludeIds = first.map(getAssetKey);
            const second = buildThemeAssets(theme, 2, MEDIA_TYPES.IMAGE, {
                seed: 101,
                preferDiverse: false,
                excludeIds,
            });

            const overlap = second.filter((asset) => excludeIds.includes(getAssetKey(asset)));
            expect(overlap).toHaveLength(0);
        });

        it('prefers diverse category pairs over highly similar ones', () => {
            const theme = {
                id: 'test',
                assets: [
                    { id: 'a', label: 'Neon Alley', url: 'https://example.com/a.jpg', categories: ['urban', 'art'] },
                    { id: 'b', label: 'Neon Street', url: 'https://example.com/b.jpg', categories: ['urban', 'art'] },
                    { id: 'c', label: 'Forest Canopy', url: 'https://example.com/c.jpg', categories: ['nature', 'adventure'] },
                ],
            };

            const [left, right] = buildThemeAssets(theme, 2, MEDIA_TYPES.IMAGE, {
                seed: 7,
                preferDiverse: true,
            });

            const labels = new Set([left.label, right.label]);
            expect(labels.has('Forest Canopy')).toBe(true);
            expect(labels.has('Neon Alley') && labels.has('Neon Street')).toBe(false);
        });

        it('builds square entropy-cropped unsplash urls', () => {
            const theme = getThemeById('neon');
            const [asset] = buildThemeAssets(theme, 1, MEDIA_TYPES.IMAGE, { seed: 1, preferDiverse: false });
            expect(asset.url).toContain('h=1080');
            expect(asset.url).toContain('crop=entropy');
        });
    });

    describe('selectRoundAssets', () => {
        it('returns two assets for theme rounds', () => {
            const theme = getThemeById('neon');
            const assets = selectRoundAssets({ theme, seed: 999, roundNumber: 1 });
            expect(assets).toHaveLength(2);
            expect(assets[0].label).toBeTruthy();
            expect(assets[1].label).toBeTruthy();
        });

        it('returns mixed meme and video types for memes_videos mode', () => {
            const theme = getThemeById('neon');
            const assets = selectRoundAssets({
                theme,
                mediaType: MEDIA_TYPES.MEMES_VIDEOS,
                seed: 4242,
                roundNumber: 1,
            });
            expect(assets).toHaveLength(2);
            const types = new Set(assets.map((asset) => asset.type));
            expect(types.has(MEDIA_TYPES.MEME) || types.has(MEDIA_TYPES.VIDEO)).toBe(true);
        });

        it('uses custom video pool in video mode when enabled', () => {
            const theme = getThemeById('neon');
            const customPool = [
                { id: 'yt-1', type: 'video', label: 'Clip A', url: 'https://youtu.be/dQw4w9WgXcQ', youtubeId: 'dQw4w9WgXcQ' },
                { id: 'yt-2', type: 'video', label: 'Clip B', url: 'https://youtu.be/9bZkp7q19f0', youtubeId: '9bZkp7q19f0' },
            ];
            const assets = selectRoundAssets({
                theme,
                mediaType: MEDIA_TYPES.VIDEO,
                useCustomImages: true,
                customPool,
                seed: 1234,
                roundNumber: 1,
            });

            expect(assets).toHaveLength(2);
            expect(assets.every((asset) => asset.type === MEDIA_TYPES.VIDEO)).toBe(true);
            expect(assets.map((asset) => asset.label).sort()).toEqual(['Clip A', 'Clip B']);
        });

        it('uses deterministic daily seed offsets by round number', () => {
            const theme = getThemeById('neon');
            const roundOne = selectRoundAssets({
                theme,
                seed: 20260623,
                roundNumber: 1,
                isDailyChallenge: true,
            });
            const roundTwo = selectRoundAssets({
                theme,
                seed: 20260623,
                roundNumber: 2,
                isDailyChallenge: true,
            });

            expect(roundOne.map((asset) => asset.label)).not.toEqual(roundTwo.map((asset) => asset.label));
        });
    });

    describe('resolveSelectedAssets', () => {
        it('keeps meme assets when meme api is unavailable', async () => {
            const memeAsset = {
                type: MEDIA_TYPES.MEME,
                label: 'Big Brain Moment',
                searchQuery: 'thinking face',
                url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d',
                fallbackUrl: 'https://picsum.photos/seed/thinking-face/1080/1080',
            };

            const resolved = await resolveSelectedAssets([memeAsset, {
                type: MEDIA_TYPES.VIDEO,
                label: 'Clip',
                url: 'https://videos.pexels.com/a.mp4',
            }]);

            expect(resolved[0].url).toBe(memeAsset.url);
            expect(resolved[1].url).toBe('https://videos.pexels.com/a.mp4');
        });
    });
});

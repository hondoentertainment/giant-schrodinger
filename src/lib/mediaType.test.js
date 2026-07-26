import { describe, it, expect } from 'vitest';
import { MEDIA_TYPES } from '../data/themes';
import {
    normalizeMediaType,
    formatAssetForShare,
    getCollisionMediaMode,
    getEffectiveRoundMediaType,
} from './mediaType';

describe('mediaType helpers', () => {
    it('maps legacy mixed mode to memes_videos', () => {
        expect(normalizeMediaType('mixed')).toBe(MEDIA_TYPES.MEMES_VIDEOS);
    });

    it('formats share labels with media type hints', () => {
        expect(formatAssetForShare({ label: 'Cat', type: MEDIA_TYPES.MEME })).toBe('Cat (Meme)');
        expect(formatAssetForShare({ label: 'Clip', type: MEDIA_TYPES.VIDEO })).toBe('Clip (Video)');
    });

    it('infers collision media mode from saved assets', () => {
        expect(getCollisionMediaMode({
            assets: {
                left: { type: MEDIA_TYPES.MEME },
                right: { type: MEDIA_TYPES.VIDEO },
            },
        })).toBe(MEDIA_TYPES.MEMES_VIDEOS);
    });

    it('uses daily challenge media type when active', () => {
        expect(getEffectiveRoundMediaType({
            userMediaType: MEDIA_TYPES.IMAGE,
            isDailyChallenge: true,
            dailyChallenge: { mediaType: MEDIA_TYPES.MEMES_VIDEOS },
        })).toBe(MEDIA_TYPES.MEMES_VIDEOS);
    });
});

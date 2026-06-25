import { describe, it, expect } from 'vitest';
import {
    parseYoutubeVideoId,
    isYoutubeUrl,
    getYoutubeEmbedUrl,
    getYoutubeThumbnailUrl,
    getYoutubeVideoIdFromAsset,
} from './youtube';

describe('youtube utilities', () => {
    const SAMPLE_ID = 'dQw4w9WgXcQ';

    it('parses standard watch URLs', () => {
        expect(parseYoutubeVideoId(`https://www.youtube.com/watch?v=${SAMPLE_ID}`)).toBe(SAMPLE_ID);
        expect(parseYoutubeVideoId(`https://youtube.com/watch?v=${SAMPLE_ID}&t=42s`)).toBe(SAMPLE_ID);
    });

    it('parses short youtu.be links', () => {
        expect(parseYoutubeVideoId(`https://youtu.be/${SAMPLE_ID}`)).toBe(SAMPLE_ID);
    });

    it('parses embed and shorts URLs', () => {
        expect(parseYoutubeVideoId(`https://www.youtube.com/embed/${SAMPLE_ID}`)).toBe(SAMPLE_ID);
        expect(parseYoutubeVideoId(`https://www.youtube.com/shorts/${SAMPLE_ID}`)).toBe(SAMPLE_ID);
    });

    it('accepts bare video IDs', () => {
        expect(parseYoutubeVideoId(SAMPLE_ID)).toBe(SAMPLE_ID);
    });

    it('rejects invalid input', () => {
        expect(parseYoutubeVideoId('')).toBeNull();
        expect(parseYoutubeVideoId('https://example.com/video.mp4')).toBeNull();
        expect(parseYoutubeVideoId('not-a-valid-id')).toBeNull();
    });

    it('detects YouTube URLs', () => {
        expect(isYoutubeUrl(`https://youtu.be/${SAMPLE_ID}`)).toBe(true);
        expect(isYoutubeUrl('https://example.com/x.mp4')).toBe(false);
    });

    it('builds embed and thumbnail URLs', () => {
        const embed = getYoutubeEmbedUrl(SAMPLE_ID, { origin: 'https://app.test' });
        expect(embed).toContain(`embed/${SAMPLE_ID}`);
        expect(embed).toContain('youtube-nocookie.com');
        expect(embed).toContain('enablejsapi=1');

        expect(getYoutubeThumbnailUrl(SAMPLE_ID)).toBe(
            `https://img.youtube.com/vi/${SAMPLE_ID}/hqdefault.jpg`
        );
    });

    it('reads video id from asset objects', () => {
        expect(getYoutubeVideoIdFromAsset({ youtubeId: SAMPLE_ID })).toBe(SAMPLE_ID);
        expect(getYoutubeVideoIdFromAsset({
            provider: 'youtube',
            url: `https://youtu.be/${SAMPLE_ID}`,
        })).toBe(SAMPLE_ID);
        expect(getYoutubeVideoIdFromAsset({
            url: 'https://videos.pexels.com/video-files/123.mp4',
        })).toBeNull();
    });
});

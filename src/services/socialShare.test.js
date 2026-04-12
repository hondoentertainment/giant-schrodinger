import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    dataURLtoFile,
    generateShareText,
    createShareText,
    shareToTwitter,
    shareToFacebook,
    shareToLinkedIn,
    copyShareLink,
    downloadFusionImage,
    shareViaWebShare,
} from './socialShare';

describe('socialShare service', () => {
    let openSpy;

    beforeEach(() => {
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('dataURLtoFile', () => {
        it('decodes a data URL into a File with the given filename', () => {
            // "hi" base64 -> "aGk="
            const dataUrl = 'data:text/plain;base64,aGk=';
            const file = dataURLtoFile(dataUrl, 'hello.txt');
            expect(file).toBeInstanceOf(File);
            expect(file.name).toBe('hello.txt');
            expect(file.type).toBe('text/plain');
        });
    });

    describe('generateShareText', () => {
        it('uses the "unhinged" tone at score 9+', () => {
            const text = generateShareText(10, 'Cat', 'Dog', 'fluffy');
            expect(text).toMatch(/unhinged/i);
            expect(text).toContain('#VennWithFriends');
        });

        it('uses the "sharp" tone at score 7-8', () => {
            const text = generateShareText(7, 'Cat', 'Dog', 'fluffy');
            expect(text).toMatch(/sharp/i);
        });

        it('uses the low-score tone under 4', () => {
            const text = generateShareText(2, 'Cat', 'Dog', 'fluffy');
            expect(text).toMatch(/Surely you can beat this/);
        });

        it('includes streak and rank extras when provided', () => {
            const text = generateShareText(8, 'A', 'B', 'x', { streak: 5, rank: 12 });
            expect(text).toContain('5-day streak');
            expect(text).toContain('Rank #12');
        });
    });

    describe('createShareText', () => {
        it('uses label or title from assets, falling back to Unknown', () => {
            const text = createShareText({
                submission: 's',
                score: 8,
                assets: { left: { label: 'Left' }, right: { title: 'Right' } },
            });
            expect(text).toContain('"Left"');
            expect(text).toContain('"Right"');
        });
    });

    describe('shareToTwitter', () => {
        it('opens Twitter intent URL with hashtags', () => {
            shareToTwitter({ submission: 's', score: 8, assets: { left: { title: 'L' }, right: { title: 'R' } } });
            expect(openSpy).toHaveBeenCalled();
            const url = openSpy.mock.calls[0][0];
            expect(url).toContain('https://twitter.com/intent/tweet');
            expect(url).toContain('hashtags=VennWithFriends');
        });
    });

    describe('shareToFacebook', () => {
        it('opens the Facebook sharer URL including pageUrl and quote', () => {
            shareToFacebook({
                submission: 's',
                score: 8,
                pageUrl: 'https://example.com/',
                assets: { left: { title: 'Left' }, right: { title: 'Right' } },
            });
            const url = openSpy.mock.calls[0][0];
            expect(url).toContain('facebook.com/sharer');
            expect(url).toMatch(/u=https%3A%2F%2Fexample.com/);
            expect(decodeURIComponent(url)).toContain('"Left"');
        });
    });

    describe('shareToLinkedIn', () => {
        it('opens the LinkedIn share URL', () => {
            shareToLinkedIn({
                submission: 's',
                score: 8,
                pageUrl: 'https://x.y/z',
                assets: { left: { title: 'L' }, right: { title: 'R' } },
            });
            const url = openSpy.mock.calls[0][0];
            expect(url).toContain('linkedin.com/sharing');
            expect(url).toMatch(/url=https%3A%2F%2Fx.y%2Fz/);
        });
    });

    describe('copyShareLink', () => {
        it('uses navigator.clipboard when available', async () => {
            const writeText = vi.fn().mockResolvedValue();
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText },
                configurable: true,
            });
            const result = await copyShareLink({
                submission: 'hi',
                score: 9,
                assets: { left: { title: 'A' }, right: { title: 'B' } },
            });
            expect(result.success).toBe(true);
            expect(writeText).toHaveBeenCalledWith(expect.stringContaining('9/10'));
        });

        it('falls back to execCommand when clipboard rejects', async () => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: vi.fn().mockRejectedValue(new Error('nope')) },
                configurable: true,
            });
            document.execCommand = vi.fn().mockReturnValue(true);
            const result = await copyShareLink({
                submission: 'hi',
                score: 3,
                assets: { left: { title: 'A' }, right: { title: 'B' } },
            });
            expect(result.success).toBe(true);
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });

    describe('downloadFusionImage', () => {
        it('creates an anchor with download attribute and triggers click', () => {
            const link = { click: vi.fn() };
            const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(link);
            const appendSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(link);
            const removeSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(link);

            downloadFusionImage('data:image/png;base64,abcd', 'my.png');
            expect(createSpy).toHaveBeenCalledWith('a');
            expect(link.download).toBe('my.png');
            expect(link.href).toBe('data:image/png;base64,abcd');
            expect(link.click).toHaveBeenCalled();
            expect(appendSpy).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();
        });
    });

    describe('shareViaWebShare', () => {
        it('calls navigator.share and returns success', async () => {
            const share = vi.fn().mockResolvedValue();
            Object.defineProperty(navigator, 'share', { value: share, configurable: true });
            Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
            const result = await shareViaWebShare({
                submission: 's',
                score: 9,
                commentary: 'nice',
                assets: { left: { title: 'L' }, right: { title: 'R' } },
            });
            expect(share).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('returns success when the user cancels (AbortError)', async () => {
            const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
            Object.defineProperty(navigator, 'share', {
                value: vi.fn().mockRejectedValue(abort),
                configurable: true,
            });
            Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
            const result = await shareViaWebShare({
                submission: 's', score: 5, commentary: 'ok',
                assets: { left: { title: 'L' }, right: { title: 'R' } },
            });
            expect(result.success).toBe(true);
        });

        it('returns failure object on non-abort errors', async () => {
            Object.defineProperty(navigator, 'share', {
                value: vi.fn().mockRejectedValue(new Error('boom')),
                configurable: true,
            });
            Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
            const result = await shareViaWebShare({
                submission: 's', score: 5, commentary: 'ok',
                assets: { left: { title: 'L' }, right: { title: 'R' } },
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('boom');
        });
    });
});

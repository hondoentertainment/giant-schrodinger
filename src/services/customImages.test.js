import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCustomImages,
    addCustomImage,
    addCustomMeme,
    addCustomVideo,
    addCustomYoutubeVideo,
    removeCustomImage,
    updateCustomImageLabel,
    getStorageUsage,
} from './customImages';

describe('customImages service', () => {
    let mockFile;

    beforeEach(() => {
        localStorage.clear();
        mockFile = new File(['x'.repeat(100)], 'test.png', { type: 'image/png' });
    });

    describe('getCustomImages', () => {
        it('returns empty array when no images', () => {
            expect(getCustomImages()).toEqual([]);
        });

        it('returns stored images', async () => {
            await addCustomImage(mockFile);
            expect(getCustomImages()).toHaveLength(1);
        });
    });

    describe('addCustomImage', () => {
        it('adds image with id, label, and data URL', async () => {
            const result = await addCustomImage(mockFile);
            expect(result).toHaveProperty('id');
            expect(result.label).toMatch(/test/i);
            expect(result.url).toMatch(/^data:image\/png;base64,/);
        });

        it('uses custom label when provided', async () => {
            const result = await addCustomImage(mockFile, 'My Label');
            expect(result.label).toBe('My Label');
        });

        it('strips file extension from default label', async () => {
            const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
            const result = await addCustomImage(file);
            expect(result.label).not.toContain('.jpg');
        });

        it('throws when exceeding max images', async () => {
            const file = new File(['x'], 'tiny.png', { type: 'image/png' });
            const tinyDataUrl = 'data:image/png;base64,' + btoa('x'.repeat(10));
            localStorage.setItem(
                'vwf_custom_images',
                JSON.stringify(
                    Array.from({ length: 24 }, (_, i) => ({
                        id: `img-${i}`,
                        label: `Image ${i}`,
                        url: tinyDataUrl,
                    }))
                )
            );
            await expect(addCustomImage(file)).rejects.toThrow(/Maximum 24 items/);
        });

        it('rejects non-image file types', async () => {
            const txtFile = new File(['hello'], 'file.txt', { type: 'text/plain' });
            await expect(addCustomImage(txtFile)).rejects.toThrow(/image/);
        });

        it('rejects file exceeding 2MB', async () => {
            const huge = new File(
                [new ArrayBuffer(3 * 1024 * 1024)],
                'huge.png',
                { type: 'image/png' }
            );
            await expect(addCustomImage(huge)).rejects.toThrow(/too large|max/i);
        });
    });

    describe('addCustomMeme', () => {
        it('adds meme with type meme', async () => {
            const result = await addCustomMeme(mockFile, 'Funny Cat');
            expect(result.type).toBe('meme');
            expect(result.label).toBe('Funny Cat');
        });
    });

    describe('addCustomVideo', () => {
        it('adds video with type video', async () => {
            const videoFile = new File(['video-bytes'], 'clip.mp4', { type: 'video/mp4' });
            const result = await addCustomVideo(videoFile, 'My Clip');
            expect(result.type).toBe('video');
            expect(result.label).toBe('My Clip');
        });

        it('rejects non-video file types', async () => {
            await expect(addCustomVideo(mockFile)).rejects.toThrow(/video/i);
        });
    });

    describe('addCustomYoutubeVideo', () => {
        it('adds YouTube video with provider metadata', async () => {
            const result = await addCustomYoutubeVideo('https://youtu.be/dQw4w9WgXcQ', 'Rick Roll');
            expect(result.type).toBe('video');
            expect(result.provider).toBe('youtube');
            expect(result.youtubeId).toBe('dQw4w9WgXcQ');
            expect(result.label).toBe('Rick Roll');
            expect(result.posterUrl).toContain('img.youtube.com');
        });

        it('rejects invalid YouTube URLs', async () => {
            await expect(addCustomYoutubeVideo('https://example.com/not-youtube')).rejects.toThrow(/valid YouTube/i);
        });

        it('rejects duplicate YouTube videos', async () => {
            await addCustomYoutubeVideo('dQw4w9WgXcQ');
            await expect(addCustomYoutubeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).rejects.toThrow(/already/i);
        });
    });

    describe('getStorageUsage', () => {
        it('reports usage after uploads', async () => {
            await addCustomImage(mockFile);
            const usage = getStorageUsage();
            expect(usage.used).toBeGreaterThan(0);
            expect(usage.percentage).toBeGreaterThanOrEqual(0);
            expect(usage.maxMB).toBeDefined();
        });
    });

    describe('removeCustomImage', () => {
        it('removes image by id', async () => {
            const added = await addCustomImage(mockFile);
            removeCustomImage(added.id);
            expect(getCustomImages()).toHaveLength(0);
        });

        it('no-op when id not found', async () => {
            await addCustomImage(mockFile);
            removeCustomImage('nonexistent');
            expect(getCustomImages()).toHaveLength(1);
        });
    });

    describe('updateCustomImageLabel', () => {
        it('updates label for existing image', async () => {
            const added = await addCustomImage(mockFile);
            updateCustomImageLabel(added.id, 'New Label');
            const images = getCustomImages();
            expect(images[0].label).toBe('New Label');
        });

        it('truncates label to 30 chars', async () => {
            const added = await addCustomImage(mockFile);
            const long = 'a'.repeat(50);
            updateCustomImageLabel(added.id, long);
            const images = getCustomImages();
            expect(images[0].label).toHaveLength(30);
        });

        it('no-op when id not found', async () => {
            await addCustomImage(mockFile);
            updateCustomImageLabel('nonexistent', 'X');
            expect(getCustomImages()[0].label).not.toBe('X');
        });
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCustomImages,
    addCustomImage,
    removeCustomImage,
    updateCustomImageLabel,
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
            await expect(addCustomImage(file)).rejects.toThrow(/Maximum 24 images/);
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

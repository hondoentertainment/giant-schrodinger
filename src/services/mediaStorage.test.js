import { describe, it, expect, vi, beforeEach } from 'vitest';

const uploadMock = vi.fn();
const removeMock = vi.fn();

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => true),
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: uploadMock,
                remove: removeMock,
                getPublicUrl: vi.fn((path) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } })),
            })),
        },
    },
}));

vi.mock('../lib/deviceId', () => ({
    getDeviceId: vi.fn(() => 'dev-test'),
}));

import {
    uploadMediaFile,
    uploadDataUrl,
    deleteMediaAtPath,
    isRemoteMediaUrl,
} from './mediaStorage';

describe('mediaStorage service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        uploadMock.mockResolvedValue({ error: null });
    });

    describe('isRemoteMediaUrl', () => {
        it('detects http urls and excludes data urls', () => {
            expect(isRemoteMediaUrl('https://cdn.example.com/a.jpg')).toBe(true);
            expect(isRemoteMediaUrl('data:image/png;base64,abc')).toBe(false);
        });
    });

    describe('uploadMediaFile', () => {
        it('uploads to the media bucket and returns a public url', async () => {
            const file = new File(['hello'], 'meme.png', { type: 'image/png' });
            const result = await uploadMediaFile(file, { folder: 'custom', filename: 'meme.png' });

            expect(uploadMock).toHaveBeenCalled();
            expect(result.url).toContain('https://cdn.example.com/custom/dev-test/');
            expect(result.storagePath).toContain('custom/dev-test/');
        });
    });

    describe('uploadDataUrl', () => {
        it('uploads fusion bytes from a data url', async () => {
            const dataUrl = `data:image/png;base64,${btoa('png-bytes')}`;
            const result = await uploadDataUrl(dataUrl, { folder: 'fusion', filename: 'fusion.png' });

            expect(uploadMock).toHaveBeenCalled();
            expect(result.url).toContain('https://cdn.example.com/fusion/dev-test/');
        });
    });

    describe('deleteMediaAtPath', () => {
        it('removes files from storage', async () => {
            removeMock.mockResolvedValue({ error: null });
            const ok = await deleteMediaAtPath('custom/dev-test/file.png');
            expect(ok).toBe(true);
            expect(removeMock).toHaveBeenCalledWith(['custom/dev-test/file.png']);
        });
    });
});

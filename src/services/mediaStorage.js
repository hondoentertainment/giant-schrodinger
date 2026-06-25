import { supabase, isBackendEnabled } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

const MEDIA_BUCKET = 'media';

function getPublicUrl(path) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
}

function sanitizeFilename(name) {
    return String(name || 'upload')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80) || 'upload';
}

function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header?.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] || 'application/octet-stream';
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return { blob: new Blob([bytes], { type: mime }), mime };
}

export function isRemoteMediaUrl(url) {
    return typeof url === 'string'
        && (url.startsWith('http://') || url.startsWith('https://'))
        && !url.startsWith('data:');
}

export function isStorageEnabled() {
    return isBackendEnabled() && !!supabase;
}

export async function uploadMediaFile(file, { folder = 'custom', filename } = {}) {
    if (!isStorageEnabled() || !file) return null;

    const safeName = sanitizeFilename(filename || file.name || `${Date.now()}`);
    const path = `${folder}/${getDeviceId()}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, {
            upsert: false,
            contentType: file.type || undefined,
        });

    if (error) {
        console.warn('mediaStorage.uploadMediaFile failed:', error);
        return null;
    }

    return {
        url: getPublicUrl(path),
        storagePath: path,
        bytes: file.size || 0,
    };
}

export async function uploadDataUrl(dataUrl, { folder = 'fusion', filename = `${Date.now()}.png` } = {}) {
    if (!isStorageEnabled() || !dataUrl?.startsWith('data:')) return null;

    const { blob, mime } = dataUrlToBlob(dataUrl);
    const safeName = sanitizeFilename(filename);
    const path = `${folder}/${getDeviceId()}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, {
            upsert: false,
            contentType: mime,
        });

    if (error) {
        console.warn('mediaStorage.uploadDataUrl failed:', error);
        return null;
    }

    return {
        url: getPublicUrl(path),
        storagePath: path,
        bytes: blob.size,
    };
}

export async function deleteMediaAtPath(storagePath) {
    if (!isStorageEnabled() || !storagePath) return false;

    const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove([storagePath]);

    if (error) {
        console.warn('mediaStorage.deleteMediaAtPath failed:', error);
        return false;
    }

    return true;
}

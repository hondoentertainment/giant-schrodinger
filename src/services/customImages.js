import { uploadMediaFile, deleteMediaAtPath, isStorageEnabled } from './mediaStorage';



import {
    getYoutubeThumbnailUrl,
    getYoutubeWatchUrl,
    parseYoutubeVideoId,
} from '../lib/youtube';

const STORAGE_KEY = 'vwf_custom_images';

const MAX_ITEMS = 24;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB per image/meme

const MAX_VIDEO_BYTES = 6 * 1024 * 1024; // 6MB per video clip

const MAX_TOTAL_BYTES = 16 * 1024 * 1024; // 16MB total



/**

 * Compress an image data URL by resizing and re-encoding as JPEG.

 * @param {string} dataUrl

 * @param {number} [maxWidth=800]

 * @param {number} [quality=0.8]

 * @returns {Promise<string>} compressed data URL

 */

export async function compressImage(dataUrl, maxWidth = 800, quality = 0.8) {

    try {

        const testCanvas = document.createElement('canvas');

        if (!testCanvas.getContext('2d')) {

            return dataUrl;

        }

    } catch {

        return dataUrl;

    }



    return new Promise((resolve) => {

        const img = new Image();

        img.onload = () => {

            try {

                const canvas = document.createElement('canvas');

                let width = img.width;

                let height = img.height;



                if (width > maxWidth) {

                    height = (height * maxWidth) / width;

                    width = maxWidth;

                }



                canvas.width = width;

                canvas.height = height;

                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', quality));

            } catch {

                resolve(dataUrl);

            }

        };

        img.onerror = () => resolve(dataUrl);

        img.src = dataUrl;

    });

}



function loadImages() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) return [];

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) return [];

        return parsed.map((item) => ({

            ...item,

            type: item.type || 'image',

        }));

    } catch {

        return [];

    }

}



function saveImages(images) {

    try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(images));

    } catch (e) {

        console.warn('Failed to save custom images:', e);

    }

}



function estimateDataUrlBytes(dataUrl) {

    const base64 = dataUrl?.split(',')[1] || '';

    return Math.ceil(base64.length * 0.75);

}



function getItemBytes(item) {

    if (typeof item?.bytes === 'number' && item.bytes > 0) {

        return item.bytes;

    }

    if (item?.provider === 'youtube') return 512;

    return estimateDataUrlBytes(item?.url);

}



function getTotalBytes(items) {

    return items.reduce((acc, item) => acc + getItemBytes(item), 0);

}



function validateFile(file, { maxBytes, allowedPrefix }) {

    if (!file.type.startsWith(allowedPrefix)) {

        throw new Error(`File must be ${allowedPrefix.replace('/', '/')} type`);

    }

    if (file.size > maxBytes) {

        throw new Error(`File too large (max ${maxBytes / 1024 / 1024}MB)`);

    }

}



/** @returns {Promise<string>} data URL */

function fileToDataUrl(file, { maxBytes, allowedPrefix }) {

    return new Promise((resolve, reject) => {

        validateFile(file, { maxBytes, allowedPrefix });

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => reject(new Error('Failed to read file'));

        reader.readAsDataURL(file);

    });

}



async function dataUrlToUploadFile(dataUrl, filename, mimeType = 'image/jpeg') {

    const response = await fetch(dataUrl);

    const blob = await response.blob();

    return new File([blob], filename, { type: mimeType || blob.type || 'image/jpeg' });

}



async function prepareImageUpload(file) {

    validateFile(file, { maxBytes: MAX_IMAGE_BYTES, allowedPrefix: 'image/' });



    if (isStorageEnabled()) {

        if (file.type === 'image/gif') {

            const uploaded = await uploadMediaFile(file, { folder: 'custom', filename: file.name });

            if (uploaded?.url) return uploaded;

        } else {

            const rawDataUrl = await fileToDataUrl(file, { maxBytes: MAX_IMAGE_BYTES, allowedPrefix: 'image/' });

            const compressedDataUrl = await compressImage(rawDataUrl);

            const uploadFile = await dataUrlToUploadFile(compressedDataUrl, file.name.replace(/\.[^.]+$/, '.jpg'));

            const uploaded = await uploadMediaFile(uploadFile, { folder: 'custom', filename: uploadFile.name });

            if (uploaded?.url) return uploaded;

        }

    }



    const rawDataUrl = await fileToDataUrl(file, { maxBytes: MAX_IMAGE_BYTES, allowedPrefix: 'image/' });

    const url = file.type === 'image/gif' ? rawDataUrl : await compressImage(rawDataUrl);

    return { url, bytes: getItemBytes({ url }) };

}



async function prepareVideoUpload(file) {

    validateFile(file, { maxBytes: MAX_VIDEO_BYTES, allowedPrefix: 'video/' });



    if (isStorageEnabled()) {

        const uploaded = await uploadMediaFile(file, { folder: 'custom', filename: file.name });

        if (uploaded?.url) return uploaded;

    }



    const url = await fileToDataUrl(file, { maxBytes: MAX_VIDEO_BYTES, allowedPrefix: 'video/' });

    return { url, bytes: getItemBytes({ url }) };

}



async function addCustomMedia(file, { label, type, prepareUpload }) {

    const items = loadImages();

    if (items.length >= MAX_ITEMS) {

        throw new Error(`Maximum ${MAX_ITEMS} items allowed`);

    }



    const prepared = await prepareUpload(file);

    const newBytes = prepared.bytes ?? getItemBytes({ url: prepared.url });

    if (getTotalBytes(items) + newBytes > MAX_TOTAL_BYTES) {

        if (prepared.storagePath) {

            await deleteMediaAtPath(prepared.storagePath);

        }

        throw new Error('Storage limit reached. Remove some media first.');

    }



    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const item = {

        id,

        type,

        label: (label || file.name || 'My Media').replace(/\.[^.]+$/, '').slice(0, 30),

        url: prepared.url,

        storagePath: prepared.storagePath || null,

        bytes: newBytes,

    };

    items.push(item);

    saveImages(items);

    return item;

}



/**

 * Get all custom media (images, memes, videos).

 * @returns {{ id: string, label: string, url: string, type?: string }[]}

 */

export function getCustomImages() {

    return loadImages();

}



export function getCustomMemes() {

    return loadImages().filter((item) => item.type === 'meme' || item.type === 'image' || !item.type);

}



export function getCustomVideos() {

    return loadImages().filter((item) => item.type === 'video');

}



export async function addCustomImage(file, label) {

    return addCustomMedia(file, {

        label,

        type: 'image',

        prepareUpload: prepareImageUpload,

    });

}



export async function addCustomMeme(file, label) {

    return addCustomMedia(file, {

        label,

        type: 'meme',

        prepareUpload: prepareImageUpload,

    });

}



export async function addCustomVideo(file, label) {

    return addCustomMedia(file, {

        label,

        type: 'video',

        prepareUpload: prepareVideoUpload,

    });

}



/**
 * Add a YouTube video by URL or video ID.
 * @param {string} input YouTube watch/share URL or 11-character video ID
 * @param {string} [label] optional display label
 */
export async function addCustomYoutubeVideo(input, label) {
    const videoId = parseYoutubeVideoId(input);
    if (!videoId) {
        throw new Error('Enter a valid YouTube URL or video ID');
    }

    const items = loadImages();
    if (items.length >= MAX_ITEMS) {
        throw new Error(`Maximum ${MAX_ITEMS} items allowed`);
    }

    const duplicate = items.find((item) => item.youtubeId === videoId);
    if (duplicate) {
        throw new Error('This YouTube video is already in your library');
    }

    const item = {
        id: `youtube-${videoId}-${Date.now().toString(36)}`,
        type: 'video',
        provider: 'youtube',
        youtubeId: videoId,
        label: (label || 'YouTube Video').replace(/\.[^.]+$/, '').slice(0, 30),
        url: getYoutubeWatchUrl(videoId),
        posterUrl: getYoutubeThumbnailUrl(videoId),
        bytes: 512,
    };

    items.push(item);
    saveImages(items);
    return item;
}



export function removeCustomImage(id) {

    const images = loadImages();

    const target = images.find((img) => img.id === id);

    if (target?.storagePath) {

        deleteMediaAtPath(target.storagePath);

    }

    saveImages(images.filter((img) => img.id !== id));

}



export function updateCustomImageLabel(id, label) {

    const images = loadImages();

    const idx = images.findIndex((img) => img.id === id);

    if (idx >= 0) {

        images[idx] = { ...images[idx], label: (label || 'My Image').slice(0, 30) };

        saveImages(images);

    }

}



export function getStorageUsage() {

    const images = getCustomImages();

    const totalBytes = images.reduce((sum, img) => sum + getItemBytes(img), 0);

    const MAX_STORAGE = MAX_TOTAL_BYTES;



    return {

        used: totalBytes,

        max: MAX_STORAGE,

        usedMB: (totalBytes / (1024 * 1024)).toFixed(1),

        maxMB: (MAX_STORAGE / (1024 * 1024)).toFixed(0),

        percentage: Math.round((totalBytes / MAX_STORAGE) * 100),

        remaining: MAX_STORAGE - totalBytes,

    };

}



export function exportCustomImages() {

    const images = getCustomImages();

    const blob = new Blob([JSON.stringify(images)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = 'venn-custom-images.json';

    a.click();

    URL.revokeObjectURL(url);

}



export function importCustomImages(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = (e) => {

            try {

                const images = JSON.parse(e.target.result);

                if (!Array.isArray(images)) throw new Error('Invalid format');

                const valid = images.filter((img) => img.id && img.label && img.url);

                saveImages(valid);

                resolve(valid.length);

            } catch {

                reject(new Error('Invalid image backup file'));

            }

        };

        reader.readAsText(file);

    });

}



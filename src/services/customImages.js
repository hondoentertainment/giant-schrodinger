const STORAGE_KEY = 'vwf_custom_images';
const MAX_IMAGES = 24;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per image
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10MB total

/**
 * Compress an image data URL by resizing and re-encoding as JPEG.
 * @param {string} dataUrl
 * @param {number} [maxWidth=800]
 * @param {number} [quality=0.8]
 * @returns {Promise<string>} compressed data URL
 */
export async function compressImage(dataUrl, maxWidth = 800, quality = 0.8) {
    // Quick check: if canvas 2d context is not available (e.g. jsdom in tests), skip compression
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
        return Array.isArray(parsed) ? parsed : [];
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

/** @returns {Promise<string>} data URL */
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            reject(new Error(`Image too large (max ${MAX_SIZE_BYTES / 1024 / 1024}MB)`));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get all custom images.
 * @returns {{ id: string, label: string, url: string }[]}
 */
export function getCustomImages() {
    return loadImages();
}

/**
 * Add a custom image from a File.
 * @param {File} file
 * @param {string} [label] optional label, defaults to filename
 * @returns {Promise<{ id: string, label: string, url: string }>}
 */
export async function addCustomImage(file, label) {
    const images = loadImages();
    if (images.length >= MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} images allowed`);
    }
    const totalBytes = images.reduce((acc, img) => acc + (img.url?.length || 0) * 0.75, 0);
    const rawDataUrl = await fileToDataUrl(file);
    const dataUrl = await compressImage(rawDataUrl);
    const newBytes = dataUrl.length * 0.75;
    if (totalBytes + newBytes > MAX_TOTAL_BYTES) {
        throw new Error('Storage limit reached. Remove some images first.');
    }
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item = {
        id,
        label: (label || file.name || 'My Image').replace(/\.[^.]+$/, '').slice(0, 30),
        url: dataUrl,
    };
    images.push(item);
    saveImages(images);
    return item;
}

/**
 * Remove a custom image by id.
 * @param {string} id
 */
export function removeCustomImage(id) {
    const images = loadImages().filter((img) => img.id !== id);
    saveImages(images);
}

/**
 * Update label of a custom image.
 * @param {string} id
 * @param {string} label
 */
export function updateCustomImageLabel(id, label) {
    const images = loadImages();
    const idx = images.findIndex((img) => img.id === id);
    if (idx >= 0) {
        images[idx] = { ...images[idx], label: (label || 'My Image').slice(0, 30) };
        saveImages(images);
    }
}

/**
 * Calculate current storage usage for custom images.
 * @returns {{ used: number, max: number, usedMB: string, maxMB: string, percentage: number, remaining: number }}
 */
export function getStorageUsage() {
    const images = getCustomImages();
    const totalBytes = images.reduce((sum, img) => {
        // data URL approximate byte size
        const base64 = img.url?.split(',')[1] || '';
        return sum + Math.ceil(base64.length * 0.75);
    }, 0);

    const MAX_STORAGE = 10 * 1024 * 1024; // 10MB
    return {
        used: totalBytes,
        max: MAX_STORAGE,
        usedMB: (totalBytes / (1024 * 1024)).toFixed(1),
        maxMB: (MAX_STORAGE / (1024 * 1024)).toFixed(0),
        percentage: Math.round((totalBytes / MAX_STORAGE) * 100),
        remaining: MAX_STORAGE - totalBytes,
    };
}

/**
 * Export all custom images as a downloadable JSON file.
 */
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

/**
 * Import custom images from a JSON backup file.
 * @param {File} file
 * @returns {Promise<number>} number of images imported
 */
export function importCustomImages(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const images = JSON.parse(e.target.result);
                if (!Array.isArray(images)) throw new Error('Invalid format');
                // Validate each image has required fields
                const valid = images.filter(img => img.id && img.label && img.url);
                saveImages(valid);
                resolve(valid.length);
            } catch (err) {
                reject(new Error('Invalid image backup file'));
            }
        };
        reader.readAsText(file);
    });
}

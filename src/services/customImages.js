const STORAGE_KEY = 'vwf_custom_images';
const MAX_IMAGES = 24;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per image
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10MB total

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
    const dataUrl = await fileToDataUrl(file);
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

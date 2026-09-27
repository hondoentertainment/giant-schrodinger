/**
 * Same-origin concept stills for round, reveal, and gallery.
 * Plates are deterministic crops of the Grok frames in public/art/source.
 * Solo play needs no API key. Pexels and Giphy stay optional edge upgrades.
 */

export const IMG_WIDTH = 1080;

/** Exact attached frames. JPEG bytes, served from public/art/source. */
export const CONCEPT_ART_SOURCES = [
    'source/sunday-scaries.jpg',
    'source/leftover-sparkler.jpg',
    'source/fusion-scaries-sparkler.jpg',
];

/** Square crops for concept circles. Order is the deterministic catalog. */
export const CONCEPT_PLATES = [
    'plates/sunday-scaries-lamp.jpg',
    'plates/sunday-scaries-window.jpg',
    'plates/sunday-scaries-close.jpg',
    'plates/leftover-sparkler-hand.jpg',
    'plates/leftover-sparkler-flare.jpg',
    'plates/leftover-sparkler-room.jpg',
];

/** Square fusion stills for reveal and gallery cards. */
export const FUSION_PLATES = [
    'plates/fusion-scaries-sparkler.jpg',
    'plates/fusion-scaries-sparkler-wide.jpg',
];

const artCache = new Map();

function hashString(value) {
    let hash = 2166136261;
    const text = String(value || 'venn');
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function artBase() {
    const base = import.meta.env?.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
}

export function conceptArtUrl(file) {
    return `${artBase()}art/${file}`;
}

export function conceptArtSeed(labelOrKeyword, options = {}) {
    const categories = Array.isArray(options.categories) ? options.categories.join('.') : '';
    return [options.role, options.id, labelOrKeyword, categories, options.variant].filter(Boolean).join('|') || 'venn';
}

/** Captions that should show one specific still, not a random plate. */
const NAMED_CONCEPT_PLATES = {
    'sunday scaries': ['plates/sunday-scaries-lamp.jpg', 'plates/sunday-scaries-close.jpg'],
    'a leftover sparkler': ['plates/leftover-sparkler-hand.jpg', 'plates/leftover-sparkler-flare.jpg'],
};

function namedConceptPlates(label) {
    const value = String(label || '').toLowerCase();
    const exact = Object.keys(NAMED_CONCEPT_PLATES).find((key) => value.includes(key));
    if (exact) return NAMED_CONCEPT_PLATES[exact];
    const sunday = /sunday|scaries/.test(value);
    const sparkler = /sparkler/.test(value);
    if (sunday && !sparkler) {
        return [
            'plates/sunday-scaries-lamp.jpg',
            'plates/sunday-scaries-close.jpg',
            'plates/sunday-scaries-window.jpg',
        ];
    }
    if (sparkler && !sunday) {
        return [
            'plates/leftover-sparkler-hand.jpg',
            'plates/leftover-sparkler-flare.jpg',
            'plates/leftover-sparkler-room.jpg',
        ];
    }
    return null;
}

function plateFileForSeed(seed, options = {}) {
    if (options.role === 'fusion') {
        return options.variant ? FUSION_PLATES[1] : FUSION_PLATES[0];
    }
    const named = namedConceptPlates(options.label || seed);
    if (named) return options.variant && named.length > 1 ? named[1] : named[0];
    const plates = CONCEPT_PLATES;
    const hash = hashString(seed);
    let index = hash % plates.length;
    if (options.variant) index = (index + 1) % plates.length;
    return plates[index];
}

/**
 * Where the subject sits inside a square plate.
 * object-cover on a square is a no-op unless the face or sparkler is off center.
 */
export function conceptObjectPosition(url = '') {
    const value = String(url);
    if (value.includes('sunday-scaries-close')) return 'center 38%';
    if (value.includes('sunday-scaries')) return 'center 42%';
    if (value.includes('leftover-sparkler')) return 'center 58%';
    if (value.includes('fusion-scaries-sparkler')) return 'center 46%';
    return 'center';
}

export function buildLocalConceptImage(labelOrKeyword, options = {}) {
    const seed = conceptArtSeed(labelOrKeyword, options);
    const cached = artCache.get(seed);
    if (cached) return cached;
    const url = conceptArtUrl(plateFileForSeed(seed, { ...options, label: options.label || labelOrKeyword }));
    artCache.set(seed, url);
    return url;
}

/** @deprecated Use buildLocalConceptImage. Kept so existing imports stay valid. */
export function buildPicsumFallback(labelOrKeyword, options) {
    return buildLocalConceptImage(labelOrKeyword, options);
}

export function isBrittleImageUrl(url) {
    if (typeof url !== 'string' || !url) return false;
    const value = url.toLowerCase();
    return value.includes('images.unsplash.com')
        || value.includes('source.unsplash.com')
        || value.includes('picsum.photos');
}

export function isPexelsPhotoUrl(url) {
    return typeof url === 'string'
        && url.includes('images.pexels.com')
        && !url.includes('/videos/');
}

export function isBundledConceptArtUrl(url) {
    return typeof url === 'string' && url.includes('/art/');
}

function isSvgPlaceholder(url) {
    return typeof url === 'string' && url.startsWith('data:image/svg+xml');
}

/** Missing, hotlinked, or flat SVG placeholders. Real photos and uploads stay. */
export function isPlaceholderArtUrl(url) {
    return !url || isBrittleImageUrl(url) || isSvgPlaceholder(url);
}

/**
 * Replace missing, hotlinked, or SVG placeholder art with bundled stills.
 * Leaves Pexels, Giphy, user uploads, and same-origin files untouched.
 */
function shouldUseBundledStill(url, options, seed) {
    if (!(isPlaceholderArtUrl(url) || isBundledConceptArtUrl(url))) return false;
    if (options.role === 'fusion') return true;
    return Boolean(namedConceptPlates(options.label || seed));
}

export function reliableImageUrl(url, seed = 'venn', options = {}) {
    if (shouldUseBundledStill(url, options, seed)) {
        return buildLocalConceptImage(options.label || seed, { ...options, label: options.label || seed });
    }
    if (isPlaceholderArtUrl(url)) {
        return buildLocalConceptImage(seed, options);
    }
    return url;
}

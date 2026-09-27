/**
 * Same-origin concept art for round, lobby, and gallery imagery.
 * Unsplash and Picsum hotlinks fail in production (hotlink blocks and rate limits).
 * This generator needs no API key, so solo play still has images.
 * Pexels and Giphy remain optional upgrades through Supabase edge functions.
 */

export const IMG_WIDTH = 1080;

const PALETTES = {
    neon: ['#14061f', '#ff2d95', '#7c3aed', '#22d3ee'],
    urban: ['#0b1020', '#fb7185', '#6366f1', '#fbbf24'],
    nature: ['#042015', '#34d399', '#14532d', '#fde68a'],
    water: ['#041525', '#38bdf8', '#0369a1', '#e0f2fe'],
    ocean: ['#041525', '#22d3ee', '#0e7490', '#cffafe'],
    sunset: ['#3b1020', '#fb7185', '#f59e0b', '#7c2d12'],
    space: ['#020617', '#818cf8', '#c084fc', '#e2e8f0'],
    cosmic: ['#020617', '#a78bfa', '#38bdf8', '#f8fafc'],
    retro: ['#0f172a', '#22d3ee', '#f472b6', '#facc15'],
    technology: ['#020617', '#22d3ee', '#4f46e5', '#e2e8f0'],
    music: ['#2e1065', '#e879f9', '#22d3ee', '#fde047'],
    food: ['#2a0d08', '#fb923c', '#f43f5e', '#fde68a'],
    kitchen: ['#2a0d08', '#fdba74', '#ef4444', '#fef3c7'],
    animal: ['#052e16', '#86efac', '#f97316', '#fef3c7'],
    abstract: ['#1e1b4b', '#a78bfa', '#f472b6', '#38bdf8'],
    art: ['#1c1024', '#f472b6', '#fbbf24', '#38bdf8'],
    emotion: ['#2a0a18', '#fb7185', '#a78bfa', '#fda4af'],
    human: ['#1a1030', '#c4b5fd', '#fb7185', '#fde68a'],
    adventure: ['#1c1408', '#f59e0b', '#22c55e', '#38bdf8'],
    science: ['#041018', '#2dd4bf', '#818cf8', '#e2e8f0'],
    nostalgia: ['#2a1608', '#fdba74', '#f43f5e', '#fef3c7'],
};

const PALETTE_LIST = Object.values(PALETTES);
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

function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pickPalette(categories, text, hash) {
    for (const category of categories || []) {
        if (PALETTES[category]) return PALETTES[category];
    }
    const haystack = String(text || '').toLowerCase();
    for (const [name, colors] of Object.entries(PALETTES)) {
        if (haystack.includes(name)) return colors;
    }
    return PALETTE_LIST[hash % PALETTE_LIST.length];
}

function motifMarkup(motif, rng, bg, a, b, c) {
    if (motif === 0) {
        const x1 = 22 + Math.floor(rng() * 8);
        const y1 = 28 + Math.floor(rng() * 10);
        const r = 18 + Math.floor(rng() * 6);
        return `<circle cx="${x1}" cy="${y1}" r="${r}" fill="${a}" opacity=".9"/><circle cx="${x1 + 22}" cy="${y1 + 6}" r="${r}" fill="${c}" opacity=".78"/>`;
    }
    if (motif === 1) {
        let bars = '';
        let x = 4;
        while (x < 76) {
            const w = 6 + Math.floor(rng() * 7);
            const h = 14 + Math.floor(rng() * 36);
            bars += `<rect x="${x}" y="${74 - h}" width="${w}" height="${h}" fill="${rng() > 0.55 ? c : a}"/>`;
            x += w + 2;
        }
        return `<rect width="80" height="80" fill="${bg}" opacity="0"/>${bars}<rect y="74" width="80" height="6" fill="${b}" opacity=".45"/>`;
    }
    if (motif === 2) {
        const y = 36 + Math.floor(rng() * 12);
        return `<path d="M0 80V${y}Q20 ${y - 22} 40 ${y + 4}T80 ${y - 6}V80Z" fill="${a}"/><path d="M0 80V${y + 14}Q28 ${y + 2} 80 ${y + 16}V80Z" fill="${b}" opacity=".85"/>`;
    }
    if (motif === 3) {
        const y = 38 + Math.floor(rng() * 8);
        const sun = 18 + Math.floor(rng() * 36);
        return `<circle cx="${sun}" cy="22" r="9" fill="${c}"/><path d="M0 ${y}q10-8 20 0t20 0 20 0 20 0V80H0Z" fill="${a}" opacity=".85"/><path d="M0 ${y + 12}q10-8 20 0t20 0 20 0 20 0V80H0Z" fill="${b}"/>`;
    }
    if (motif === 4) {
        const cx = 30 + Math.floor(rng() * 20);
        const cy = 30 + Math.floor(rng() * 10);
        return `<circle cx="${cx}" cy="${cy}" r="18" fill="${b}" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="11" fill="${c}"/><rect y="54" width="80" height="26" fill="${a}"/>`;
    }
    let stars = '';
    for (let index = 0; index < 7; index += 1) {
        const x = 4 + Math.floor(rng() * 72);
        const y = 4 + Math.floor(rng() * 42);
        stars += `<circle cx="${x}" cy="${y}" r="${rng() > 0.7 ? 1.5 : 0.8}" fill="${c}"/>`;
    }
    const px = 46 + Math.floor(rng() * 18);
    const py = 40 + Math.floor(rng() * 10);
    return `${stars}<circle cx="${px}" cy="${py}" r="14" fill="${a}"/><circle cx="${px + 7}" cy="${py - 3}" r="12" fill="${bg}"/>`;
}

export function buildConceptArtSvg(seed, options = {}) {
    const key = String(seed || 'venn');
    const hash = hashString(key);
    const rng = mulberry32(hash);
    const palette = pickPalette(options.categories, `${options.label || ''} ${key}`, hash);
    const [bg, a, b, c] = palette;
    const motif = Math.floor(rng() * 6);
    const shapes = motifMarkup(motif, rng, bg, a, b, c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/>${shapes}</svg>`;
}

function svgToDataUrl(svg) {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function conceptArtSeed(labelOrKeyword, options = {}) {
    const categories = Array.isArray(options.categories) ? options.categories.join('.') : '';
    return [options.id, labelOrKeyword, categories, options.variant].filter(Boolean).join('|') || 'venn';
}

export function buildLocalConceptImage(labelOrKeyword, options = {}) {
    const seed = conceptArtSeed(labelOrKeyword, options);
    const cached = artCache.get(seed);
    if (cached) return cached;
    const url = svgToDataUrl(buildConceptArtSvg(seed, {
        label: labelOrKeyword,
        categories: options.categories,
    }));
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

/**
 * Replace missing or hotlinked concept art with bundled art.
 * Leaves Pexels, Giphy, data URLs, and same-origin files untouched.
 */
export function reliableImageUrl(url, seed = 'venn', options = {}) {
    if (!url || isBrittleImageUrl(url)) {
        return buildLocalConceptImage(seed, options);
    }
    return url;
}

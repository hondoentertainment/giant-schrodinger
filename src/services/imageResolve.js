import { isBackendEnabled } from '../lib/supabase';
import {
    buildLocalConceptImage,
    isBrittleImageUrl,
    isPexelsPhotoUrl,
} from '../lib/conceptArt';

const RESOLVE_IMAGE_URL = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-image`
    : null;

const CACHE_KEY = 'vwf_image_resolve_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESOLVE_TIMEOUT_MS = 4000;

function normalizeQuery(query) {
    return String(query || '').trim().toLowerCase();
}

function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function saveCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Storage full — skip silently
    }
}

function localImage(query, options = {}) {
    const url = buildLocalConceptImage(query, options);
    return {
        url,
        fallbackUrl: url,
        source: 'local',
        photographer: null,
    };
}

/**
 * Accept a Pexels photo. Anything else, including Picsum and Unsplash, becomes bundled art.
 */
export function normalizeResolvedImage(query, data, options = {}) {
    if (data?.source === 'pexels' && isPexelsPhotoUrl(data.url)) {
        return {
            url: data.url,
            fallbackUrl: buildLocalConceptImage(query, options),
            source: 'pexels',
            photographer: data.photographer || null,
        };
    }
    if (data?.url && !isBrittleImageUrl(data.url) && data.source !== 'picsum' && data.source !== 'local') {
        return {
            url: data.url,
            fallbackUrl: isBrittleImageUrl(data.fallbackUrl) ? buildLocalConceptImage(query, options) : (data.fallbackUrl || buildLocalConceptImage(query, options)),
            source: data.source || 'cache',
            photographer: data.photographer || null,
        };
    }
    return localImage(query, options);
}

function readCachedEntry(query) {
    const key = normalizeQuery(query);
    if (!key) return null;

    const cache = loadCache();
    const entry = cache[key];
    if (!entry || !entry.url) return null;
    if (Date.now() - (entry.timestamp || 0) > CACHE_TTL_MS) return null;
    if (isBrittleImageUrl(entry.url) || entry.source === 'picsum') return null;

    return normalizeResolvedImage(query, entry);
}

function writeCachedEntry(query, payload) {
    const key = normalizeQuery(query);
    if (!key || !payload?.url || isBrittleImageUrl(payload.url)) return;
    if (payload.source !== 'pexels' && !isPexelsPhotoUrl(payload.url)) return;

    const cache = loadCache();
    cache[key] = {
        ...payload,
        timestamp: Date.now(),
    };
    saveCache(cache);
}

export function getCachedImageUrl(query) {
    return readCachedEntry(query);
}

export function isPicsumUrl(url) {
    return typeof url === 'string' && url.includes('picsum.photos');
}

function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }
    return undefined;
}

async function postResolve(body) {
    return fetch(RESOLVE_IMAGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
        signal: timeoutSignal(RESOLVE_TIMEOUT_MS),
    });
}

async function fetchResolvedImage(query, orientation = 'squarish') {
    if (!RESOLVE_IMAGE_URL || !isBackendEnabled()) {
        return localImage(query);
    }

    let response;
    try {
        response = await postResolve({ query, orientation });
    } catch {
        return localImage(query);
    }

    if (!response.ok) {
        return localImage(query);
    }

    try {
        const data = await response.json();
        return normalizeResolvedImage(query, data);
    } catch {
        return localImage(query);
    }
}

export async function resolveImageUrl(query, options = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return localImage('placeholder');

    const cached = readCachedEntry(trimmed);
    if (cached) return cached;

    const resolved = await fetchResolvedImage(trimmed, options.orientation);
    writeCachedEntry(trimmed, resolved);
    return resolved;
}

export async function resolveImageUrls(queries, options = {}) {
    const unique = [...new Set(queries.map((q) => String(q || '').trim()).filter(Boolean))];
    const results = {};

    const pending = [];
    for (const query of unique) {
        const cached = readCachedEntry(query);
        if (cached) {
            results[query] = cached;
        } else {
            pending.push(query);
        }
    }

    if (pending.length === 0) return results;

    if (RESOLVE_IMAGE_URL && isBackendEnabled() && pending.length > 1) {
        try {
            const response = await postResolve({
                queries: pending,
                orientation: options.orientation || 'squarish',
            });

            if (response.ok) {
                const data = await response.json();
                for (const query of pending) {
                    const entry = normalizeResolvedImage(query, data?.results?.[query]);
                    writeCachedEntry(query, entry);
                    results[query] = entry;
                }
                return results;
            }
        } catch {
            // Fall through to per-query resolution
        }
    }

    await Promise.all(pending.map(async (query) => {
        results[query] = await resolveImageUrl(query, options);
    }));

    return results;
}

function stillNeedsRemoteUpgrade(asset) {
    if (!asset?.label) return false;
    if (asset.type === 'meme' || asset.type === 'video' || asset.type === 'audio') return false;
    if (asset.imageSource === 'pexels' || isPexelsPhotoUrl(asset.url)) return false;
    return asset.imageSource === 'local' || isBrittleImageUrl(asset.url) || isPicsumUrl(asset.url) || !asset.url;
}

function rewriteBrittleAsset(asset) {
    if (!asset) return asset;
    const local = buildLocalConceptImage(asset.label || asset.id || 'concept', {
        id: asset.id,
        categories: asset.categories,
    });
    const next = { ...asset };
    if (!next.url || isBrittleImageUrl(next.url)) {
        next.url = local;
        next.imageSource = 'local';
    }
    if (!next.fallbackUrl || isBrittleImageUrl(next.fallbackUrl)) {
        next.fallbackUrl = next.url.startsWith('data:') ? next.url : local;
    }
    return next;
}

export async function resolveAssetsImages(assets) {
    if (!Array.isArray(assets) || assets.length === 0) return assets;

    const upgradeLabels = assets
        .filter((asset) => stillNeedsRemoteUpgrade(asset))
        .map((asset) => asset.label);

    const canUpgrade = Boolean(RESOLVE_IMAGE_URL && isBackendEnabled() && upgradeLabels.length > 0);
    const resolved = canUpgrade ? await resolveImageUrls(upgradeLabels) : null;

    return assets.map((asset) => {
        const rewritten = rewriteBrittleAsset(asset);
        if (!canUpgrade || !asset?.label || asset.type === 'meme') return rewritten;
        const match = resolved?.[asset.label];
        if (!match || match.source !== 'pexels' || !isPexelsPhotoUrl(match.url)) return rewritten;
        return {
            ...rewritten,
            url: match.url,
            fallbackUrl: rewritten.url || match.fallbackUrl,
            imageSource: 'pexels',
            photographer: match.photographer || null,
        };
    });
}

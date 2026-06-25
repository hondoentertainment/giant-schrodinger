import { isBackendEnabled } from '../lib/supabase';
import { buildPicsumFallback } from '../lib/imageUrls';

const RESOLVE_IMAGE_URL = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-image`
    : null;

const CACHE_KEY = 'vwf_image_resolve_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function readCachedEntry(query) {
    const key = normalizeQuery(query);
    if (!key) return null;

    const cache = loadCache();
    const entry = cache[key];
    if (!entry || !entry.url) return null;
    if (Date.now() - (entry.timestamp || 0) > CACHE_TTL_MS) return null;

    return {
        url: entry.url,
        fallbackUrl: entry.fallbackUrl || buildPicsumFallback(query),
        source: entry.source || 'cache',
        photographer: entry.photographer || null,
    };
}

function writeCachedEntry(query, payload) {
    const key = normalizeQuery(query);
    if (!key || !payload?.url) return;

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

function buildLocalFallback(query) {
    const fallbackUrl = buildPicsumFallback(query);
    return {
        url: fallbackUrl,
        fallbackUrl,
        source: 'picsum',
        photographer: null,
    };
}

async function fetchResolvedImage(query, orientation = 'squarish') {
    if (!RESOLVE_IMAGE_URL || !isBackendEnabled()) {
        return buildLocalFallback(query);
    }

    let response;
    try {
        response = await fetch(RESOLVE_IMAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ query, orientation }),
        });
    } catch {
        return buildLocalFallback(query);
    }

    if (!response.ok) {
        return buildLocalFallback(query);
    }

    try {
        const data = await response.json();
        if (!data?.url) return buildLocalFallback(query);
        return {
            url: data.url,
            fallbackUrl: data.fallbackUrl || buildPicsumFallback(query),
            source: data.source || 'pexels',
            photographer: data.photographer || null,
        };
    } catch {
        return buildLocalFallback(query);
    }
}

export async function resolveImageUrl(query, options = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return buildLocalFallback('placeholder');

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
            const response = await fetch(RESOLVE_IMAGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ queries: pending, orientation: options.orientation || 'squarish' }),
            });

            if (response.ok) {
                const data = await response.json();
                for (const query of pending) {
                    const entry = data?.results?.[query] || buildLocalFallback(query);
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

export async function resolveAssetsImages(assets) {
    if (!Array.isArray(assets) || assets.length === 0) return assets;

    const labels = assets
        .filter((asset) => asset?.label && (isPicsumUrl(asset.url) || !asset.url))
        .map((asset) => asset.label);

    if (labels.length === 0) return assets;

    const resolved = await resolveImageUrls(labels);

    return assets.map((asset) => {
        if (!asset?.label) return asset;
        const match = resolved[asset.label];
        if (!match) return asset;

        return {
            ...asset,
            url: match.url || asset.url,
            fallbackUrl: match.fallbackUrl || asset.fallbackUrl || buildPicsumFallback(asset.label),
            imageSource: match.source,
        };
    });
}

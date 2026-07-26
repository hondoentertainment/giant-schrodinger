import { isBackendEnabled } from '../lib/supabase';
import { MEDIA_TYPES } from '../data/themes';

const RESOLVE_MEME_URL = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-meme`
    : null;

const CACHE_KEY = 'vwf_meme_resolve_cache';
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
    if (entry.source === 'static') return null;

    return {
        url: entry.url,
        fallbackUrl: entry.fallbackUrl || null,
        source: entry.source || 'cache',
        attribution: entry.attribution || null,
        title: entry.title || null,
    };
}

function writeCachedEntry(query, payload) {
    const key = normalizeQuery(query);
    if (!key || !payload?.url || payload.source === 'static') return;

    const cache = loadCache();
    cache[key] = {
        ...payload,
        timestamp: Date.now(),
    };
    saveCache(cache);
}

export function getMemeSearchQuery(asset) {
    if (!asset) return '';
    return String(asset.searchQuery || asset.label || '').trim();
}

export function isGiphyUrl(url) {
    return typeof url === 'string' && (url.includes('giphy.com') || url.includes('giphy.gif'));
}

export function isTenorUrl(url) {
    return typeof url === 'string' && url.includes('tenor.com');
}

export function isResolvedMemeUrl(url) {
    return isGiphyUrl(url) || isTenorUrl(url);
}

export function needsMemeApiResolve(asset) {
    if (asset?.type !== MEDIA_TYPES.MEME) return false;
    if (typeof asset?.url === 'string' && asset.url.startsWith('data:')) return false;
    if (isResolvedMemeUrl(asset?.url)) return false;
    return Boolean(getMemeSearchQuery(asset));
}

export function getCachedMemeUrl(query) {
    return readCachedEntry(query);
}

function buildStaticFallback(query, fallbackUrl) {
    return {
        url: fallbackUrl || null,
        fallbackUrl: fallbackUrl || null,
        source: 'static',
        attribution: null,
        title: query || null,
    };
}

async function fetchResolvedMeme(query, options = {}) {
    const fallbackUrl = options.fallbackUrl || null;

    if (!RESOLVE_MEME_URL || !isBackendEnabled()) {
        return buildStaticFallback(query, fallbackUrl);
    }

    let response;
    try {
        response = await fetch(RESOLVE_MEME_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                query,
                fallbackUrl,
                random: Boolean(options.random),
            }),
        });
    } catch {
        return buildStaticFallback(query, fallbackUrl);
    }

    if (!response.ok) {
        return buildStaticFallback(query, fallbackUrl);
    }

    try {
        const data = await response.json();
        if (!data?.url || data.source === 'static') {
            return buildStaticFallback(query, fallbackUrl);
        }

        return {
            url: data.url,
            fallbackUrl: data.fallbackUrl || fallbackUrl || data.url,
            source: data.source || 'giphy',
            attribution: data.attribution || null,
            title: data.title || query,
        };
    } catch {
        return buildStaticFallback(query, fallbackUrl);
    }
}

export async function resolveMemeUrl(query, options = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return buildStaticFallback('', options.fallbackUrl || null);

    const cached = readCachedEntry(trimmed);
    if (cached) return cached;

    const resolved = await fetchResolvedMeme(trimmed, options);
    if (resolved.source !== 'static') {
        writeCachedEntry(trimmed, resolved);
    }
    return resolved;
}

export async function resolveMemeUrls(entries, options = {}) {
    const normalizedEntries = entries.map((entry) => {
        if (typeof entry === 'string') {
            return { query: entry, fallbackUrl: null };
        }
        return {
            query: String(entry?.query || '').trim(),
            fallbackUrl: entry?.fallbackUrl || null,
        };
    }).filter((entry) => entry.query);

    const results = {};
    const pending = [];

    for (const entry of normalizedEntries) {
        const cached = readCachedEntry(entry.query);
        if (cached) {
            results[entry.query] = cached;
        } else {
            pending.push(entry);
        }
    }

    if (pending.length === 0) return results;

    if (RESOLVE_MEME_URL && isBackendEnabled() && pending.length > 1) {
        try {
            const response = await fetch(RESOLVE_MEME_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    queries: pending.map((entry) => ({
                        query: entry.query,
                        fallbackUrl: entry.fallbackUrl,
                        random: Boolean(options.random),
                    })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                for (const entry of pending) {
                    const match = data?.results?.[entry.query]
                        || buildStaticFallback(entry.query, entry.fallbackUrl);
                    if (match.source !== 'static') {
                        writeCachedEntry(entry.query, match);
                    }
                    results[entry.query] = match;
                }
                return results;
            }
        } catch {
            // Fall through to per-query resolution
        }
    }

    await Promise.all(pending.map(async (entry) => {
        results[entry.query] = await resolveMemeUrl(entry.query, {
            fallbackUrl: entry.fallbackUrl,
            random: options.random,
        });
    }));

    return results;
}

export async function resolveAssetsMemes(assets) {
    if (!Array.isArray(assets) || assets.length === 0) return assets;

    const memeAssets = assets.filter(needsMemeApiResolve);
    if (memeAssets.length === 0) return assets;

    const entries = memeAssets.map((asset) => ({
        query: getMemeSearchQuery(asset),
        fallbackUrl: asset.url || asset.fallbackUrl || null,
    }));

    const resolved = await resolveMemeUrls(entries);

    return assets.map((asset) => {
        if (!needsMemeApiResolve(asset)) return asset;

        const query = getMemeSearchQuery(asset);
        const match = resolved[query];
        if (!match?.url || match.source === 'static') return asset;

        return {
            ...asset,
            url: match.url,
            fallbackUrl: asset.url || asset.fallbackUrl || match.fallbackUrl,
            memeSource: match.source,
            memeAttribution: match.attribution || null,
        };
    });
}

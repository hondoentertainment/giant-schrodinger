import { MEDIA_TYPES } from '../data/themes';
import { getYoutubeThumbnailUrl, getYoutubeVideoIdFromAsset } from './youtube';
import { isGiphyUrl } from '../services/memeResolve';
import { buildLocalConceptImage, isBrittleImageUrl, isPlaceholderArtUrl } from './conceptArt';

const preloadCache = new Map();

/**
 * Tiny blurred placeholder URL for progressive image loading.
 */
export function buildBlurPlaceholderUrl(url, width = 32) {
    if (!url || typeof url !== 'string' || isBrittleImageUrl(url)) return null;

    if (url.includes('images.pexels.com')) {
        const separator = url.includes('?') ? '&' : '?';
        if (url.includes('w=')) {
            return url.replace(/w=\d+/g, `w=${width}`) + `${separator}auto=compress&blur=2`;
        }
        return `${url}${separator}auto=compress&w=${width}&blur=2`;
    }

    if (url.includes('img.youtube.com')) {
        return url.replace(/\/(hqdefault|mqdefault|maxresdefault)\.jpg$/, '/default.jpg');
    }

    return null;
}

/**
 * Lighter Giphy preview (200w) loads faster than full GIF for first paint.
 */
export function getGiphyPreviewUrl(gifUrl) {
    if (!gifUrl || !isGiphyUrl(gifUrl)) return null;
    if (/\/\d+w\.(gif|webp)$/i.test(gifUrl)) return gifUrl;

    if (gifUrl.includes('/media/')) {
        return gifUrl
            .replace(/\/giphy\.gif$/i, '/200w.gif')
            .replace(/\/giphy\.webp$/i, '/200w.webp');
    }

    return null;
}

/**
 * Responsive srcset for Pexels still images.
 */
export function buildResponsiveSrcSet(url) {
    if (!url || isBrittleImageUrl(url)) return undefined;

    if (url.includes('images.pexels.com') && !url.includes('/videos/')) {
        const base = url.split('?')[0];
        return [400, 640, 1080].map((w) =>
            `${base}?auto=compress&cs=tinysrgb&w=${w}&h=${w}&fit=crop ${w}w`
        ).join(', ');
    }

    return undefined;
}

function replaceBrittleMedia(asset) {
    const enriched = { ...asset };
    const local = buildLocalConceptImage(asset.label || asset.id || 'concept', {
        id: asset.id,
        categories: asset.categories,
    });

    if (!enriched.url || isPlaceholderArtUrl(enriched.url)) {
        if (enriched.type !== MEDIA_TYPES.VIDEO && enriched.type !== MEDIA_TYPES.AUDIO) {
            enriched.url = local;
            enriched.imageSource = enriched.imageSource === 'pexels' ? 'pexels' : 'local';
        }
    }
    if (enriched.type !== MEDIA_TYPES.VIDEO && enriched.type !== MEDIA_TYPES.AUDIO) {
        if (!enriched.fallbackUrl || isPlaceholderArtUrl(enriched.fallbackUrl)) {
            enriched.fallbackUrl = enriched.url?.startsWith('data:') && !isPlaceholderArtUrl(enriched.url)
                ? enriched.url
                : local;
        }
    }
    if (enriched.coverUrl && isPlaceholderArtUrl(enriched.coverUrl)) enriched.coverUrl = local;
    if (enriched.coverFallbackUrl && isPlaceholderArtUrl(enriched.coverFallbackUrl)) {
        enriched.coverFallbackUrl = enriched.coverUrl || local;
    }
    if (enriched.posterUrl && isPlaceholderArtUrl(enriched.posterUrl)) enriched.posterUrl = local;
    return enriched;
}

export function enrichAssetForDisplay(asset) {
    if (!asset) return asset;

    const enriched = replaceBrittleMedia(asset);
    const youtubeId = getYoutubeVideoIdFromAsset(asset);

    if (youtubeId && !enriched.posterUrl) {
        enriched.posterUrl = getYoutubeThumbnailUrl(youtubeId);
    }

    if (enriched.type === MEDIA_TYPES.MEME) {
        const preview = getGiphyPreviewUrl(enriched.url);
        if (preview) enriched.previewUrl = preview;
    }

    const primary = enriched.url || enriched.fallbackUrl;
    enriched.blurUrl = buildBlurPlaceholderUrl(primary)
        || buildBlurPlaceholderUrl(enriched.posterUrl);

    return enriched;
}

export function preloadImageUrl(url, { priority = false } = {}) {
    if (!url || url.startsWith('data:') || isBrittleImageUrl(url)) return Promise.resolve('skipped');
    if (import.meta.env?.MODE === 'test') return Promise.resolve('skipped');

    const cached = preloadCache.get(url);
    if (cached) return cached;

    const promise = new Promise((resolve) => {
        if (typeof Image === 'undefined') {
            resolve('skipped');
            return;
        }

        const img = new Image();
        if (priority && 'fetchPriority' in img) {
            img.fetchPriority = 'high';
        }
        img.referrerPolicy = 'no-referrer';
        img.onload = () => resolve('loaded');
        img.onerror = () => resolve('error');
        img.src = url;
    });

    preloadCache.set(url, promise);
    return promise;
}

export async function preloadMediaAsset(asset, { priority = false } = {}) {
    if (!asset) return;

    const urls = [];

    if (asset.blurUrl) urls.push(asset.blurUrl);
    if (asset.posterUrl) urls.push(asset.posterUrl);
    if (asset.previewUrl) urls.push(asset.previewUrl);

    const youtubeId = getYoutubeVideoIdFromAsset(asset);
    if (youtubeId) {
        urls.push(getYoutubeThumbnailUrl(youtubeId, 'mqdefault'));
    }

    if (asset.type === MEDIA_TYPES.VIDEO && !youtubeId && asset.url) {
        urls.push(asset.posterUrl || asset.url);
    } else if (asset.type === MEDIA_TYPES.MEME) {
        if (asset.previewUrl) urls.push(asset.previewUrl);
        if (asset.url) urls.push(asset.url);
        if (asset.fallbackUrl && asset.fallbackUrl !== asset.url) urls.push(asset.fallbackUrl);
    } else if (asset.type !== MEDIA_TYPES.AUDIO && asset.url) {
        urls.push(asset.url);
        if (asset.fallbackUrl && asset.fallbackUrl !== asset.url) {
            urls.push(asset.fallbackUrl);
        }
    }

    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.all(unique.map((url) => preloadImageUrl(url, { priority })));
}

export async function preloadRoundAssetsAsync(assets, options = {}) {
    if (!Array.isArray(assets) || assets.length === 0) return;

    const enriched = assets.map(enrichAssetForDisplay);
    await Promise.all(enriched.map((asset) => preloadMediaAsset(asset, options)));
}

export function clearMediaPreloadCache() {
    preloadCache.clear();
}

export function _resetMediaPreloadCacheForTests() {
    preloadCache.clear();
}

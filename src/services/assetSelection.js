import { buildThemeAssets, MEDIA_TYPES } from '../data/themes';
import { normalizeMediaType } from '../lib/mediaType';
import {
    enrichAssetForDisplay,
    preloadMediaAsset,
    preloadRoundAssetsAsync,
} from '../lib/mediaLoad';
import { getCustomImages } from './customImages';
import { resolveAssetsImages, isPicsumUrl } from './imageResolve';
import { resolveAssetsMemes, needsMemeApiResolve } from './memeResolve';

const RECENT_ASSETS_KEY = 'venn_recent_assets';
const MAX_RECENT_ASSETS = 24;

export function getAssetKey(asset) {
    if (!asset) return '';
    return asset.id || `${asset.label || 'asset'}::${asset.url || ''}`;
}

function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function shuffle(array, rng) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function toRoundAsset(item) {
    const type = item.type === 'video'
        ? MEDIA_TYPES.VIDEO
        : item.type === 'meme'
            ? MEDIA_TYPES.MEME
            : MEDIA_TYPES.IMAGE;

    return {
        id: item.id,
        label: item.label,
        type,
        url: item.url,
        fallbackUrl: item.url,
        posterUrl: item.posterUrl || '',
        provider: item.provider,
        youtubeId: item.youtubeId,
    };
}

export function getRecentAssetKeys() {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENT_ASSETS_KEY));
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

export function trackRecentAssets(assets) {
    const keys = assets.map(getAssetKey).filter(Boolean);
    if (!keys.length) return;

    const recent = getRecentAssetKeys().filter((key) => !keys.includes(key));
    const merged = [...keys, ...recent].slice(0, MAX_RECENT_ASSETS);

    try {
        localStorage.setItem(RECENT_ASSETS_KEY, JSON.stringify(merged));
    } catch {
        // Storage full or unavailable — skip silently
    }
}

function selectCustomPair(customPool, excludeKeys, seed) {
    const rng = seededRandom(seed);
    let available = customPool.filter((img) => !excludeKeys.has(getAssetKey({ id: img.id, url: img.url })));
    if (available.length < 2) available = [...customPool];

    const shuffled = shuffle(available, rng);
    const left = shuffled[0];
    const right = shuffled.find((img) => img.id !== left.id) || shuffled[1];

    return [left, right].map(toRoundAsset);
}

function selectCustomMemesVideosPair(customPool, excludeKeys, seed) {
    const memes = customPool.filter((item) => item.type === 'meme' || item.type === 'image' || !item.type);
    const videos = customPool.filter((item) => item.type === 'video');

    if (memes.length >= 1 && videos.length >= 1) {
        const rng = seededRandom(seed);
        const leftIsVideo = rng() > 0.5;
        const rightIsVideo = rng() > 0.5;

        const pickFrom = (list) => {
            let available = list.filter((item) => !excludeKeys.has(getAssetKey(item)));
            if (available.length === 0) available = list;
            return shuffle(available, rng)[0];
        };

        const leftItem = pickFrom(leftIsVideo ? videos : memes);
        const rightPool = (rightIsVideo ? videos : memes).filter((item) => item.id !== leftItem.id);
        const rightItem = pickFrom(rightPool.length > 0 ? rightPool : (rightIsVideo ? videos : memes));

        return [toRoundAsset(leftItem), toRoundAsset(rightItem)];
    }

    return selectCustomPair(customPool, excludeKeys, seed);
}

function selectCustomVideosPair(customPool, excludeKeys, seed) {
    const videos = customPool.filter((item) => item.type === 'video');
    return selectCustomPair(videos.length >= 2 ? videos : customPool, excludeKeys, seed);
}

function canUseCustomPool(mediaType, useCustomImages, pool) {
    if (!useCustomImages || !pool?.length) return false;
    if (mediaType === MEDIA_TYPES.IMAGE) {
        return pool.filter((item) => item.type !== 'video').length >= 2;
    }
    if (mediaType === MEDIA_TYPES.VIDEO) {
        return pool.filter((item) => item.type === 'video').length >= 2;
    }
    if (mediaType === MEDIA_TYPES.MEMES_VIDEOS) {
        const memes = pool.filter((item) => item.type === 'meme' || item.type === 'image' || !item.type);
        const videos = pool.filter((item) => item.type === 'video');
        return (memes.length >= 1 && videos.length >= 1) || pool.length >= 2;
    }
    return false;
}

/**
 * Pick two round assets with session dedup, recent-history avoidance, and diverse pairing.
 */
export function selectRoundAssets({
    theme,
    mediaType = MEDIA_TYPES.IMAGE,
    excludeIds = [],
    seed,
    roundNumber = 1,
    useCustomImages = false,
    customPool,
    isDailyChallenge = false,
}) {
    const resolvedMediaType = normalizeMediaType(mediaType);
    const recentKeys = getRecentAssetKeys();
    const excludeSet = new Set([...excludeIds, ...recentKeys].filter(Boolean));

    const selectionSeed = isDailyChallenge && seed != null
        ? seed + roundNumber * 9973
        : seed ?? Date.now() + roundNumber * 7919;

    const pool = customPool ?? (useCustomImages ? getCustomImages() : null);

    let picked;
    if (canUseCustomPool(resolvedMediaType, useCustomImages, pool)) {
        if (resolvedMediaType === MEDIA_TYPES.MEMES_VIDEOS) {
            picked = selectCustomMemesVideosPair(pool, excludeSet, selectionSeed);
        } else if (resolvedMediaType === MEDIA_TYPES.VIDEO) {
            picked = selectCustomVideosPair(pool, excludeSet, selectionSeed);
        } else {
            picked = selectCustomPair(pool, excludeSet, selectionSeed);
        }
    } else {
        picked = buildThemeAssets(theme, 2, resolvedMediaType, {
            excludeIds: [...excludeSet],
            seed: selectionSeed,
            preferDiverse: resolvedMediaType === MEDIA_TYPES.IMAGE,
        });
    }

    trackRecentAssets(picked);
    return picked;
}

function mergeResolvedAsset(original, imageResult, memeResult) {
    const imageAsset = imageResult || original;
    const memeAsset = memeResult || original;

    return enrichAssetForDisplay({
        ...original,
        url: memeAsset.url !== original.url ? memeAsset.url : (imageAsset.url || original.url),
        fallbackUrl: imageAsset.fallbackUrl || memeAsset.fallbackUrl || original.fallbackUrl,
        imageSource: imageAsset.imageSource || original.imageSource,
        memeSource: memeAsset.memeSource || original.memeSource,
        memeAttribution: memeAsset.memeAttribution || original.memeAttribution,
    });
}

export async function resolveSelectedAssets(assets) {
    if (!Array.isArray(assets) || assets.length === 0) return assets;

    const needsImageResolve = assets.some((asset) => asset?.label && isPicsumUrl(asset?.url));
    const needsMemeResolve = assets.some(needsMemeApiResolve);

    if (!needsImageResolve && !needsMemeResolve) {
        return assets.map(enrichAssetForDisplay);
    }

    const imageCopy = assets.map((asset) => ({ ...asset }));
    const memeCopy = assets.map((asset) => ({ ...asset }));

    const [imageResolved, memeResolved] = await Promise.all([
        needsImageResolve ? resolveAssetsImages(imageCopy) : Promise.resolve(null),
        needsMemeResolve ? resolveAssetsMemes(memeCopy) : Promise.resolve(null),
    ]);

    return assets.map((asset, index) => mergeResolvedAsset(
        asset,
        imageResolved?.[index],
        memeResolved?.[index],
    ));
}

/**
 * Select, resolve API-backed media, and warm the browser cache.
 */
export async function loadRoundAssets(options) {
    const selected = selectRoundAssets(options);
    return loadSelectedAssets(selected);
}

/**
 * Resolve and preload a pre-selected asset pair (avoids re-selection).
 */
export async function loadSelectedAssets(selected) {
    if (!Array.isArray(selected) || selected.length === 0) return selected;

    preloadRoundAssets(selected);
    const resolved = await resolveSelectedAssets(selected);
    await preloadRoundAssetsAsync(resolved, { priority: true });
    return resolved;
}

export function preloadRoundAssets(assets) {
    if (!Array.isArray(assets)) return;

    assets.forEach((asset) => {
        preloadMediaAsset(enrichAssetForDisplay(asset), { priority: true }).catch(() => {});
    });
}

export { preloadRoundAssetsAsync };

export function getAssetMediaLabel(type) {
    if (type === MEDIA_TYPES.VIDEO) return 'Video';
    if (type === MEDIA_TYPES.MEME) return 'Meme';
    if (type === MEDIA_TYPES.AUDIO) return 'Audio';
    return 'Concept';
}

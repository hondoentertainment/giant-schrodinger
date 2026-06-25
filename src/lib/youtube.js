const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

const URL_PATTERNS = [
    /(?:youtube\.com\/watch\?(?:[^&]+&)*v=)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
];

/**
 * Extract a YouTube video ID from a URL or bare ID string.
 * @param {string} input
 * @returns {string|null}
 */
export function parseYoutubeVideoId(input) {
    const trimmed = String(input || '').trim();
    if (!trimmed) return null;

    if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1).split('/')[0];
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        const fromQuery = parsed.searchParams.get('v');
        if (fromQuery && YOUTUBE_ID_PATTERN.test(fromQuery)) return fromQuery;

        for (const pattern of URL_PATTERNS) {
            const match = trimmed.match(pattern);
            if (match?.[1] && YOUTUBE_ID_PATTERN.test(match[1])) return match[1];
        }
    }

    return null;
}

export function isYoutubeUrl(input) {
    return parseYoutubeVideoId(input) != null;
}

export function getYoutubeWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYoutubeThumbnailUrl(videoId, quality = 'hqdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Privacy-enhanced embed URL for in-app playback.
 * @param {string} videoId
 * @param {{ autoplay?: boolean, mute?: boolean, loop?: boolean, origin?: string }} [options]
 */
export function getYoutubeEmbedUrl(videoId, options = {}) {
    const {
        autoplay = true,
        mute = true,
        loop = true,
        origin = typeof window !== 'undefined' ? window.location.origin : '',
    } = options;

    const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: mute ? '1' : '0',
        controls: '0',
        modestbranding: '1',
        rel: '0',
        playsinline: '1',
        enablejsapi: '1',
        iv_load_policy: '3',
    });

    if (loop) {
        params.set('loop', '1');
        params.set('playlist', videoId);
    }

    if (origin) params.set('origin', origin);

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function getYoutubeVideoIdFromAsset(asset) {
    if (asset?.youtubeId && YOUTUBE_ID_PATTERN.test(asset.youtubeId)) {
        return asset.youtubeId;
    }
    if (asset?.provider === 'youtube' && asset?.url) {
        return parseYoutubeVideoId(asset.url);
    }
    if (asset?.url) {
        return parseYoutubeVideoId(asset.url);
    }
    return null;
}

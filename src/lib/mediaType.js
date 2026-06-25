import { MEDIA_TYPES } from '../data/themes';

export function normalizeMediaType(mediaType) {
    if (mediaType === 'mixed') return MEDIA_TYPES.MEMES_VIDEOS;
    return mediaType || MEDIA_TYPES.IMAGE;
}

export function getEffectiveRoundMediaType({ userMediaType, isDailyChallenge, dailyChallenge }) {
    if (isDailyChallenge && dailyChallenge?.mediaType) {
        return dailyChallenge.mediaType;
    }
    return normalizeMediaType(userMediaType);
}

export function formatAssetForShare(asset) {
    const name = asset?.label || asset?.title || asset?.name || 'Unknown';
    const type = asset?.type;
    if (type === MEDIA_TYPES.MEME || type === 'meme') return `${name} (Meme)`;
    if (type === MEDIA_TYPES.VIDEO || type === 'video') return `${name} (Video)`;
    if (type === MEDIA_TYPES.AUDIO || type === 'audio') return `${name} (Audio)`;
    return name;
}

export function getCollisionMediaMode(collision) {
    if (collision?.mediaType) return normalizeMediaType(collision.mediaType);

    const left = collision?.assets?.left?.type;
    const right = collision?.assets?.right?.type;

    if (left === MEDIA_TYPES.MEME || right === MEDIA_TYPES.MEME || left === 'meme' || right === 'meme') {
        return MEDIA_TYPES.MEMES_VIDEOS;
    }
    if (left === MEDIA_TYPES.VIDEO && right === MEDIA_TYPES.VIDEO) return MEDIA_TYPES.VIDEO;
    if (left === MEDIA_TYPES.AUDIO && right === MEDIA_TYPES.AUDIO) return MEDIA_TYPES.AUDIO;
    if (left === MEDIA_TYPES.VIDEO || right === MEDIA_TYPES.VIDEO) return MEDIA_TYPES.MEMES_VIDEOS;
    return MEDIA_TYPES.IMAGE;
}

export function getMediaModeLabel(mode) {
    const normalized = normalizeMediaType(mode);
    switch (normalized) {
        case MEDIA_TYPES.VIDEO:
            return 'Videos';
        case MEDIA_TYPES.AUDIO:
            return 'Audio';
        case MEDIA_TYPES.MEMES_VIDEOS:
            return 'Memes & Videos';
        default:
            return 'Images';
    }
}

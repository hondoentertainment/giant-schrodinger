export const CANONICAL_ORIGIN = 'https://giant-schrodinger.vercel.app';
export const OG_IMAGE_PATH = '/og-image.png';

export function getLocationHost(location = typeof window !== 'undefined' ? window.location : null) {
    if (!location) return '';
    if (location.hostname) return location.hostname;
    try {
        return new URL(location.origin || location.href).hostname;
    } catch {
        return '';
    }
}

export function isLegacyPublicHost(hostname) {
    return /github\.io$/i.test(hostname || '');
}

export function getCanonicalUrl() {
    return `${CANONICAL_ORIGIN}/`;
}

export function getOgImageUrl(origin = CANONICAL_ORIGIN) {
    return `${String(origin).replace(/\/$/, '')}${OG_IMAGE_PATH}`;
}

export function getShareAppBase(location = typeof window !== 'undefined' ? window.location : null) {
    if (isLegacyPublicHost(getLocationHost(location))) {
        return getCanonicalUrl();
    }
    if (location?.origin) {
        return `${location.origin}${location.pathname || '/'}`;
    }
    return getCanonicalUrl();
}

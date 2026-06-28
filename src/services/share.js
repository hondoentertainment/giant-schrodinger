const SHARE_HASH_PREFIX = 'judge=';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{20,120}$/;

export async function createJudgeShareUrl(round) {
    const baseUrl = window.location.origin + window.location.pathname;

    if (round?.backendId) {
        return `${baseUrl}?judge=${round.backendId}`;
    }

    // Try server persistence first
    try {
        const { saveSharedRound } = await import('./backend.js');
        const { isBackendEnabled } = await import('../lib/supabase.js');
        if (isBackendEnabled()) {
            const saved = await saveSharedRound(round);
            if (saved) {
                const id = typeof saved === 'string' ? saved : saved.id;
                if (id) {
                    return `${baseUrl}?judge=${id}`;
                }
            }
        }
    } catch {
        // Backend unavailable, fall through to hash encoding
    }

    // Fallback to hash encoding
    try {
        const payload = btoa(unescape(encodeURIComponent(JSON.stringify(round))));
        return `${baseUrl}#judge_${payload}`;
    } catch {
        return null;
    }
}

export async function resolveShareLink(url) {
    const parsed = typeof url === 'string' ? new URL(url) : null;
    const search = parsed ? parsed.search : (window.location.search || '');
    const hash = parsed ? parsed.hash : (window.location.hash || '');

    // Check for ?judge=UUID/token param first -> fetch from backend
    const params = new URLSearchParams(search);
    const judgeParam = params.get('judge');
    if (judgeParam && (UUID_REGEX.test(judgeParam.trim()) || SHARE_TOKEN_REGEX.test(judgeParam.trim()))) {
        try {
            const { getSharedRound } = await import('./backend.js');
            const round = await getSharedRound(judgeParam.trim());
            if (round) return round;
        } catch {
            // Backend unavailable, fall through
        }
    }

    // Fallback to hash decode (both legacy judge= and new judge_ prefix)
    let encoded = null;
    if (hash.startsWith('#') && hash.includes(SHARE_HASH_PREFIX)) {
        encoded = hash.slice(hash.indexOf(SHARE_HASH_PREFIX) + SHARE_HASH_PREFIX.length);
    }
    if (!encoded && hash.startsWith('#judge_')) {
        encoded = hash.slice('#judge_'.length);
    }

    if (!encoded) return null;

    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function parseJudgeShareUrl() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    let encoded = null;
    let fromQuery = false;

    if (hash.startsWith('#') && hash.includes(SHARE_HASH_PREFIX)) {
        encoded = hash.slice(hash.indexOf(SHARE_HASH_PREFIX) + SHARE_HASH_PREFIX.length);
    } else if (hash.startsWith('#judge_')) {
        encoded = hash.slice('#judge_'.length);
    } else {
        const params = new URLSearchParams(search);
        encoded = params.get('judge');
        fromQuery = true;
    }

    if (!encoded) return null;

    const trimmed = encoded.trim();

    if (fromQuery && (UUID_REGEX.test(trimmed) || SHARE_TOKEN_REGEX.test(trimmed))) {
        return { backendId: trimmed };
    }

    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function clearJudgeFromUrl() {
    if (window.history.replaceState) {
        const clean = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', clean);
    }
}

/**
 * Build an OG-preview URL for social sharing when the og-tags edge function is deployed.
 * Falls back to the direct judge link when no function base is configured.
 */
export function extractShareTokenFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const parsed = new URL(url, 'https://example.com');
        const fromQuery = parsed.searchParams.get('judge');
        if (fromQuery) return fromQuery.trim();
        const hash = parsed.hash || '';
        if (hash.startsWith('#judge_')) return null;
    } catch {
        return null;
    }
    return null;
}

/**
 * Returns playable share URL plus OG-preview URL when backend token is available.
 */
export async function createJudgeShareLinks(round) {
    const shareUrl = await createJudgeShareUrl(round);
    if (!shareUrl) return null;
    const token = extractShareTokenFromUrl(shareUrl);
    return {
        shareUrl,
        previewUrl: token ? getOgShareUrl(token) : shareUrl,
    };
}

export function getOgShareUrl(publicToken, options = {}) {
    const { supabaseUrl } = options;
    const base = supabaseUrl || import.meta.env?.VITE_SUPABASE_URL || '';
    if (base && publicToken) {
        const fnBase = `${base.replace(/\/$/, '')}/functions/v1/og-tags`;
        return `${fnBase}?roundId=${encodeURIComponent(publicToken)}`;
    }
    const appBase = window.location.origin + window.location.pathname;
    return `${appBase}?judge=${encodeURIComponent(publicToken || '')}`;
}

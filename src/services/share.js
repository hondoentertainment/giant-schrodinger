const SHARE_HASH_PREFIX = 'judge=';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createJudgeShareUrl(round) {
    const baseUrl = window.location.origin + window.location.pathname;

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

    // Check for ?judge=UUID param first -> fetch from backend
    const params = new URLSearchParams(search);
    const judgeParam = params.get('judge');
    if (judgeParam && UUID_REGEX.test(judgeParam.trim())) {
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

    if (hash.startsWith('#') && hash.includes(SHARE_HASH_PREFIX)) {
        encoded = hash.slice(hash.indexOf(SHARE_HASH_PREFIX) + SHARE_HASH_PREFIX.length);
    } else if (hash.startsWith('#judge_')) {
        encoded = hash.slice('#judge_'.length);
    } else {
        const params = new URLSearchParams(search);
        encoded = params.get('judge');
    }

    if (!encoded) return null;

    if (UUID_REGEX.test(encoded.trim())) {
        return { backendId: encoded.trim() };
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

const SHARE_HASH_PREFIX = 'judge=';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createJudgeShareUrl(payload) {
    try {
        const base = window.location.origin + window.location.pathname;
        if (payload.backendId) {
            return `${base}?judge=${payload.backendId}`;
        }
        const json = JSON.stringify(payload);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        return `${base}#${SHARE_HASH_PREFIX}${encoded}`;
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

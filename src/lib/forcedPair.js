const FORCED_PAIR_KEY = 'vwf_forced_pair';

export function isForcedAssetPair(pair) {
    return Boolean(pair?.left && typeof pair.left === 'object' && pair.left.label && pair.right?.label);
}

export function setForcedPair(pair) {
    if (typeof sessionStorage === 'undefined' || !pair?.left || !pair?.right) return;
    try {
        sessionStorage.setItem(FORCED_PAIR_KEY, JSON.stringify(pair));
    } catch {
        // Ignore quota / private mode
    }
}

export function consumeForcedPair() {
    if (typeof sessionStorage === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(FORCED_PAIR_KEY);
        sessionStorage.removeItem(FORCED_PAIR_KEY);
        if (!raw) return null;
        const pair = JSON.parse(raw);
        if (!pair?.left || !pair?.right) return null;
        return pair;
    } catch {
        return null;
    }
}

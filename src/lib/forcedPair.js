const FORCED_PAIR_KEY = 'vwf_forced_pair';
const FORCED_LINE_KEY = 'vwf_forced_line';
const JUDGE_CHAIN_KEY = 'vwf_judge_chain';

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

export function setForcedLine(line) {
    if (typeof sessionStorage === 'undefined') return;
    const value = String(line || '').trim();
    if (!value) return;
    try {
        sessionStorage.setItem(FORCED_LINE_KEY, value);
    } catch {
        // Ignore quota / private mode
    }
}

export function consumeForcedLine() {
    if (typeof sessionStorage === 'undefined') return '';
    try {
        const value = sessionStorage.getItem(FORCED_LINE_KEY) || '';
        sessionStorage.removeItem(FORCED_LINE_KEY);
        return value;
    } catch {
        return '';
    }
}

export function markJudgeChain() {
    if (typeof sessionStorage === 'undefined') return;
    try {
        sessionStorage.setItem(JUDGE_CHAIN_KEY, '1');
    } catch {
        // Ignore quota / private mode
    }
}

export function peekJudgeChain() {
    if (typeof sessionStorage === 'undefined') return false;
    try {
        return sessionStorage.getItem(JUDGE_CHAIN_KEY) === '1';
    } catch {
        return false;
    }
}

export function consumeJudgeChain() {
    const active = peekJudgeChain();
    if (typeof sessionStorage === 'undefined') return active;
    try {
        sessionStorage.removeItem(JUDGE_CHAIN_KEY);
    } catch {
        // Ignore quota / private mode
    }
    return active;
}

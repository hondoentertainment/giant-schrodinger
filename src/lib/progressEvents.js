export const PROGRESS_DIRTY_EVENT = 'vwf-progress-dirty';

export const SYNC_STORAGE_KEYS = new Set([
    'vwf_user',
    'vwf_stats',
    'venn_collisions',
    'vwf_ranked',
    'vwf_coins',
    'vwf_shop_owned',
    'vwf_shop_equipped',
    'vwf_battle_pass',
    'vwf_tournaments',
    'vwf_achievements',
    'vwf_daily',
    'vwf_stripe_grants_applied',
]);

let suppressDepth = 0;

export function suppressProgressDirty(fn) {
    suppressDepth += 1;
    try {
        return fn();
    } finally {
        suppressDepth -= 1;
    }
}

export function markProgressDirty() {
    if (suppressDepth > 0) return;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(PROGRESS_DIRTY_EVENT));
}

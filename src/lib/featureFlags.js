/**
 * Feature flag infrastructure.
 *
 * Supports data-driven iteration (A/B tests, kill switches, gated rollouts)
 * without code changes. Three-tier resolution, fastest to slowest:
 *
 *   1. URL override      — `?ff=<name>:on` or `?ff=<name>:off` (QA).
 *   2. localStorage      — `vwf_ff_<name>` keys set to `'true'` / `'false'` (dev).
 *   3. Remote cache      — prefetched from the Supabase `feature_flags` table,
 *                          honouring an optional `rollout_pct` that hashes the
 *                          user id for deterministic gradual rollouts.
 *
 * All reads are synchronous; remote values must be warmed ahead of time via
 * `initFeatureFlags()`. Any unexpected error falls through to `defaultValue`
 * so the UI never breaks.
 *
 * Runtime: dep-free. Uses `fetch` + `localStorage` only.
 */

import { isBackendEnabled } from './supabase.js';

const LS_PREFIX = 'vwf_ff_';
const USER_ID_KEY = 'venn_user_id';

// Remote flag cache. Shape: { [name]: { enabled: bool, rolloutPct?: number } }
let _remoteCache = null;
// In-flight remote fetch (used to coalesce concurrent init calls).
let _remotePromise = null;

/**
 * Known flag names. Intentionally empty at first; add entries here as new
 * experiments and kill switches land so feature-flag references are
 * discoverable from one place. Example:
 *
 *     export const FLAGS = {
 *         REVEAL_V2: 'reveal-v2',
 *     };
 */
export const FLAGS = {
    // (Empty on purpose — populated as flags come online.)
};

// ---------------------------------------------------------------------------
// User-id + hashing helpers
// ---------------------------------------------------------------------------

/**
 * Read a stable anonymous id from localStorage. Consistent with the
 * `venn_user_id` convention in `src/services/errorMonitoring.js`. Returns
 * `'anonymous'` when storage is unavailable or empty.
 */
export function getUserId() {
    try {
        if (typeof localStorage === 'undefined') return 'anonymous';
        return localStorage.getItem(USER_ID_KEY) || 'anonymous';
    } catch {
        return 'anonymous';
    }
}

/**
 * Deterministic, uniformly-distributed 32-bit hash of a string. Uses a
 * djb2-style accumulator multiplied by the prime 33 with XOR mixing to
 * spread character-code influence across bits. Good enough for bucketing
 * user ids into 0–99 rollout buckets; not cryptographic.
 *
 * Same input -> same output, always.
 */
export function hashUserId(id) {
    const s = String(id == null ? '' : id);
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
        // (hash * 33) ^ charCode — the classic djb2 variant.
        hash = (((hash << 5) + hash) ^ s.charCodeAt(i)) | 0;
    }
    // Force unsigned so the modulo below is always non-negative.
    return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Core read
// ---------------------------------------------------------------------------

/**
 * Synchronous flag resolver. Never throws.
 *
 * @param {string}  name         Flag name (matches the DB `name` column).
 * @param {boolean} defaultValue Fallback when no tier resolves. Defaults to `false`.
 * @returns {boolean}
 */
export function getFlag(name, defaultValue = false) {
    try {
        // 1) URL override — ?ff=foo:on or ?ff=foo:on,bar:off
        if (typeof window !== 'undefined' && window.location?.search) {
            const raw = new URLSearchParams(window.location.search).get('ff');
            if (raw) {
                const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
                const match = parts.find((m) => m.startsWith(name + ':'));
                if (match) {
                    const lower = match.toLowerCase();
                    if (lower.endsWith(':on') || lower.endsWith(':true')) return true;
                    if (lower.endsWith(':off') || lower.endsWith(':false')) return false;
                }
            }
        }

        // 2) localStorage override
        if (typeof localStorage !== 'undefined') {
            const ls = localStorage.getItem(LS_PREFIX + name);
            if (ls === 'true') return true;
            if (ls === 'false') return false;
        }

        // 3) Remote cache
        if (_remoteCache && Object.prototype.hasOwnProperty.call(_remoteCache, name)) {
            const flag = _remoteCache[name];
            if (!flag) return defaultValue;
            if (!flag.enabled) return false;
            if (typeof flag.rolloutPct === 'number' && flag.rolloutPct < 100) {
                if (flag.rolloutPct <= 0) return false;
                const bucket = hashUserId(getUserId()) % 100;
                return bucket < flag.rolloutPct;
            }
            return Boolean(flag.enabled);
        }

        return defaultValue;
    } catch {
        return defaultValue;
    }
}

// ---------------------------------------------------------------------------
// Local override helpers (dev tooling)
// ---------------------------------------------------------------------------

/**
 * Set a local override for a flag. Dispatches a `storage` event is out of
 * scope for same-tab writes, but React hooks re-read whenever the component
 * next renders, and the `storage` event fires naturally for cross-tab edits.
 */
export function setLocalOverride(name, value) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(LS_PREFIX + name, value ? 'true' : 'false');
    } catch {
        // Swallow quota / disabled-storage errors so dev tooling never breaks UI.
    }
}

/**
 * Remove a local override for a flag.
 */
export function clearLocalOverride(name) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(LS_PREFIX + name);
    } catch {
        // ignore
    }
}

// ---------------------------------------------------------------------------
// Remote cache init
// ---------------------------------------------------------------------------

/**
 * Inject a remote cache directly. Primarily for tests; production code should
 * call `initFeatureFlags()` which fetches from Supabase.
 */
export function _setRemoteCacheForTest(cache) {
    _remoteCache = cache;
}

/**
 * Reset all module-level state. Test-only.
 */
export function _resetForTest() {
    _remoteCache = null;
    _remotePromise = null;
}

/**
 * Pre-fetch the feature-flag table and populate the module-level cache so
 * subsequent synchronous `getFlag()` calls resolve against fresh data.
 *
 * Safe to call multiple times: in-flight requests are coalesced, and
 * failures leave the cache untouched (reads fall back to defaults).
 *
 * The parent app is expected to `await` this at startup. It is intentionally
 * not wired from App.jsx here — another agent owns that wiring.
 */
export function initFeatureFlags() {
    if (_remotePromise) return _remotePromise;

    _remotePromise = (async () => {
        try {
            if (!isBackendEnabled()) {
                // No backend configured; skip remote fetch. Cache stays null so
                // reads fall straight through to defaults.
                return;
            }
            const url = import.meta.env?.VITE_SUPABASE_URL;
            const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
            if (!url || !anonKey) return;

            const endpoint =
                `${url.replace(/\/+$/, '')}/rest/v1/feature_flags` +
                `?select=name,enabled,rollout_pct`;
            const res = await fetch(endpoint, {
                headers: {
                    apikey: anonKey,
                    Authorization: `Bearer ${anonKey}`,
                    Accept: 'application/json',
                },
            });
            if (!res || !res.ok) return;
            const rows = await res.json();
            if (!Array.isArray(rows)) return;
            const next = {};
            for (const row of rows) {
                if (!row || typeof row.name !== 'string') continue;
                next[row.name] = {
                    enabled: Boolean(row.enabled),
                    rolloutPct:
                        typeof row.rollout_pct === 'number' ? row.rollout_pct : 100,
                };
            }
            _remoteCache = next;
        } catch {
            // Swallow network / parsing errors. The cache simply stays empty
            // and every `getFlag()` call falls back to its default.
        } finally {
            _remotePromise = null;
        }
    })();

    return _remotePromise;
}

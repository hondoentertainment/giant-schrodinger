import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    FLAGS,
    getFlag,
    getUserId,
    hashUserId,
    setLocalOverride,
    clearLocalOverride,
    initFeatureFlags,
    _setRemoteCacheForTest,
    _resetForTest,
} from './featureFlags.js';

// Backend is off by default so `initFeatureFlags` is a no-op unless a test
// explicitly stubs fetch + env.
vi.mock('./supabase.js', () => ({
    isBackendEnabled: vi.fn(() => false),
}));

import { isBackendEnabled } from './supabase.js';

/** Helper: reset the jsdom URL search string. */
function setSearch(search) {
    // The test setup file stubs window.location with a plain object whose
    // `search` getter/setter writes through to a shared object, so this just
    // works.
    window.location.search = search;
}

describe('featureFlags', () => {
    beforeEach(() => {
        _resetForTest();
        setSearch('');
        isBackendEnabled.mockReturnValue(false);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getFlag — URL override', () => {
        it('returns true for ?ff=foo:on', () => {
            setSearch('?ff=foo:on');
            expect(getFlag('foo')).toBe(true);
        });

        it('returns false for ?ff=foo:off', () => {
            setSearch('?ff=foo:off');
            expect(getFlag('foo', true)).toBe(false);
        });

        it('parses multi-flag lists like ?ff=foo:on,bar:off', () => {
            setSearch('?ff=foo:on,bar:off');
            expect(getFlag('foo')).toBe(true);
            expect(getFlag('bar', true)).toBe(false);
        });

        it('accepts :true and :false aliases', () => {
            setSearch('?ff=foo:true,bar:false');
            expect(getFlag('foo')).toBe(true);
            expect(getFlag('bar', true)).toBe(false);
        });

        it('falls through to next tier when the URL does not mention the flag', () => {
            setSearch('?ff=other:on');
            localStorage.setItem('vwf_ff_foo', 'true');
            expect(getFlag('foo')).toBe(true);
        });
    });

    describe('getFlag — localStorage override', () => {
        it('returns true when LS holds "true"', () => {
            localStorage.setItem('vwf_ff_foo', 'true');
            expect(getFlag('foo')).toBe(true);
        });

        it('returns false when LS holds "false"', () => {
            localStorage.setItem('vwf_ff_foo', 'false');
            expect(getFlag('foo', true)).toBe(false);
        });

        it('falls through to remote cache when LS has no entry', () => {
            _setRemoteCacheForTest({ foo: { enabled: true, rolloutPct: 100 } });
            expect(getFlag('foo')).toBe(true);
        });
    });

    describe('getFlag — remote cache', () => {
        it('returns true when cache has {enabled: true} and no rollout', () => {
            _setRemoteCacheForTest({ foo: { enabled: true } });
            expect(getFlag('foo')).toBe(true);
        });

        it('returns false when rolloutPct is 0 even if enabled', () => {
            _setRemoteCacheForTest({ foo: { enabled: true, rolloutPct: 0 } });
            localStorage.setItem('venn_user_id', 'user-abc');
            expect(getFlag('foo')).toBe(false);
        });

        it('returns true when rolloutPct is 100', () => {
            _setRemoteCacheForTest({ foo: { enabled: true, rolloutPct: 100 } });
            localStorage.setItem('venn_user_id', 'user-abc');
            expect(getFlag('foo')).toBe(true);
        });

        it('rollout bucketing is deterministic per user id', () => {
            _setRemoteCacheForTest({ foo: { enabled: true, rolloutPct: 50 } });
            localStorage.setItem('venn_user_id', 'stable-user-id-xyz');
            const first = getFlag('foo');
            const second = getFlag('foo');
            const third = getFlag('foo');
            expect(second).toBe(first);
            expect(third).toBe(first);
            expect(typeof first).toBe('boolean');
        });

        it('returns false when cached flag is explicitly disabled', () => {
            _setRemoteCacheForTest({ foo: { enabled: false, rolloutPct: 100 } });
            expect(getFlag('foo', true)).toBe(false);
        });
    });

    describe('getFlag — default value', () => {
        it('returns the supplied default when nothing else resolves', () => {
            expect(getFlag('nothing-at-all', true)).toBe(true);
            expect(getFlag('nothing-at-all', false)).toBe(false);
        });

        it('returns `false` when no defaultValue is supplied', () => {
            expect(getFlag('nothing-at-all')).toBe(false);
        });
    });

    describe('getFlag — robustness', () => {
        it('returns default when localStorage throws', () => {
            vi.stubGlobal('localStorage', {
                getItem: () => {
                    throw new Error('boom');
                },
                setItem: () => {},
                removeItem: () => {},
                clear: () => {},
            });
            expect(getFlag('foo', true)).toBe(true);
            expect(getFlag('foo', false)).toBe(false);
        });
    });

    describe('local overrides', () => {
        it('round-trips via setLocalOverride / clearLocalOverride', () => {
            setLocalOverride('foo', true);
            expect(getFlag('foo')).toBe(true);

            setLocalOverride('foo', false);
            expect(getFlag('foo', true)).toBe(false);

            clearLocalOverride('foo');
            expect(localStorage.getItem('vwf_ff_foo')).toBeNull();
            expect(getFlag('foo', true)).toBe(true); // back to default
        });
    });

    describe('hashUserId', () => {
        it('is deterministic for the same input', () => {
            expect(hashUserId('abc')).toBe(hashUserId('abc'));
            expect(hashUserId('user-42')).toBe(hashUserId('user-42'));
        });

        it('produces different hashes for different inputs', () => {
            const a = hashUserId('alpha');
            const b = hashUserId('bravo');
            const c = hashUserId('charlie');
            expect(new Set([a, b, c]).size).toBe(3);
        });

        it('distributes inputs fairly uniformly over 100 buckets', () => {
            // Sanity check: 1000 distinct ids across 100 buckets, expect each
            // bucket to land between 2 and 25 hits (generous slack; a perfect
            // distribution would be 10).
            const counts = new Array(100).fill(0);
            for (let i = 0; i < 1000; i++) {
                counts[hashUserId('user-' + i) % 100]++;
            }
            for (const count of counts) {
                expect(count).toBeGreaterThanOrEqual(2);
                expect(count).toBeLessThanOrEqual(25);
            }
        });

        it('returns a non-negative integer', () => {
            const h = hashUserId('anything');
            expect(Number.isInteger(h)).toBe(true);
            expect(h).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getUserId', () => {
        it('reads from the venn_user_id localStorage key', () => {
            localStorage.setItem('venn_user_id', 'real-user-1');
            expect(getUserId()).toBe('real-user-1');
        });

        it('returns "anonymous" when nothing is stored', () => {
            expect(getUserId()).toBe('anonymous');
        });
    });

    describe('FLAGS', () => {
        it('is exported as a plain object so callers have a registry', () => {
            expect(typeof FLAGS).toBe('object');
            expect(FLAGS).not.toBeNull();
        });
    });

    describe('initFeatureFlags', () => {
        it('is a no-op when the backend is disabled', async () => {
            isBackendEnabled.mockReturnValue(false);
            const fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);
            await initFeatureFlags();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('populates the cache from a successful fetch', async () => {
            isBackendEnabled.mockReturnValue(true);
            vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
            vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [
                    { name: 'foo', enabled: true, rollout_pct: 100 },
                    { name: 'bar', enabled: false, rollout_pct: 0 },
                ],
            });
            vi.stubGlobal('fetch', fetchMock);
            await initFeatureFlags();
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [calledUrl, calledInit] = fetchMock.mock.calls[0];
            expect(calledUrl).toContain('/rest/v1/feature_flags');
            expect(calledInit.headers.apikey).toBe('test-anon-key');
            expect(getFlag('foo')).toBe(true);
            expect(getFlag('bar', true)).toBe(false);
        });

        it('swallows fetch errors without throwing', async () => {
            isBackendEnabled.mockReturnValue(true);
            vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
            vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
            const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
            vi.stubGlobal('fetch', fetchMock);
            await expect(initFeatureFlags()).resolves.toBeUndefined();
            // Cache stays empty, so the default wins.
            expect(getFlag('foo', true)).toBe(true);
        });

        it('coalesces concurrent init calls into a single fetch', async () => {
            isBackendEnabled.mockReturnValue(true);
            vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
            vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
            let resolveFetch;
            const fetchMock = vi.fn(
                () =>
                    new Promise((resolve) => {
                        resolveFetch = resolve;
                    })
            );
            vi.stubGlobal('fetch', fetchMock);
            const p1 = initFeatureFlags();
            const p2 = initFeatureFlags();
            expect(p2).toBe(p1);
            resolveFetch({ ok: true, json: async () => [] });
            await p1;
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});

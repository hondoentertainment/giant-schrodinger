import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeatureFlag } from './useFeatureFlag.js';
import {
    setLocalOverride,
    clearLocalOverride,
    _resetForTest,
} from './featureFlags.js';

vi.mock('./supabase.js', () => ({
    isBackendEnabled: vi.fn(() => false),
}));

describe('useFeatureFlag', () => {
    beforeEach(() => {
        _resetForTest();
        window.location.search = '';
    });

    it('returns the initial flag value read from localStorage', () => {
        setLocalOverride('my-flag', true);
        const { result } = renderHook(() => useFeatureFlag('my-flag'));
        expect(result.current).toBe(true);
    });

    it('returns defaultValue when nothing resolves', () => {
        const { result } = renderHook(() => useFeatureFlag('unknown', true));
        expect(result.current).toBe(true);
    });

    it('re-reads the flag when a storage event fires', () => {
        const { result } = renderHook(() => useFeatureFlag('my-flag'));
        expect(result.current).toBe(false);

        act(() => {
            setLocalOverride('my-flag', true);
            // Simulate a cross-tab storage event — jsdom does not fire these
            // automatically for same-tab writes.
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: 'vwf_ff_my-flag',
                    newValue: 'true',
                })
            );
        });

        expect(result.current).toBe(true);
    });

    it('ignores storage events for unrelated keys', () => {
        setLocalOverride('my-flag', false);
        const { result } = renderHook(() => useFeatureFlag('my-flag'));
        expect(result.current).toBe(false);

        act(() => {
            setLocalOverride('my-flag', true);
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: 'unrelated_key',
                    newValue: 'true',
                })
            );
        });

        // Event was ignored, so state still reflects the value from the first render.
        expect(result.current).toBe(false);
    });

    it('removes the storage listener on unmount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useFeatureFlag('my-flag'));
        const addedHandlers = addSpy.mock.calls.filter((c) => c[0] === 'storage');
        expect(addedHandlers.length).toBeGreaterThan(0);

        unmount();

        const removedHandlers = removeSpy.mock.calls.filter((c) => c[0] === 'storage');
        expect(removedHandlers.length).toBe(addedHandlers.length);
        // Each removed handler must match one of the added handlers by reference.
        for (const [, fn] of removedHandlers) {
            expect(addedHandlers.some((c) => c[1] === fn)).toBe(true);
        }

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('clearLocalOverride reflects through storage event', () => {
        setLocalOverride('my-flag', true);
        const { result } = renderHook(() => useFeatureFlag('my-flag', false));
        expect(result.current).toBe(true);

        act(() => {
            clearLocalOverride('my-flag');
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: 'vwf_ff_my-flag',
                    newValue: null,
                })
            );
        });

        expect(result.current).toBe(false);
    });
});

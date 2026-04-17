import { useState, useEffect } from 'react';
import { getFlag } from './featureFlags.js';

/**
 * React hook for reading feature flags. Returns the current value and
 * re-renders the host component whenever a `vwf_ff_*` localStorage key
 * changes (e.g. dev tools flipping an override in another tab).
 *
 * Intentionally does NOT subscribe to remote-cache updates: `initFeatureFlags`
 * runs once at app startup, before components mount, so the cache is static
 * during a session.
 *
 * @param {string}  name         Flag name.
 * @param {boolean} defaultValue Fallback when nothing resolves.
 */
export function useFeatureFlag(name, defaultValue = false) {
    const [value, setValue] = useState(() => getFlag(name, defaultValue));

    useEffect(() => {
        // Re-sync in case something set an override between initial render and
        // this effect running (e.g. a parent effect wrote to LS on mount).
        setValue(getFlag(name, defaultValue));

        const handler = (event) => {
            if (event && typeof event.key === 'string' && event.key.startsWith('vwf_ff_')) {
                setValue(getFlag(name, defaultValue));
            }
        };

        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('storage', handler);
        };
    }, [name, defaultValue]);

    return value;
}

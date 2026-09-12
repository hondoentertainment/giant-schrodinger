/**
 * Lightweight haptic feedback for key actions.
 * Prefers navigator.vibrate on the web; on Capacitor iOS the Vibration API
 * is a no-op, so we call `Capacitor.Plugins.Haptics` when the bridge exists.
 * Never throws. Does not import @capacitor/haptics (keeps the web bundle lean).
 */

const PATTERNS = {
    light: [10],
    medium: [15, 10, 15],
    success: [20, 30, 20],
    error: [50, 30, 50],
};

function nativeHaptics(win = typeof window !== 'undefined' ? window : undefined) {
    if (!win?.Capacitor?.isNativePlatform?.()) return null;
    return win.Capacitor.Plugins?.Haptics || null;
}

async function nativeHaptic(pattern) {
    const Haptics = nativeHaptics();
    if (!Haptics) return;
    try {
        if (pattern === 'success') {
            await Haptics.notification?.({ type: 'SUCCESS' });
            return;
        }
        if (pattern === 'error') {
            await Haptics.notification?.({ type: 'ERROR' });
            return;
        }
        await Haptics.impact?.({
            style: pattern === 'medium' ? 'MEDIUM' : 'LIGHT',
        });
    } catch {
        // ignore
    }
}

/**
 * Trigger haptic feedback. No-op if no engine is available.
 * @param {'light'|'medium'|'success'|'error'} [pattern='light']
 */
export function haptic(pattern = 'light') {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        const ms = PATTERNS[pattern] ?? PATTERNS.light;
        try {
            navigator.vibrate(ms);
        } catch {
            // ignore
        }
    }
    void nativeHaptic(pattern);
}

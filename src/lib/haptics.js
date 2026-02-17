/**
 * Lightweight haptic feedback for key actions.
 * Uses navigator.vibrate when available (most mobile browsers).
 */

const PATTERNS = {
    light: [10],
    medium: [15, 10, 15],
    success: [20, 30, 20],
    error: [50, 30, 50],
};

/**
 * Trigger haptic feedback. No-op if API unavailable.
 * @param {'light'|'medium'|'success'|'error'} [pattern='light']
 */
export function haptic(pattern = 'light') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        const ms = PATTERNS[pattern] ?? PATTERNS.light;
        try {
            navigator.vibrate(ms);
        } catch {
            // ignore
        }
    }
}

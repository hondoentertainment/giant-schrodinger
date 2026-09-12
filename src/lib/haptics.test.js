import { afterEach, describe, expect, it, vi } from 'vitest';
import { haptic } from './haptics';

describe('haptic', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is a no-op when Vibration API is missing', () => {
        vi.stubGlobal('navigator', {});
        expect(() => haptic('success')).not.toThrow();
    });

    it('uses navigator.vibrate when present', () => {
        const vibrate = vi.fn();
        vi.stubGlobal('navigator', { vibrate });
        haptic('success');
        expect(vibrate).toHaveBeenCalledWith([20, 30, 20]);
        haptic('light');
        expect(vibrate).toHaveBeenCalledWith([10]);
    });

    it('swallows vibrate failures', () => {
        vi.stubGlobal('navigator', {
            vibrate: () => {
                throw new Error('blocked');
            },
        });
        expect(() => haptic('error')).not.toThrow();
    });
});

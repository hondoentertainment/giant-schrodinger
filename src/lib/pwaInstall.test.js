import { afterEach, describe, expect, it } from 'vitest';
import {
    homeScreenTipCopy,
    isLikelyIosSafari,
    isStandaloneDisplay,
    shouldOfferHomeScreenTip,
} from './pwaInstall';

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => { data[key] = String(value); },
    };
}

describe('pwaInstall', () => {
    afterEach(() => {
        // no globals to restore — tests pass isolated windows
    });

    it('detects iOS Safari and standalone', () => {
        expect(isLikelyIosSafari({
            navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
        })).toBe(true);
        expect(isLikelyIosSafari({
            navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1' },
        })).toBe(false);
        expect(isStandaloneDisplay({
            navigator: { standalone: true },
            matchMedia: () => ({ matches: false }),
        })).toBe(true);
        expect(isStandaloneDisplay({
            Capacitor: { isNativePlatform: () => true },
            navigator: {},
        })).toBe(true);
    });

    it('offers a dismissible tip after the first session on iOS Safari', () => {
        const win = {
            navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' },
            matchMedia: () => ({ matches: false }),
        };
        const storage = memoryStorage();
        expect(shouldOfferHomeScreenTip({ roundsPlayed: 0, win, storage })).toBe(false);
        expect(shouldOfferHomeScreenTip({ roundsPlayed: 1, win, storage })).toBe(true);
        expect(homeScreenTipCopy(win).action).toBe(null);
        expect(homeScreenTipCopy(win).body).toMatch(/Share/i);
        expect(shouldOfferHomeScreenTip({
            roundsPlayed: 3,
            win: { ...win, Capacitor: { isNativePlatform: () => true } },
            storage,
        })).toBe(false);
        expect(shouldOfferHomeScreenTip({
            roundsPlayed: 3,
            win,
            storage: memoryStorage({ vwf_pwa_dismissed: 'true' }),
        })).toBe(false);
    });
});

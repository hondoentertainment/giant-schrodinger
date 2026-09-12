import { describe, expect, it, vi } from 'vitest';
import { initNativeShell, isNativeApp, shouldOpenExternally } from './nativeShell';

describe('nativeShell', () => {
    it('treats missing Capacitor as web', () => {
        expect(isNativeApp({})).toBe(false);
        expect(isNativeApp({ Capacitor: { isNativePlatform: () => false } })).toBe(false);
        expect(isNativeApp({ Capacitor: { isNativePlatform: () => true } })).toBe(true);
    });

    it('opens YouTube and other https hosts outside the webview', () => {
        expect(shouldOpenExternally('https://www.youtube.com/watch?v=abc')).toBe(true);
        expect(shouldOpenExternally('https://support.hondoentertainment.com/help')).toBe(true);
        expect(shouldOpenExternally('https://giant-schrodinger.vercel.app/privacy.html')).toBe(false);
        expect(shouldOpenExternally('https://abc.supabase.co/functions/v1/og-tags')).toBe(false);
        expect(shouldOpenExternally('/privacy.html')).toBe(false);
        expect(shouldOpenExternally('mailto:support@hondoentertainment.com')).toBe(false);
    });

    it('configures chrome through the Capacitor plugin bridge', async () => {
        const setStyle = vi.fn();
        const hide = vi.fn();
        const win = {
            Capacitor: {
                isNativePlatform: () => true,
                Plugins: {
                    StatusBar: { setStyle, setBackgroundColor: vi.fn(), setOverlaysWebView: vi.fn() },
                    Keyboard: { setResizeMode: vi.fn() },
                    SplashScreen: { hide },
                    Browser: { open: vi.fn() },
                    App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }) },
                },
            },
            document: { documentElement: { classList: { add: vi.fn(), remove: vi.fn() } } },
            history: { back: vi.fn() },
        };
        const teardown = await initNativeShell(win);
        expect(setStyle).toHaveBeenCalledWith({ style: 'DARK' });
        expect(hide).toHaveBeenCalled();
        expect(typeof teardown).toBe('function');
        teardown();
    });
});

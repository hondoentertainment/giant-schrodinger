/**
 * Capacitor WKWebView shell — status bar, keyboard, splash, external links.
 * Talks to `window.Capacitor.Plugins` so official plugin JS never enters the
 * web bundle (bundle budget). `cap sync` still wires the native plugins.
 */

export function isNativeApp(win = typeof window !== 'undefined' ? window : undefined) {
    return Boolean(win?.Capacitor?.isNativePlatform?.());
}

export function isCapacitorBridgeAvailable(win = typeof window !== 'undefined' ? window : undefined) {
    return Boolean(win?.Capacitor);
}

function plugin(name, win = typeof window !== 'undefined' ? window : undefined) {
    return win?.Capacitor?.Plugins?.[name] || null;
}

function isExternalHttpUrl(href) {
    try {
        const url = new URL(href, 'https://giant-schrodinger.vercel.app');
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isAppBoundHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'localhost'
        || host === 'giant-schrodinger.vercel.app'
        || host.endsWith('.supabase.co');
}

export function shouldOpenExternally(href) {
    if (!isExternalHttpUrl(href)) return false;
    try {
        const url = new URL(href, 'https://giant-schrodinger.vercel.app');
        if (isAppBoundHost(url.hostname)) return false;
        return true;
    } catch {
        return false;
    }
}

async function applyChrome(win) {
    const StatusBar = plugin('StatusBar', win);
    const Keyboard = plugin('Keyboard', win);
    const SplashScreen = plugin('SplashScreen', win);

    try {
        await StatusBar?.setStyle?.({ style: 'DARK' });
    } catch {
        // ignore — not available on every host
    }
    try {
        await StatusBar?.setBackgroundColor?.({ color: '#07070a' });
    } catch {
        // Android-only on some versions
    }
    try {
        await StatusBar?.setOverlaysWebView?.({ overlay: true });
    } catch {
        // ignore
    }
    try {
        await Keyboard?.setResizeMode?.({ mode: 'body' });
    } catch {
        // ignore
    }
    try {
        await SplashScreen?.hide?.({ fadeOutDuration: 280 });
    } catch {
        // ignore
    }
}

function bindExternalLinkPolicy(win) {
    if (typeof document === 'undefined') return () => {};
    const Browser = plugin('Browser', win);

    const onClick = (event) => {
        const anchor = event.target?.closest?.('a[href]');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!shouldOpenExternally(href)) return;
        event.preventDefault();
        const open = Browser?.open
            ? Browser.open({ url: href, presentationStyle: 'popover' })
            : Promise.reject(new Error('no browser plugin'));
        open.catch(() => {
            win.open(href, '_blank', 'noopener,noreferrer');
        });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
}

/**
 * Configure the native shell. Safe to call on web (no-op).
 * @returns {Promise<() => void>} teardown
 */
export async function initNativeShell(win = typeof window !== 'undefined' ? window : undefined) {
    if (!isNativeApp(win)) return () => {};

    win.document?.documentElement?.classList.add('capacitor-native');
    await applyChrome(win);
    const unbindLinks = bindExternalLinkPolicy(win);
    const App = plugin('App', win);
    let backHandle = null;
    try {
        backHandle = await App?.addListener?.('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                win.history.back();
                return;
            }
            App.exitApp?.();
        });
    } catch {
        backHandle = null;
    }

    return () => {
        unbindLinks();
        backHandle?.remove?.();
        win.document?.documentElement?.classList.remove('capacitor-native');
    };
}

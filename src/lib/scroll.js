/**
 * Reset the app scroll container (and window fallback) to the top.
 * Retries across frames so late layout (images, score UI) cannot leave mid-page.
 */
export function scrollMainToTop() {
    const run = () => {
        const main = typeof document !== 'undefined'
            ? document.getElementById('main-content')
            : null;
        if (main) {
            main.scrollTop = 0;
            if (typeof main.scrollTo === 'function') {
                main.scrollTo(0, 0);
            }
        }
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            try {
                window.scrollTo(0, 0);
            } catch {
                // jsdom may stub scrollTo as not-implemented
            }
        }
        if (typeof document !== 'undefined') {
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    };

    run();
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
            run();
            requestAnimationFrame(run);
        });
    }
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
        window.setTimeout(run, 50);
        window.setTimeout(run, 200);
    }
}

const MEDIA_ORIGINS = [
    'https://images.unsplash.com',
    'https://images.pexels.com',
    'https://videos.pexels.com',
    'https://media.giphy.com',
    'https://i.ytimg.com',
    'https://www.youtube-nocookie.com',
];

let initialized = false;

/**
 * Inject preconnect hints for common image/video/meme CDNs.
 */
export function initMediaHints() {
    if (initialized || typeof document === 'undefined') return;
    initialized = true;

    const origins = [...MEDIA_ORIGINS];
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('your-')) {
        origins.push(supabaseUrl.replace(/\/$/, ''));
    }

    for (const href of origins) {
        if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }
}

export function _resetMediaHintsInit() {
    initialized = false;
}

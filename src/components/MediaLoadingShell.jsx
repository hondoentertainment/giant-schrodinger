import React from 'react';

/**
 * Shared loading overlay for Venn media circles (images, memes, video posters).
 */
export function MediaLoadingShell({ blurUrl, loaded, label, className = '' }) {
    if (loaded) return null;

    return (
        <>
            {blurUrl && (
                <img
                    src={blurUrl}
                    alt=""
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full object-cover scale-110 blur-md ${className}`}
                    referrerPolicy="no-referrer"
                />
            )}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 animate-pulse z-10"
                role="status"
                aria-live="polite"
                aria-label={label ? `Loading ${label}` : 'Loading media'}
            >
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
        </>
    );
}

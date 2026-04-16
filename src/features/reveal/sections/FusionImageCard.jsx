import React from 'react';

export function FusionImageCard({ fusionImage, submission }) {
    return (
        <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-2xl ring-1 ring-white/20">
            <img
                src={fusionImage.url}
                alt="Fusion"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                data-fallback={fusionImage.fallbackUrl}
                onError={(event) => {
                    const fallback = event.currentTarget.dataset.fallback;
                    if (fallback && event.currentTarget.src !== fallback) {
                        event.currentTarget.src = fallback;
                    }
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-left">
                <div className="text-white/60 text-sm uppercase tracking-wider">Concept</div>
                <div className="text-2xl font-bold text-white">{submission}</div>
            </div>
        </div>
    );
}

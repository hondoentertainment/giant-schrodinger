import React, { useState } from 'react';

function VennImage({ asset }) {
    const [loaded, setLoaded] = useState(false);

    const handleError = (event) => {
        const fallback = event.currentTarget.dataset.fallback;
        if (fallback && event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
            event.currentTarget.onerror = null;
        }
    };

    const handleLoad = () => setLoaded(true);

    return (
        <>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
            )}
            <img
                src={asset.url}
                alt={asset.label}
                className={`w-full h-full object-cover brightness-110 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                data-fallback={asset.fallbackUrl}
                onError={handleError}
                onLoad={handleLoad}
                loading="eager"
                decoding="async"
            />
        </>
    );
}

export function VennDiagram({ leftAsset, rightAsset }) {
    return (
        <div className="relative w-full max-w-4xl aspect-[2/1] flex justify-center items-center my-8">
            {/* Left Circle */}
            <div className="absolute left-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <VennImage asset={leftAsset} />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-8 left-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md z-10">
                    {leftAsset.label}
                </div>
            </div>

            {/* Right Circle */}
            <div className="absolute right-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <VennImage asset={rightAsset} />
                <div className="absolute inset-0 bg-gradient-to-l from-pink-500/20 to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-8 right-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md z-10">
                    {rightAsset.label}
                </div>
            </div>

            {/* Intersection Highlight */}
            <div className="absolute z-10 text-center pointer-events-none">
                <div className="text-xl font-light text-white/50 tracking-[0.5em] uppercase mb-2">
                    The Intersection
                </div>
                <div className="w-16 h-16 mx-auto rounded-full bg-white/20 blur-xl animate-pulse" />
            </div>
        </div>
    );
}

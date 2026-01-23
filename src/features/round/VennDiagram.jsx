import React from 'react';

export function VennDiagram({ leftAsset, rightAsset }) {
    return (
        <div className="relative w-full max-w-4xl aspect-[2/1] flex justify-center items-center my-8">
            {/* Left Circle */}
            <div className="absolute left-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <img
                    src={leftAsset.url}
                    alt={leftAsset.label}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent mix-blend-overlay" />
                <div className="absolute bottom-8 left-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                    {leftAsset.label}
                </div>
            </div>

            {/* Right Circle */}
            <div className="absolute right-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <img
                    src={rightAsset.url}
                    alt={rightAsset.label}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-pink-500/30 to-transparent mix-blend-overlay" />
                <div className="absolute bottom-8 right-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md">
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

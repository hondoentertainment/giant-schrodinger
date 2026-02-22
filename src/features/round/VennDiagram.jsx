import React from 'react';
import { ImageWithLoader } from '../../components/ImageWithLoader';

export function VennDiagram({ leftAsset, rightAsset }) {
    if (!leftAsset || !rightAsset) return null;

    return (
        <div className="relative w-full max-w-4xl aspect-[2/1] md:aspect-[2.2/1] flex justify-center items-center my-4 md:my-8 group perspective-1000">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 blur-3xl rounded-full opacity-60" />

            {/* Left Circle */}
            <div className="absolute left-0 w-[55%] aspect-square rounded-full border-2 border-white/20 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm overflow-hidden z-10 animate-float shadow-[0_8px_32px_0_rgba(168,85,247,0.2)] hover:shadow-[0_8px_40px_rgba(168,85,247,0.4)] transition-all duration-700">
                {/* Inner Glass Border */}
                <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-20" />

                <ImageWithLoader
                    src={leftAsset.url}
                    alt={leftAsset.label}
                    containerClassName="w-full h-full"
                    className="opacity-80 hover:opacity-100 transition-opacity duration-500"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent mix-blend-multiply pointer-events-none" />

                {/* Label */}
                <div className="absolute bottom-6 left-8 md:bottom-10 md:left-12 z-20">
                    <div className="text-xs md:text-sm font-medium text-purple-200/80 mb-1 uppercase tracking-wider font-display">Subject A</div>
                    <div className="text-2xl md:text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] font-display text-glow">
                        {leftAsset.label}
                    </div>
                </div>
            </div>

            {/* Right Circle */}
            <div className="absolute right-0 w-[55%] aspect-square rounded-full border-2 border-white/20 bg-gradient-to-bl from-white/5 to-transparent backdrop-blur-sm overflow-hidden z-10 animate-float-delayed shadow-[0_8px_32px_0_rgba(6,182,212,0.2)] hover:shadow-[0_8px_40px_rgba(6,182,212,0.4)] transition-all duration-700">
                {/* Inner Glass Border */}
                <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-20" />

                <ImageWithLoader
                    src={rightAsset.url}
                    alt={rightAsset.label}
                    containerClassName="w-full h-full"
                    className="opacity-80 hover:opacity-100 transition-opacity duration-500"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/80 via-transparent to-transparent mix-blend-multiply pointer-events-none" />

                {/* Label */}
                <div className="absolute bottom-6 right-8 md:bottom-10 md:right-12 text-right z-20">
                    <div className="text-xs md:text-sm font-medium text-cyan-200/80 mb-1 uppercase tracking-wider font-display">Subject B</div>
                    <div className="text-2xl md:text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] font-display text-glow">
                        {rightAsset.label}
                    </div>
                </div>
            </div>

            {/* Intersection Highlight */}
            <div className="absolute z-30 pointer-events-none flex flex-col items-center justify-center w-[30%] h-[30%]">
                <div className="absolute inset-0 bg-white/10 blur-3xl animate-pulse rounded-full" />
                <div className="relative flex flex-col items-center transform hover:scale-110 transition-transform duration-500">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.4)] mb-3 animate-bounce-slow">
                        <span className="text-2xl md:text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">✨</span>
                    </div>
                    <div className="text-xs md:text-sm font-bold text-white tracking-[0.3em] uppercase whitespace-nowrap drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                        The Connection
                    </div>
                </div>
            </div>
        </div>
    );
}

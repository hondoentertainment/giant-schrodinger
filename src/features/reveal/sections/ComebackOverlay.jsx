import React from 'react';

export function ComebackOverlay({ comebackData }) {
    if (!comebackData) return null;
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-in zoom-in-95 duration-500">
            <div className="text-7xl mb-4 animate-bounce">&#x1F525;</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                COMEBACK KID!
            </h2>
            <p className="text-white/60 text-lg">
                From {comebackData.prevScore}/10 &rarr; {comebackData.currentScore}/10
            </p>
        </div>
    );
}

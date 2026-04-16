import React from 'react';

export function ModifierResultBanner({ mod, finalScoreDisplay }) {
    if (!mod) return null;

    if (mod.id === 'doubleOrNothing') {
        const threshold = mod.scoreThreshold || 7;
        const success = finalScoreDisplay >= threshold;
        return (
            <div className={`mb-6 p-4 rounded-2xl border text-center animate-in zoom-in-95 duration-500 ${
                success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
            }`}>
                <div className="text-2xl mb-1">
                    {success ? '🎲 DOUBLED!' : '🎲 BUST!'}
                </div>
                <div className="text-white/60 text-sm">
                    {success
                        ? `Scored ${finalScoreDisplay}+ — your points are doubled!`
                        : `Needed ${threshold}+ to keep your points.`}
                </div>
            </div>
        );
    }

    if (mod.id === 'showdown') {
        return (
            <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center animate-in zoom-in-95 duration-500">
                <div className="text-2xl mb-1">🏆 Final Showdown Complete!</div>
                <div className="text-white/60 text-sm">2x points applied to your final round.</div>
            </div>
        );
    }

    return null;
}

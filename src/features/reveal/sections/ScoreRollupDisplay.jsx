import React from 'react';

export function ScoreRollupDisplay({ animatedScore, scoreBand, relevance }) {
    return (
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${scoreBand?.color || 'from-yellow-300 to-amber-600'} transition-all`}>
                    {Math.round(animatedScore)}/10
                </div>
                <div className="text-white/40 text-xs uppercase tracking-widest mt-1">
                    {scoreBand?.label || 'Final Score'}
                </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="text-lg font-bold text-white/90">
                    {relevance}
                </div>
            </div>
        </div>
    );
}

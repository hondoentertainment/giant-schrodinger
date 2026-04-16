import React from 'react';

export function PercentileRankBadge({ playerRank }) {
    if (!playerRank || playerRank.total <= 0) return null;
    return (
        <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 animate-in fade-in duration-500">
            <div className="text-sm font-bold text-purple-300">
                Top {Math.max(1, Math.round(100 - playerRank.percentile))}% today!
            </div>
            <div className="text-white/40 text-xs">
                Rank #{playerRank.rank} of {playerRank.total} players
            </div>
        </div>
    );
}

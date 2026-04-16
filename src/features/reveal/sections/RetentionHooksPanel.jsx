import React from 'react';

export function RetentionHooksPanel({ result, stats, isDailyChallenge, roundNumber, totalRounds }) {
    if (!result) return null;
    const xpGained = (result.finalScore || result.score || 0) * 10;
    return (
        <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-white/50 text-xs uppercase tracking-wider font-bold mb-3">Keep Going</div>
            <div className="space-y-2">
                {/* Battle pass XP */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">&#11088;</span>
                    <span className="text-white/70">+{xpGained} XP earned this round</span>
                </div>

                {/* Streak status */}
                {stats?.currentStreak > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-orange-400">&#128293;</span>
                        <span className="text-white/70">Day {stats.currentStreak} streak — play tomorrow to keep it!</span>
                    </div>
                )}

                {/* Daily challenge prompt */}
                {!isDailyChallenge && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-amber-400">&#128197;</span>
                        <span className="text-white/70">Daily challenge available — try it for 1.5x bonus!</span>
                    </div>
                )}

                {/* Rounds remaining */}
                {roundNumber < totalRounds && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-cyan-400">&#127919;</span>
                        <span className="text-white/70">{totalRounds - roundNumber} round{totalRounds - roundNumber > 1 ? 's' : ''} left in this session</span>
                    </div>
                )}
            </div>
        </div>
    );
}

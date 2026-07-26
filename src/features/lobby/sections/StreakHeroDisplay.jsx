import React from 'react';

export function StreakHeroDisplay({ stats, streakBonus }) {
    if (stats.currentStreak > 0) {
        return (
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25">
                <div className="text-5xl font-black text-amber-400 mb-1">
                    🔥 {stats.currentStreak}
                </div>
                <div className="text-amber-300/80 text-sm font-semibold">Day Streak</div>
                {streakBonus > 1 && (
                    <div className="text-amber-400/60 text-xs mt-1">
                        +{Math.round((streakBonus - 1) * 100)}% streak bonus active
                    </div>
                )}
                {stats.currentStreak < 7 && (
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                            style={{ width: `${(stats.currentStreak / 7) * 100}%` }}
                        />
                    </div>
                )}
                {stats.currentStreak < 7 && (
                    <div className="text-white/30 text-xs mt-1">{7 - stats.currentStreak} days to Mystery Box unlock</div>
                )}
            </div>
        );
    }
    return (
        <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-white/50 text-sm">Play today to start a streak!</div>
            <div className="text-white/30 text-xs mt-1">Streaks unlock bonuses and rewards</div>
        </div>
    );
}

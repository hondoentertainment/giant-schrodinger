import React from 'react';
import { CalendarDays, Zap } from 'lucide-react';

export function DailyChallengePanel({
    show,
    dailyPlayed,
    dailyChallenge,
    countdown,
    sessionId,
    onStart,
}) {
    if (!show) return null;
    if (!dailyPlayed) {
        return (
            <button
                onClick={onStart}
                disabled={!!sessionId}
                className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <CalendarDays className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-bold flex items-center gap-2">
                            Daily Challenge
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">NEW</span>
                        </div>
                        <div className="text-white/50 text-sm">{dailyChallenge.prompt}</div>
                    </div>
                    <Zap className="w-5 h-5 text-amber-400" />
                </div>
            </button>
        );
    }
    return (
        <div className="w-full mb-4 p-4 rounded-2xl border border-white/10 bg-white/5 text-center">
            <div className="text-white/40 text-sm mb-1">
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Daily challenge completed!
            </div>
            <div className="text-white/60 text-lg font-bold">
                Next challenge in {countdown}
            </div>
        </div>
    );
}

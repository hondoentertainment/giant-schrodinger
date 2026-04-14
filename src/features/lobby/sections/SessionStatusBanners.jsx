import React from 'react';
import { WifiOff } from 'lucide-react';
import { isBackendEnabled } from '../../../lib/supabase';
import { useTranslation } from '../../../hooks/useTranslation';

export function SessionProgressIndicator({ sessionId, roundNumber, totalRounds, sessionScore }) {
    if (!sessionId) return null;
    return (
        <div className="mb-6 text-sm text-white/60">
            Session: <span className="text-white font-semibold">Round {roundNumber} of {totalRounds}</span> ·
            <span className="text-white font-semibold"> {sessionScore} pts</span>
        </div>
    );
}

export function OfflineModeIndicator() {
    const { t } = useTranslation();
    if (isBackendEnabled()) return null;
    return (
        <div className="w-full max-w-md mb-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-300 text-sm">
            <WifiOff size={16} />
            <span>{t('lobby.offlineMode')}</span>
        </div>
    );
}

export function SessionResumeBanner({ roundNumber, totalRounds, beginRound }) {
    if (!(roundNumber > 0 && roundNumber < totalRounds)) return null;
    return (
        <div className="w-full max-w-md mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
                <div className="text-blue-300 text-sm font-bold">Session in Progress</div>
                <div className="text-white/60 text-xs">Round {roundNumber} of {totalRounds}</div>
            </div>
            <button
                onClick={beginRound}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition"
            >
                Continue
            </button>
        </div>
    );
}

export function StreakCounter({ stats }) {
    if (!(stats?.currentStreak > 0)) return null;
    return (
        <div className="w-full max-w-md mb-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30 text-center animate-in fade-in duration-500">
            <div className="text-4xl mb-1">🔥</div>
            <div className="text-2xl font-black text-orange-300">Day {stats.currentStreak}</div>
            <div className="text-white/60 text-sm">
                {stats.currentStreak >= 5 ? 'Max streak bonus! 1.5x multiplier' :
                 `${((1 + stats.currentStreak * 0.1).toFixed(1))}x streak multiplier`}
            </div>
        </div>
    );
}

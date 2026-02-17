import React, { useEffect, useRef } from 'react';
import { X, Trophy, Flame } from 'lucide-react';
import { getMilestones, getStats } from '../services/stats';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function UnlockModal({ onClose }) {
    const containerRef = useRef(null);
    useFocusTrap(true, containerRef);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);
    const milestones = getMilestones();
    const stats = getStats();
    const avatarMilestones = milestones.filter((m) => m.reward === 'avatar');
    const themeMilestones = milestones.filter((m) => m.reward === 'theme');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-modal-title"
        >
            <div ref={containerRef} className="w-full max-w-md glass-panel rounded-3xl p-8 animate-in zoom-in-95 duration-300 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 id="unlock-modal-title" className="text-2xl font-display font-bold text-white">
                        How to Unlock
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-white/60 text-sm mb-6">
                    Play rounds and build streaks to unlock new avatars and the Mystery Box theme.
                </p>

                <div className="space-y-6">
                    <section aria-labelledby="avatar-unlocks">
                        <h3 id="avatar-unlocks" className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            Avatar Unlocks
                        </h3>
                        <div className="space-y-2">
                            {avatarMilestones.map((m) => {
                                const unlocked = stats.milestonesUnlocked.includes(m.id);
                                const value = m.type === 'rounds' ? stats.totalRounds : stats.currentStreak;
                                const pct = Math.min(100, (value / m.threshold) * 100);
                                return (
                                    <div
                                        key={m.id}
                                        className={`rounded-xl p-3 border transition-all ${
                                            unlocked
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-lg" aria-hidden="true">{m.rewardId}</span>
                                            <span className={`text-sm font-medium ${unlocked ? 'text-emerald-400' : 'text-white/80'}`}>
                                                {m.label}
                                            </span>
                                            {unlocked ? (
                                                <span className="text-xs text-emerald-400 font-semibold">Unlocked</span>
                                            ) : (
                                                <span className="text-xs text-white/50">
                                                    {value}/{m.threshold} {m.type === 'rounds' ? 'rounds' : 'days'}
                                                </span>
                                            )}
                                        </div>
                                        {!unlocked && (
                                            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-labelledby="theme-unlocks">
                        <h3 id="theme-unlocks" className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            Theme Unlock
                        </h3>
                        <div className="space-y-2">
                            {themeMilestones.map((m) => {
                                const unlocked = stats.milestonesUnlocked.includes(m.id);
                                const value = m.type === 'streak' ? stats.currentStreak : stats.totalRounds;
                                const pct = Math.min(100, (value / m.threshold) * 100);
                                return (
                                    <div
                                        key={m.id}
                                        className={`rounded-xl p-3 border transition-all ${
                                            unlocked
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-white/80">Mystery Box</span>
                                            {unlocked ? (
                                                <span className="text-xs text-emerald-400 font-semibold">Unlocked</span>
                                            ) : (
                                                <span className="text-xs text-white/50">
                                                    {value}/{m.threshold} day streak
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white/50 text-xs mt-1">
                                            Play at least 1 round per day for 7 days to unlock random surprise connections.
                                        </p>
                                        {!unlocked && (
                                            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-white text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

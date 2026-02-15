import React from 'react';
import { getMilestones } from '../services/stats';

export function MilestoneCelebration({ newlyUnlocked, onDismiss }) {
    const milestones = getMilestones();
    const unlocked = milestones.filter((m) => newlyUnlocked.includes(m.id));

    if (unlocked.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md glass-panel rounded-3xl p-8 animate-in zoom-in-95 duration-300 border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                <div className="text-6xl text-center mb-4">🎉</div>
                <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">
                    Milestone Unlocked!
                </h2>
                <div className="space-y-3 mb-6">
                    {unlocked.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4"
                        >
                            <span className="text-3xl">{m.reward === 'avatar' ? m.rewardId : '🎨'}</span>
                            <div>
                                <div className="font-semibold text-white">{m.label}</div>
                                <div className="text-white/50 text-sm">
                                    {m.reward === 'avatar' ? `New avatar: ${m.rewardId}` : `New theme unlocked!`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onDismiss}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
                >
                    Awesome!
                </button>
            </div>
        </div>
    );
}

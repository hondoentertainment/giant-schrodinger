import React, { useEffect, useRef } from 'react';
import { getMilestones } from '../services/stats';
import { haptic } from '../lib/haptics';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function MilestoneCelebration({ newlyUnlocked, onDismiss }) {
    const dialogRef = useRef(null);
    useFocusTrap(true, dialogRef);
    const milestones = getMilestones();
    const unlocked = milestones.filter((m) => newlyUnlocked.includes(m.id));

    const handleDismiss = () => {
        haptic('success');
        onDismiss();
    };

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') handleDismiss();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    });

    if (unlocked.length === 0) return null;

    return (
        <div className="game-modal-overlay animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="milestone-title">
            <div ref={dialogRef} className="game-modal-panel p-8 border-amber-400/25 shadow-[0_0_60px_rgba(255,214,10,0.15)]">
                <div className="text-6xl text-center mb-4">🎉</div>
                <h2 id="milestone-title" className="text-2xl font-display font-bold tracking-tight text-white mb-2 text-center">
                    Milestone unlocked
                </h2>
                <div className="space-y-3 mb-6">
                    {unlocked.map((m) => (
                        <div
                            key={m.id}
                            className="game-player-row"
                        >
                            <span className="text-3xl">{m.reward === 'avatar' ? m.rewardId : '🎨'}</span>
                            <div>
                                <div className="font-semibold text-white">{m.label}</div>
                                <div className="text-white/50 text-sm">
                                    {m.reward === 'avatar' ? `New avatar: ${m.rewardId}` : 'New theme unlocked'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleDismiss}
                    className="wordle-button wordle-primary w-full"
                >
                    Awesome
                </button>
            </div>
        </div>
    );
}

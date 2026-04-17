import React from 'react';
import { trackFunnel } from '../../../services/analytics';

export function ShareActionsRow({
    onShareForJudging,
    shareCopied,
    savedCollision,
    onNext,
    roundNumber,
    totalRounds,
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div>
                <button
                    onClick={() => {
                        trackFunnel('first_share_clicked');
                        onShareForJudging();
                    }}
                    disabled={!savedCollision}
                    className="px-8 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50"
                    title="Send this link to a friend — they'll score your connection. Press S for shortcut."
                >
                    {shareCopied ? 'Link copied! Send to a friend' : 'Share for friend to judge'}
                </button>
                <p className="text-white/30 text-xs mt-1.5">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/50">S</kbd> to copy link</p>
            </div>
            <button
                onClick={onNext}
                className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
                {roundNumber >= totalRounds ? 'See Results' : 'Next Round →'}
            </button>
        </div>
    );
}

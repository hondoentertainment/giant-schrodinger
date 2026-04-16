import React from 'react';

export function ChallengeFriendButton({ onClick, challengeCopied, finalScoreDisplay }) {
    return (
        <button
            onClick={onClick}
            className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-all text-center group"
        >
            <div className="text-lg font-bold text-amber-300 group-hover:scale-105 transition-transform">
                {challengeCopied ? 'Challenge link copied!' : `Challenge a friend to beat your ${finalScoreDisplay}/10!`}
            </div>
            <div className="text-white/40 text-xs mt-1">
                They&apos;ll play the same concepts and try to outscore you
            </div>
        </button>
    );
}

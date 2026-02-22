import React from 'react';

export function ChallengeIntro({ challenge, onAccept }) {
    const { creator } = challenge;

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in zoom-in-95 duration-500">
            <div className="text-center">
                {/* Badge */}
                <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 text-sm font-bold tracking-widest text-orange-400 mb-6 border border-orange-500/30 animate-pulse">
                    ⚔️ CHALLENGE RECEIVED
                </div>

                {/* Challenger Avatar */}
                <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-5xl shadow-2xl ring-4 ring-white/20">
                        {creator.avatar}
                    </div>
                </div>

                {/* Challenger Info */}
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                    {creator.name}
                </h2>
                <p className="text-white/60 mb-2">challenged you!</p>

                {/* Their Score */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-lg font-bold text-white mb-8">
                    <span className="text-yellow-400">🏆</span>
                    They scored {creator.score}/10
                </div>

                {/* Taunt */}
                <p className="text-white/40 italic mb-8">
                    "Can you beat my score?"
                </p>

                {/* Accept Button */}
                <button
                    onClick={onAccept}
                    className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xl rounded-2xl hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                >
                    ⚔️ Accept Challenge
                </button>

                <p className="text-white/30 text-sm mt-4">
                    Same images • 60 seconds • Beat their score!
                </p>
            </div>
        </div>
    );
}

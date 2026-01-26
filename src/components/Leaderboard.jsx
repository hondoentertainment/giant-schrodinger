import React from 'react';
import { getHighScores } from '../../services/storage';

export function Leaderboard() {
    const scores = getHighScores();

    if (scores.length === 0) {
        return (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-center text-white/40 text-sm">
                    No high scores yet. Play to set records!
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-3 text-center">🏆 High Scores</div>
            <div className="space-y-2">
                {scores.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-300 text-black' :
                                    index === 2 ? 'bg-amber-700 text-white' :
                                        'bg-white/10 text-white/60'
                            }`}>
                            {index + 1}
                        </div>
                        <div className="flex-1 truncate text-white/80 text-sm">
                            {entry.submission}
                        </div>
                        <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-600">
                            {entry.score}/10
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

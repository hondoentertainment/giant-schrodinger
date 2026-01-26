import React from 'react';
import { useGame } from '../../context/GameContext';

export function FinalResults() {
    const { roundScores, maxRounds, resetGame } = useGame();

    const totalScore = roundScores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = maxRounds * 10;
    const averageScore = roundScores.length > 0 ? (totalScore / roundScores.length).toFixed(1) : 0;

    const getPerformanceRating = () => {
        const percentage = (totalScore / maxPossibleScore) * 100;
        if (percentage >= 80) return { emoji: '🏆', text: 'Legendary!', color: 'from-yellow-400 to-amber-600' };
        if (percentage >= 60) return { emoji: '🌟', text: 'Impressive!', color: 'from-purple-400 to-pink-600' };
        if (percentage >= 40) return { emoji: '👍', text: 'Not Bad!', color: 'from-cyan-400 to-blue-600' };
        return { emoji: '🎭', text: 'Keep Practicing!', color: 'from-gray-400 to-slate-600' };
    };

    const performance = getPerformanceRating();

    return (
        <div className="w-full max-w-2xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-8 text-center">
                    <div className="text-6xl mb-4">{performance.emoji}</div>
                    <h2 className={`text-4xl font-display font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r ${performance.color}`}>
                        {performance.text}
                    </h2>
                    <p className="text-white/60 mb-8">Championship Complete</p>

                    {/* Round-by-round breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {roundScores.map((score, index) => (
                            <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Round {index + 1}</div>
                                <div className="text-2xl font-bold text-white">{score}/10</div>
                            </div>
                        ))}
                    </div>

                    {/* Total stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                                {totalScore}/{maxPossibleScore}
                            </div>
                            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Total Score</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-4xl font-black text-white">
                                {averageScore}
                            </div>
                            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Avg Per Round</div>
                        </div>
                    </div>

                    <button
                        onClick={resetGame}
                        className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                    >
                        🎮 Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}

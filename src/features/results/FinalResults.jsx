import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { swarmReviewGameState } from '../../services/gemini';

export function FinalResults() {
    const { roundScores, roundSubmissions, maxRounds, resetGame, personality } = useGame();
    const [swarmReview, setSwarmReview] = useState(null);
    const [loadingReview, setLoadingReview] = useState(true);

    const totalScore = roundScores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = maxRounds * 10;
    const averageScore = roundScores.length > 0 ? (totalScore / roundScores.length).toFixed(1) : 0;

    useEffect(() => {
        async function fetchReview() {
            setLoadingReview(true);
            const review = await swarmReviewGameState(roundScores, roundSubmissions, personality);
            setSwarmReview(review);
            setLoadingReview(false);
        }
        fetchReview();
    }, []);

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
                                <div className="text-[10px] text-white/40 truncate italic">"{roundSubmissions[index]}"</div>
                            </div>
                        ))}
                    </div>

                    {/* Swarm Critique Section */}
                    <div className="mb-8 p-6 rounded-2xl bg-black/40 border border-purple-500/30 text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <span className="text-4xl">🐝</span>
                        </div>
                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            Swarm Critique Consensus
                        </h3>

                        {loadingReview ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                <div className="h-20 bg-white/5 rounded w-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-[10px] text-white/30 uppercase mb-1">UX Researcher</div>
                                        <p className="text-sm text-white/80 leading-relaxed italic">"{swarmReview.researcherNotes}"</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="text-[10px] text-white/30 uppercase mb-1">Game Designer</div>
                                        <p className="text-sm text-white/80 leading-relaxed italic">"{swarmReview.designerNotes}"</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-white/90">Final Consensus</div>
                                        <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-black">GRADE: {swarmReview.swarmGrade}</div>
                                    </div>
                                    <p className="text-white/60 text-sm leading-relaxed">{swarmReview.finalSummary}</p>
                                </div>
                            </div>
                        )}
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
                        className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full btn-kinetic shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                    >
                        🎮 Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}

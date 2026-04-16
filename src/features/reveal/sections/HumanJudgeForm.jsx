import React from 'react';
import { FusionImageCard } from './FusionImageCard';

export function HumanJudgeForm({
    fusionImage,
    submission,
    humanScore,
    setHumanScore,
    humanRelevance,
    setHumanRelevance,
    humanCommentary,
    setHumanCommentary,
    onSubmit,
}) {
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl">
                <div className="glass-panel rounded-[22px] p-8 text-center max-w-2xl">
                    <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-6 border border-white/10">
                        HUMAN JUDGE
                    </div>
                    <FusionImageCard fusionImage={fusionImage} submission={submission} />

                    <form onSubmit={onSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="human-score-input" className="block text-sm font-medium text-white/60 mb-2">Score (1-10)</label>
                            <input
                                id="human-score-input"
                                type="number"
                                min="1"
                                max="10"
                                value={humanScore}
                                onChange={(e) => setHumanScore(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                placeholder="10"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="human-relevance-select" className="block text-sm font-medium text-white/60 mb-2">Relevance</label>
                            <select
                                id="human-relevance-select"
                                value={humanRelevance}
                                onChange={(e) => setHumanRelevance(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="Highly Logical">Highly Logical</option>
                                <option value="Absurdly Creative">Absurdly Creative</option>
                                <option value="Wild Card">Wild Card</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="human-commentary-textarea" className="block text-sm font-medium text-white/60 mb-2">Commentary</label>
                            <textarea
                                id="human-commentary-textarea"
                                value={humanCommentary}
                                onChange={(e) => setHumanCommentary(e.target.value)}
                                rows="3"
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                placeholder="Share your verdict..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-[1.01] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            Submit Score
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

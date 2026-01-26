import React, { useState } from 'react';
import { useSound } from '../../hooks/useSound';

export function HumanJudge({ submission, assets, onSubmit }) {
    const { playSuccess } = useSound();
    const [witScore, setWitScore] = useState(2);
    const [relevanceScore, setRelevanceScore] = useState(2);
    const [creativityScore, setCreativityScore] = useState(2);
    const [commentary, setCommentary] = useState('');

    const totalScore = witScore + relevanceScore + creativityScore;

    const handleSubmit = () => {
        playSuccess();
        onSubmit({
            witScore,
            relevanceScore,
            creativityScore,
            score: totalScore,
            relevance: totalScore >= 7 ? 'Highly Logical' : totalScore >= 4 ? 'Absurdly Creative' : 'Total Stretch',
            commentary: commentary || `A ${totalScore >= 7 ? 'brilliant' : totalScore >= 4 ? 'interesting' : 'bold'} connection between ${assets.left.label} and ${assets.right.label}!`
        });
    };

    return (
        <div className="w-full max-w-lg glass-panel p-8 rounded-3xl animate-in fade-in duration-500">
            <div className="text-center mb-6">
                <div className="inline-block px-4 py-1 rounded-full bg-emerald-600/20 text-sm font-bold tracking-widest text-emerald-400 mb-4 border border-emerald-600/30">
                    👤 HUMAN JUDGE
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Rate This Connection</h2>
                <p className="text-white/60 italic">"{submission}"</p>
            </div>

            <div className="space-y-6 mb-8">
                {/* Wit Score */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-cyan-400">Wit</label>
                        <span className="text-lg font-bold text-white">{witScore}/3</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        value={witScore}
                        onChange={(e) => setWitScore(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>Meh</span>
                        <span>Clever</span>
                        <span>Hilarious</span>
                    </div>
                </div>

                {/* Relevance Score */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-emerald-400">Relevance</label>
                        <span className="text-lg font-bold text-white">{relevanceScore}/3</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        value={relevanceScore}
                        onChange={(e) => setRelevanceScore(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>Stretch</span>
                        <span>Makes Sense</span>
                        <span>Perfect Fit</span>
                    </div>
                </div>

                {/* Creativity Score */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-pink-400">Creativity</label>
                        <span className="text-lg font-bold text-white">{creativityScore}/4</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        value={creativityScore}
                        onChange={(e) => setCreativityScore(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-400"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>Obvious</span>
                        <span>Unexpected</span>
                        <span>Genius</span>
                    </div>
                </div>

                {/* Commentary */}
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Commentary (optional)</label>
                    <textarea
                        value={commentary}
                        onChange={(e) => setCommentary(e.target.value)}
                        placeholder="Add your witty judgment..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        rows={2}
                    />
                </div>
            </div>

            {/* Total Score Preview */}
            <div className="text-center mb-6 p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                    {totalScore}/10
                </div>
                <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Total Score</div>
            </div>

            <button
                onClick={handleSubmit}
                className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                ✓ Submit Judgment
            </button>
        </div>
    );
}

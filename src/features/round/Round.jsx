import React, { useState, useEffect } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { THEMES, buildThemeAssets, getThemeById } from '../../data/themes';
import { getStats, isThemeUnlocked } from '../../services/stats';

export function Round({ onSubmit }) {
    const { setGameState, user, roundNumber, totalRounds } = useGame();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(60);
    const stats = getStats();
    const rawTheme = getThemeById(user?.themeId);
    const theme = isThemeUnlocked(rawTheme?.id, stats)
        ? rawTheme
        : getThemeById(THEMES.find((t) => isThemeUnlocked(t.id, stats))?.id) || rawTheme;
    const timeLimit = theme?.modifier?.timeLimit || 60;
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;

    useEffect(() => {
        const [left, right] = buildThemeAssets(theme, 2);
        setAssets({ left, right });
        setTimer(timeLimit);
    }, [user?.themeId, timeLimit]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        } else {
            // Time's up!
            handleSubmit();
        }
    }, [timer]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        // console.log("Submitted:", submission);
        // setGameState('REVEAL'); // Moved to parent callback potentially, or keep here but pass data

        if (onSubmit) {
            onSubmit({ submission, assets });
            setGameState('REVEAL');
        }
    };

    if (!assets.left || !assets.right) return null;

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-full flex justify-between items-center px-8 mb-4">
                <div className="text-2xl font-bold text-white/40">ROUND {roundNumber} / {totalRounds}</div>
                <div className={`text-4xl font-black font-display ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timer}s
                </div>
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
                <div className="rounded-full bg-white/10 px-3 py-1">
                    Time Limit: <span className="text-white">{timeLimit}s</span>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1">
                    Score Multiplier: <span className="text-white">x{scoreMultiplier.toFixed(2)}</span>
                </div>
                {theme?.modifier?.hint && (
                    <div className="rounded-full bg-white/10 px-3 py-1">
                        {theme.modifier.hint}
                    </div>
                )}
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                <input
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="What connects these two?"
                    className="w-full bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-full px-8 py-6 text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-2xl"
                    autoFocus
                />
                <div className="mt-4 text-center text-white/40 text-sm">
                    Press <span className="font-bold text-white">Enter</span> to submit
                </div>
            </form>
        </div>
    );
}

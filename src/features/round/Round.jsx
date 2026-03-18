import React, { useState, useEffect } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../hooks/useSound';
import { getRandomPair } from '../../data/assets';
import { getDailyPair } from '../../services/daily';

const THEME_STYLES = {
    random: { bg: 'bg-purple-900/10', glow: 'from-purple-500/20 to-cyan-500/20', focus: 'focus:border-purple-500/50 focus:ring-purple-500/20' },
    trending: { bg: 'bg-rose-900/10', glow: 'from-orange-500/20 to-rose-500/20', focus: 'focus:border-rose-500/50 focus:ring-rose-500/20' },
    nature: { bg: 'bg-emerald-900/10', glow: 'from-emerald-500/20 to-teal-500/20', focus: 'focus:border-emerald-500/50 focus:ring-emerald-500/20' },
    tech: { bg: 'bg-cyan-900/10', glow: 'from-cyan-500/20 to-blue-500/20', focus: 'focus:border-cyan-500/50 focus:ring-cyan-500/20' },
    food: { bg: 'bg-orange-900/10', glow: 'from-yellow-500/20 to-orange-500/20', focus: 'focus:border-orange-500/50 focus:ring-orange-500/20' },
    animals: { bg: 'bg-amber-900/10', glow: 'from-amber-500/20 to-yellow-500/20', focus: 'focus:border-amber-500/50 focus:ring-amber-500/20' },
    art: { bg: 'bg-fuchsia-900/10', glow: 'from-fuchsia-500/20 to-pink-500/20', focus: 'focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20' },
    valentines: { bg: 'bg-pink-900/10', glow: 'from-pink-500/20 to-rose-500/20', focus: 'focus:border-pink-500/50 focus:ring-pink-500/20' },
    stpatricks: { bg: 'bg-emerald-900/10', glow: 'from-green-500/20 to-emerald-500/20', focus: 'focus:border-emerald-500/50 focus:ring-emerald-500/20' },
    summer: { bg: 'bg-sky-900/10', glow: 'from-sky-500/20 to-yellow-500/20', focus: 'focus:border-sky-500/50 focus:ring-sky-500/20' }
};

export function Round({ onSubmit }) {
    const { setGameState, currentRound, maxRounds, assetTheme, gameMode, roundDuration, challengeData } = useGame();
    const { playTick, playSubmit } = useSound();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(roundDuration);

    useEffect(() => {
        // Pick assets based on game mode
        if (gameMode === 'challenge' && challengeData?.assets) {
            // Use the same assets from the challenge
            setAssets(challengeData.assets);
        } else if (gameMode === 'daily') {
            const daily = getDailyPair();
            if (daily) setAssets(daily.assets);
        } else {
            const pair = getRandomPair(assetTheme);
            setAssets(pair);
        }
    }, [assetTheme, gameMode, challengeData]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(t => {
                    // Play tick sound in last 10 seconds
                    if (t <= 10 && t > 0) {
                        playTick();
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        } else {
            // Time's up!
            handleSubmit();
        }
    }, [timer]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        playSubmit();

        if (onSubmit) {
            onSubmit({ submission, assets });
            setGameState('REVEAL');
        }
    };

    if (!assets.left || !assets.right) return null;

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700 relative z-10" role="main">
            {/* Ambient Background Light */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] ${THEME_STYLES[assetTheme]?.bg || THEME_STYLES.random.bg} blur-[100px] rounded-full -z-10 pointer-events-none transition-colors duration-1000`} />

            <div className="w-full flex justify-between items-center px-8 mb-4">
                <div className="text-2xl font-bold text-white/40 font-display tracking-widest" aria-label={`Round ${currentRound} of ${maxRounds}`}>
                    ROUND {currentRound} {maxRounds > 1 && <span className="text-white/20">/ {maxRounds}</span>}
                </div>
                <div
                    className={`text-5xl font-black font-display ${timer < 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white text-glow'}`}
                    aria-live="polite"
                    aria-label={`${timer} seconds remaining`}
                >
                    {timer}
                    <span className="text-2xl font-medium text-white/40 ml-1">s</span>
                </div>
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20 group" role="form">
                <label htmlFor="connection-input" className="sr-only">What connects these two images?</label>
                <div className="relative">
                    <input
                        id="connection-input"
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="What matches?"
                        className={`w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-6 text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:ring-4 transition-all shadow-2xl hover:border-white/20 ${THEME_STYLES[assetTheme]?.focus || THEME_STYLES.random.focus}`}
                        autoFocus
                        aria-describedby="submit-hint"
                        autoComplete="off"
                    />
                    {/* Input Glow Effect */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${THEME_STYLES[assetTheme]?.glow || THEME_STYLES.random.glow} blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10`} />
                </div>

                <div id="submit-hint" className="mt-6 text-center text-white/30 text-sm font-medium tracking-wide uppercase">
                    Press <span className="font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded mx-1">Enter</span> to submit
                </div>
            </form>
        </div>
    );
}

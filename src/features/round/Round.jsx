import React, { useState, useEffect } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../hooks/useSound';
import { getRandomPair } from '../../data/assets';

export function Round({ onSubmit }) {
    const { setGameState, currentRound, maxRounds, assetTheme } = useGame();
    const { playTick, playSubmit } = useSound();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        // Pick 2 random unique assets from the selected theme
        const pair = getRandomPair(assetTheme);
        setAssets(pair);
    }, [assetTheme]);

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
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700" role="main">
            <div className="w-full flex justify-between items-center px-8 mb-4">
                <div className="text-2xl font-bold text-white/40" aria-label={`Round ${currentRound} of ${maxRounds}`}>
                    ROUND {currentRound} {maxRounds > 1 && <span className="text-white/20">of {maxRounds}</span>}
                </div>
                <div
                    className={`text-4xl font-black font-display ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}
                    aria-live="polite"
                    aria-label={`${timer} seconds remaining`}
                >
                    {timer}s
                </div>
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20" role="form">
                <label htmlFor="connection-input" className="sr-only">What connects these two images?</label>
                <input
                    id="connection-input"
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="What connects these two?"
                    className="w-full bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-full px-8 py-6 text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-2xl"
                    autoFocus
                    aria-describedby="submit-hint"
                />
                <div id="submit-hint" className="mt-4 text-center text-white/40 text-sm">
                    Press <span className="font-bold text-white">Enter</span> to submit
                </div>
            </form>
        </div>
    );
}

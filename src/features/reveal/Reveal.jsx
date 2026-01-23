import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision } from '../../services/storage';

export function Reveal({ submission, assets }) {
    const { user, setGameState } = useGame();
    const [result, setResult] = useState(null);
    const [fusionUrl, setFusionUrl] = useState(null);
    const [status, setStatus] = useState('Judging...');
    const savedRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        async function processRound() {
            if (savedRef.current) return;

            // 1. Score
            setStatus("Gemini is judging your wit...");
            const scoreResult = await scoreSubmission(submission, assets.left, assets.right);
            if (!mounted) return;
            setResult(scoreResult);

            // 2. Generate Image
            setStatus("Dreaming up the fusion...");
            const url = await generateFusionImage(submission);
            if (!mounted) return;
            setFusionUrl(url);
            setStatus("Complete");

            // 3. Save
            if (!savedRef.current) {
                saveCollision({
                    submission,
                    imageUrl: url,
                    score: scoreResult.score,
                    commentary: scoreResult.commentary
                });
                savedRef.current = true;
            }
        }

        processRound();
        return () => { mounted = false; };
    }, [submission, assets]);

    const handleNext = () => {
        setGameState('LOBBY'); // Loop back to lobby for now
    };

    if (!result || !fusionUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-8" />
                <h2 className="text-3xl font-display font-bold text-white mb-2 animate-pulse">{status}</h2>
                <p className="text-white/40 italic">"{submission}"</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl">
                <div className="glass-panel rounded-[22px] p-8 text-center max-w-2xl">
                    <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-6 border border-white/10">
                        WINNER ANNOUNCEMENT
                    </div>

                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/20">
                        <img src={fusionUrl} alt="Fusion" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 text-left">
                            <div className="text-white/60 text-sm uppercase tracking-wider">Concept</div>
                            <div className="text-2xl font-bold text-white">{submission}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                                {result.score}/10
                            </div>
                            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Wit Score</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <div className="text-lg font-bold text-white/90">
                                {result.relevance}
                            </div>
                        </div>
                    </div>

                    <blockquote className="text-xl italic text-white/80 font-serif mb-8 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
                        "{result.commentary}"
                        <footer className="text-xs text-white/40 not-italic mt-2">— Gemini AI Host</footer>
                    </blockquote>

                    <button
                        onClick={handleNext}
                        className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}

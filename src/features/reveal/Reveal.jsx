import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision } from '../../services/storage';
import { useSound } from '../../hooks/useSound';
import { HumanJudge } from './HumanJudge';
import { AnimatedScore, AnimatedTotalScore } from '../../components/AnimatedScore';
import { ShareButton } from '../../components/ShareButton';

export function Reveal({ submission, assets }) {
    const { user, setGameState, recordRoundScore, nextRound, currentRound, maxRounds, judgeMode, currentStreak } = useGame();
    const { playReveal } = useSound();
    const [result, setResult] = useState(null);
    const [fusionUrl, setFusionUrl] = useState(null);
    const [status, setStatus] = useState('Judging...');
    const [waitingForHuman, setWaitingForHuman] = useState(judgeMode === 'human');
    const savedRef = useRef(false);
    const scoredRef = useRef(false);
    const soundPlayedRef = useRef(false);

    useEffect(() => {
        // If human judge, wait for their input before processing
        if (judgeMode === 'human') return;

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

            // 3. Save to gallery
            if (!savedRef.current) {
                saveCollision({
                    submission,
                    imageUrl: url,
                    score: scoreResult.score,
                    commentary: scoreResult.commentary
                });
                savedRef.current = true;
            }

            // 4. Record score for multi-round tracking
            if (!scoredRef.current) {
                recordRoundScore(scoreResult.score);
                scoredRef.current = true;
            }

            // 5. Play reveal sound
            if (!soundPlayedRef.current) {
                playReveal();
                soundPlayedRef.current = true;
            }
        }

        processRound();
        return () => { mounted = false; };
    }, [submission, assets, judgeMode]);

    const handleHumanJudgment = async (humanResult) => {
        setWaitingForHuman(false);
        setResult(humanResult);
        setStatus("Dreaming up the fusion...");

        // Generate fusion image even for human judge
        const url = await generateFusionImage(submission);
        setFusionUrl(url);
        setStatus("Complete");

        // Save to gallery
        saveCollision({
            submission,
            imageUrl: url,
            score: humanResult.score,
            commentary: humanResult.commentary
        });

        // Record score for multi-round tracking
        recordRoundScore(humanResult.score);
        playReveal();
    };

    const handleNext = () => {
        if (currentRound < maxRounds) {
            nextRound();
        } else {
            setGameState('FINAL_RESULTS');
        }
    };

    // Show human judge UI if waiting for human input
    if (waitingForHuman) {
        return <HumanJudge submission={submission} assets={assets} onSubmit={handleHumanJudgment} />;
    }

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
                    <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold tracking-widest mb-6 border ${judgeMode === 'human'
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                        : 'bg-white/10 text-white/80 border-white/10'
                        }`}>
                        {judgeMode === 'human' ? '👤 HUMAN JUDGMENT' : '🤖 AI JUDGMENT'}
                    </div>

                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/20">
                        <img src={fusionUrl} alt="Fusion" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 text-left">
                            <div className="text-white/60 text-sm uppercase tracking-wider">Concept</div>
                            <div className="text-2xl font-bold text-white">{submission}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-8">
                        <AnimatedScore value={result.witScore || 0} max={3} color="text-cyan-400" label="Wit" delay={0} />
                        <AnimatedScore value={result.relevanceScore || 0} max={3} color="text-emerald-400" label="Relevance" delay={100} />
                        <AnimatedScore value={result.creativityScore || 0} max={4} color="text-pink-400" label="Creativity" delay={200} />
                        <AnimatedTotalScore value={result.score || 0} delay={300} />
                    </div>

                    {currentStreak >= 2 && (
                        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold animate-pulse">
                            🔥 {currentStreak} Streak!
                        </div>
                    )}

                    <blockquote className="text-xl italic text-white/80 font-serif mb-8 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
                        "{result.commentary}"
                        <footer className="text-xs text-white/40 not-italic mt-2">
                            — {judgeMode === 'human' ? 'Human Judge' : 'Gemini AI Host'}
                        </footer>
                    </blockquote>

                    <div className="flex gap-4 items-center justify-center flex-wrap">
                        <ShareButton submission={submission} score={result.score} fusionUrl={fusionUrl} />
                        <button
                            onClick={handleNext}
                            className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                        >
                            {currentRound < maxRounds ? '➡️ Next Round' : '🏆 See Results'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

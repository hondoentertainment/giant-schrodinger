import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision, submitDailyScore } from '../../services/storage';
import { submitChallengerResult } from '../../services/challenge';
import { useSound } from '../../hooks/useSound';
import { HumanJudge } from './HumanJudge';
import { AnimatedScore, AnimatedTotalScore } from '../../components/AnimatedScore';
import { ShareButton } from '../../components/ShareButton';
import { ChallengeButton } from '../../components/ChallengeButton';
import { ImageWithLoader } from '../../components/ImageWithLoader';

export function Reveal({ submission, assets }) {
    const { user, setGameState, recordRoundScore, nextRound, currentRound, maxRounds, judgeMode, currentStreak, gameMode, challengeData, resetGame, personality } = useGame();
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
            const scoreResult = await scoreSubmission(submission, assets.left, assets.right, personality);
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

                // Submit to Daily Leaderboard if applicable
                if (gameMode === 'daily') {
                    const today = new Date().toISOString().split('T')[0];
                    submitDailyScore(today, scoreResult.score, submission);
                }

                // Submit to challenge if in challenge mode
                if (gameMode === 'challenge' && challengeData?.id) {
                    submitChallengerResult(challengeData.id, scoreResult.score, submission, user);
                }

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
        if (gameMode === 'challenge') {
            // In challenge mode, go straight to final results
            setGameState('FINAL_RESULTS');
        } else if (currentRound < maxRounds) {
            nextRound();
        } else {
            setGameState('FINAL_RESULTS');
        }
    };

    // Determine if player won the challenge
    const getChallengeVerdict = () => {
        if (!challengeData?.creator || !result) return null;
        const myScore = result.score;
        const theirScore = challengeData.creator.score;
        if (myScore > theirScore) return { text: 'YOU WIN!', color: 'from-green-400 to-emerald-600', emoji: '🏆' };
        if (myScore < theirScore) return { text: 'THEY WIN', color: 'from-red-400 to-rose-600', emoji: '😤' };
        return { text: 'TIE GAME!', color: 'from-yellow-400 to-amber-600', emoji: '🤝' };
    };

    const verdict = gameMode === 'challenge' ? getChallengeVerdict() : null;

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

                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/20 bg-black/40 group">
                        {fusionUrl ? (
                            <>
                                <ImageWithLoader
                                    src={fusionUrl}
                                    alt="Fusion"
                                    containerClassName="w-full h-full"
                                    className="scale-100 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-6 left-6 text-left pointer-events-none">
                                    <div className="text-white/60 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-yellow-400"></span> Concept
                                    </div>
                                    <div className="text-2xl font-bold text-white mt-1 drop-shadow-md">{submission}</div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse" />

                                <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin mb-4" />
                                <div className="text-white/60 font-medium animate-pulse">Dreaming up image...</div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-8">
                        <AnimatedScore value={result.witScore || 0} max={3} color="text-cyan-400" label="Wit" delay={0} />
                        <AnimatedScore value={result.relevanceScore || 0} max={3} color="text-emerald-400" label="Relevance" delay={100} />
                        <AnimatedScore value={result.creativityScore || 0} max={4} color="text-pink-400" label="Creativity" delay={200} />
                        <AnimatedTotalScore value={result.score || 0} delay={300} />
                    </div>

                    {/* Challenge Comparison */}
                    {gameMode === 'challenge' && challengeData?.creator && verdict && (
                        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className={`text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r ${verdict.color}`}>
                                {verdict.emoji} {verdict.text}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                    <div className="text-2xl mb-1">{challengeData.creator.avatar}</div>
                                    <div className="text-white/60 text-sm">{challengeData.creator.name}</div>
                                    <div className="text-3xl font-bold text-white">{challengeData.creator.score}/10</div>
                                    <div className="text-white/40 text-xs mt-1 truncate">"{challengeData.creator.submission}"</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                    <div className="text-2xl mb-1">{user?.avatar || '👤'}</div>
                                    <div className="text-white/60 text-sm">You</div>
                                    <div className="text-3xl font-bold text-white">{result.score}/10</div>
                                    <div className="text-white/40 text-xs mt-1 truncate">"{submission}"</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Regular streak display (not in challenge mode) */}
                    {gameMode !== 'challenge' && currentStreak >= 2 && (
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
                        {/* Show Challenge button only in non-challenge modes */}
                        {gameMode !== 'challenge' && (
                            <ChallengeButton
                                assets={assets}
                                score={result.score}
                                submission={submission}
                                userProfile={user}
                            />
                        )}
                        <button
                            onClick={gameMode === 'challenge' ? resetGame : handleNext}
                            className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full btn-kinetic shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                        >
                            {gameMode === 'challenge'
                                ? '🏠 Back to Lobby'
                                : (currentRound < maxRounds ? '➡️ Next Round' : '🏆 See Results')}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

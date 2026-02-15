import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision } from '../../services/storage';
import { recordPlay } from '../../services/stats';
import { createJudgeShareUrl } from '../../services/share';
import { saveSharedRound } from '../../services/backend';
import { getThemeById } from '../../data/themes';

export function Reveal({ submission, assets }) {
    const { setGameState, user, completeRound, roundNumber, totalRounds } = useGame();
    const { toast } = useToast();
    const [result, setResult] = useState(null);
    const [fusionImage, setFusionImage] = useState(null);
    const [status, setStatus] = useState('Preparing...');
    const [humanScore, setHumanScore] = useState('');
    const [humanRelevance, setHumanRelevance] = useState('Highly Logical');
    const [humanCommentary, setHumanCommentary] = useState('');
    const [savedCollision, setSavedCollision] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const savedRef = useRef(false);
    const scoringMode = user?.scoringMode || 'ai';
    const theme = getThemeById(user?.themeId);
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;

    useEffect(() => {
        let mounted = true;

        async function processRound() {
            if (savedRef.current) return;

            if (scoringMode === 'ai') {
                // 1. Score
                setStatus("Gemini is judging your wit...");
                const scoreResult = await scoreSubmission(submission, assets.left, assets.right);
                if (!mounted) return;
                if (scoreResult.isMock) {
                    toast.warn(scoreResult.errorReason || 'AI unavailable — using mock scoring');
                }
                const finalScore = Math.min(10, Math.max(1, Math.round(scoreResult.score * scoreMultiplier)));
                const resultPayload = {
                    ...scoreResult,
                    finalScore,
                    scoreMultiplier,
                };
                setResult(resultPayload);

                // 2. Generate Image
                setStatus("Dreaming up the fusion...");
                const image = await generateFusionImage(theme, submission);
                if (!mounted) return;
                if (image.isFallback && image.errorReason) {
                    toast.info(image.errorReason);
                }
                setFusionImage(image);
                setStatus("Complete");

                // 3. Save
                if (!savedRef.current) {
                    const collision = saveCollision({
                        submission,
                        imageUrl: image.url,
                        fallbackImageUrl: image.fallbackUrl,
                        score: finalScore,
                        baseScore: scoreResult.score,
                        breakdown: scoreResult.breakdown,
                        commentary: scoreResult.commentary,
                        themeId: theme?.id,
                        scoringMode,
                        roundNumber,
                        totalRounds,
                        scoreMultiplier,
                    });
                    setSavedCollision(collision);
                    recordPlay();
                    savedRef.current = true;
                }
                completeRound({ score: finalScore, baseScore: scoreResult.score, breakdown: scoreResult.breakdown });
            } else {
                // Human scoring path
                setStatus("Dreaming up the fusion...");
                const image = await generateFusionImage(theme, submission);
                if (!mounted) return;
                if (image.isFallback && image.errorReason) {
                    toast.info(image.errorReason);
                }
                setFusionImage(image);
                setStatus("Awaiting score");
            }
        }

        processRound();
        return () => { mounted = false; };
    }, [submission, assets, scoringMode, theme?.id, scoreMultiplier]);

    const handleNext = () => {
        setGameState('LOBBY');
    };

    const handleShareForJudging = async () => {
        if (!savedCollision || !assets?.left || !assets?.right) return;
        const roundPayload = {
            assets: { left: assets.left, right: assets.right },
            submission,
            imageUrl: fusionImage?.url,
            shareFrom: user?.name || 'A friend',
            collisionId: savedCollision.id,
        };
        const backendId = await saveSharedRound(roundPayload);
        if (!backendId) {
            toast.warn('Backend unavailable — sharing via link encoding');
        }
        const payload = backendId
            ? { backendId, ...roundPayload }
            : { roundId: savedCollision.id, ...roundPayload };
        const url = createJudgeShareUrl(payload);
        if (url && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            toast.success('Share link copied to clipboard!');
            setTimeout(() => setShareCopied(false), 2500);
        } else {
            toast.error('Could not copy link — try again');
        }
    };

    const handleHumanScore = (e) => {
        e.preventDefault();
        const scoreValue = Number(humanScore);
        if (!Number.isFinite(scoreValue) || scoreValue < 1 || scoreValue > 10) return;
        const finalScore = Math.min(10, Math.max(1, Math.round(scoreValue * scoreMultiplier)));
        const scoreResult = {
            score: finalScore,
            baseScore: scoreValue,
            relevance: humanRelevance,
            commentary: humanCommentary.trim() || 'No comment provided.',
            scoreMultiplier,
        };
        setResult(scoreResult);
        setStatus("Complete");

        if (fusionImage?.url && !savedRef.current) {
            const collision = saveCollision({
                submission,
                imageUrl: fusionImage.url,
                fallbackImageUrl: fusionImage.fallbackUrl,
                score: finalScore,
                baseScore: scoreValue,
                commentary: scoreResult.commentary,
                themeId: theme?.id,
                scoringMode,
                roundNumber,
                totalRounds,
                scoreMultiplier,
            });
            setSavedCollision(collision);
            recordPlay();
            savedRef.current = true;
        }
        completeRound({ score: finalScore, baseScore: scoreValue });
    };

    if (!fusionImage) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-8" />
                <h2 className="text-3xl font-display font-bold text-white mb-2 animate-pulse">{status}</h2>
                <p className="text-white/40 italic">&ldquo;{submission}&rdquo;</p>
            </div>
        );
    }

    if (scoringMode === 'human' && !result) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl">
                    <div className="glass-panel rounded-[22px] p-8 text-center max-w-2xl">
                        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-6 border border-white/10">
                            HUMAN JUDGE
                        </div>
                        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/20">
                            <img
                                src={fusionImage.url}
                                alt="Fusion"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                data-fallback={fusionImage.fallbackUrl}
                                onError={(event) => {
                                    const fallback = event.currentTarget.dataset.fallback;
                                    if (fallback && event.currentTarget.src !== fallback) {
                                        event.currentTarget.src = fallback;
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 text-left">
                                <div className="text-white/60 text-sm uppercase tracking-wider">Concept</div>
                                <div className="text-2xl font-bold text-white">{submission}</div>
                            </div>
                        </div>

                        <form onSubmit={handleHumanScore} className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Score (1-10)</label>
                                <input
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
                                <label className="block text-sm font-medium text-white/60 mb-2">Relevance</label>
                                <select
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
                                <label className="block text-sm font-medium text-white/60 mb-2">Commentary</label>
                                <textarea
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

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl">
                <div className="glass-panel rounded-[22px] p-8 text-center max-w-2xl">
                    <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-6 border border-white/10">
                        WINNER ANNOUNCEMENT
                    </div>

                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/20">
                        <img
                            src={fusionImage.url}
                            alt="Fusion"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            data-fallback={fusionImage.fallbackUrl}
                            onError={(event) => {
                                const fallback = event.currentTarget.dataset.fallback;
                                if (fallback && event.currentTarget.src !== fallback) {
                                    event.currentTarget.src = fallback;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 text-left">
                            <div className="text-white/60 text-sm uppercase tracking-wider">Concept</div>
                            <div className="text-2xl font-bold text-white">{submission}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                                {result.finalScore || result.score}/10
                            </div>
                            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Final Score</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <div className="text-lg font-bold text-white/90">
                                {result.relevance}
                            </div>
                        </div>
                    </div>
                    {result.breakdown && (
                        <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-white/70">
                            <div className="rounded-xl bg-white/5 border border-white/10 p-3">Wit: <span className="text-white">{result.breakdown.wit}/10</span></div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-3">Logic: <span className="text-white">{result.breakdown.logic}/10</span></div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-3">Originality: <span className="text-white">{result.breakdown.originality}/10</span></div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-3">Clarity: <span className="text-white">{result.breakdown.clarity}/10</span></div>
                        </div>
                    )}
                    <div className="mb-6 text-sm text-white/50">
                        Theme multiplier applied: <span className="text-white">x{scoreMultiplier.toFixed(2)}</span>
                    </div>

                    <blockquote className="text-xl italic text-white/80 font-serif mb-8 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
                        &ldquo;{result.commentary}&rdquo;
                        <footer className="text-xs text-white/40 not-italic mt-2">
                            — {scoringMode === 'human' ? 'Human Judge' : 'Gemini AI Host'}
                        </footer>
                    </blockquote>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={handleShareForJudging}
                            disabled={!savedCollision}
                            className="px-8 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50"
                        >
                            {shareCopied ? 'Link copied!' : 'Share for judging'}
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                        >
                            {roundNumber >= totalRounds ? 'Back to Lobby' : 'Next Round Setup'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

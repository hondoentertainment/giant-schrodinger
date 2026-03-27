import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision } from '../../services/storage';
import { recordPlay, getStats } from '../../services/stats';
import { createJudgeShareUrl } from '../../services/share';
import { createChallenge, createChallengeUrl } from '../../services/challenges';
import { submitScore, getPlayerRank, submitSeasonalScore } from '../../services/leaderboard';
import { playScoreReveal, playConfetti as playConfettiSound } from '../../services/sounds';
import { trackEvent } from '../../services/analytics';
import { autoSaveHighlight } from '../../services/highlights';
import { getConnectionExplanation } from '../../services/aiFeatures';
import { ShareCardCanvas } from '../../components/ShareCardCanvas';
import { checkAchievements } from '../../services/achievements';
import { AchievementProgress } from '../../components/AchievementProgress';
import { addCoins, addBattlePassXp } from '../../services/shop';
import { saveSharedRound } from '../../services/backend';
import { addToOfflineQueue } from '../../services/offlineQueue';
import { getThemeById, buildThemeAssets, MEDIA_TYPES } from '../../data/themes';
import { getScoreBand } from '../../lib/scoreBands';
import { MilestoneCelebration } from '../../components/MilestoneCelebration';
import Confetti from '../../components/Confetti';
import SocialShareButtons from '../../components/SocialShareButtons';
import { haptic } from '../../lib/haptics';
import { TIMINGS } from '../../lib/timings';

export function Reveal({ submission, assets }) {
    const { setGameState, user, completeRound, roundNumber, totalRounds, currentModifier, nextRound, sessionResults, isDailyChallenge } = useGame();
    const { toast } = useToast();
    const [result, setResult] = useState(null);
    const [fusionImage, setFusionImage] = useState(null);
    const [status, setStatus] = useState('Preparing...');
    const [humanScore, setHumanScore] = useState('');
    const [humanRelevance, setHumanRelevance] = useState('Highly Logical');
    const [humanCommentary, setHumanCommentary] = useState('');
    const [savedCollision, setSavedCollision] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [challengeCopied, setChallengeCopied] = useState(false);
    const [newlyUnlocked, setNewlyUnlocked] = useState([]);
    const [processError, setProcessError] = useState(null);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showComeback, setShowComeback] = useState(false);
    const [comebackData, setComebackData] = useState(null);
    const [playerRank, setPlayerRank] = useState(null);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [shaking, setShaking] = useState(false);
    const [rolling, setRolling] = useState(false);
    const [scoringError, setScoringError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [announceScore, setAnnounceScore] = useState('');
    const [scoreAnimationDone, setScoreAnimationDone] = useState(false);
    const savedRef = useRef(false);
    const soundPlayedRef = useRef(false);
    const comebackCheckedRef = useRef(false);
    const scoringMode = user?.scoringMode || 'human';
    const theme = getThemeById(user?.themeId);
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;
    const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
    const mod = currentModifier;

    // Shared post-save logic for both AI and human scoring paths
    const finalizeCollision = (collisionData, finalScore) => {
        const collision = saveCollision(collisionData);
        setSavedCollision(collision);
        autoSaveHighlight(collision);
        addCoins(finalScore, 'round_complete');
        addBattlePassXp(finalScore * 10);
        const { newlyUnlocked: unlocked } = recordPlay();
        if (unlocked?.length) setNewlyUnlocked(unlocked);
        try { checkAchievements({ score: finalScore }); } catch {}
        savedRef.current = true;
        return collision;
    };

    // Animate score rolling up from 0 with requestAnimationFrame
    useEffect(() => {
        if (!result) return;
        const finalScore = result.finalScore || result.score;
        if (!finalScore) return;
        setRolling(true);
        const duration = 800;
        const start = performance.now();
        let raf;

        function animate(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setAnimatedScore(Math.round(eased * finalScore * 10) / 10);

            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            } else {
                setAnimatedScore(finalScore);
                setRolling(false);
                setScoreAnimationDone(true);
                // Trigger screen shake on perfect 10
                if (finalScore >= 10) {
                    setShaking(true);
                    setTimeout(() => setShaking(false), 400);
                }
            }
        }
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [result]);

    // Detect comeback: current score >= 9 AND previous round score < 4
    useEffect(() => {
        if (!result || comebackCheckedRef.current) return;
        comebackCheckedRef.current = true;
        const currentScore = result.finalScore || result.score;
        if (currentScore >= 9 && sessionResults && sessionResults.length > 0) {
            const prevScore = sessionResults[sessionResults.length - 1]?.score;
            if (prevScore != null && prevScore < 4) {
                setComebackData({ prevScore, currentScore });
                setShowComeback(true);
                playConfettiSound();
                setShowConfetti(true);
            }
        }
    }, [result, sessionResults]);

    // Auto-dismiss comeback overlay after 2 seconds
    useEffect(() => {
        if (!showComeback) return;
        const timer = setTimeout(() => setShowComeback(false), 2000);
        return () => clearTimeout(timer);
    }, [showComeback]);

    // Screen reader score announcement
    useEffect(() => {
        if (result && scoreAnimationDone) {
            const score = result.finalScore || result.score;
            const breakdown = result.breakdown;
            let announcement = `Your score is ${score} out of 10.`;
            if (breakdown) {
                announcement += ` Wit: ${breakdown.wit}. Logic: ${breakdown.logic}. Originality: ${breakdown.originality}. Clarity: ${breakdown.clarity}.`;
            }
            if (score >= 9) announcement += ' Amazing connection!';
            else if (score >= 7) announcement += ' Great work!';
            setAnnounceScore(announcement);
        }
    }, [result, scoreAnimationDone]);

    // Play sound and confetti after score animation completes
    useEffect(() => {
        if (!result || soundPlayedRef.current) return;
        const score = result.finalScore || result.score;
        soundPlayedRef.current = true;
        // Delay sound to sync with animation end (~1.5s)
        const soundTimer = setTimeout(() => {
            playScoreReveal(score);
            if (score >= 9) {
                setShowConfetti(true);
                playConfettiSound();
            }
        }, 1400);
        // Submit to leaderboard
        if (user?.name) {
            submitScore(user.name, score, user.avatar, roundNumber);
            submitSeasonalScore(user.name, score, user.avatar);
            const rank = getPlayerRank(user.name);
            if (rank) setPlayerRank(rank);
        }
        trackEvent('round_complete', { score, scoringMode, roundNumber });
        return () => clearTimeout(soundTimer);
    }, [result]);

    // After scoring completes, preload next round's assets
    useEffect(() => {
        if (!result || roundNumber >= totalRounds) return;

        // Build next round's assets (same logic as Round.jsx)
        const nextTheme = getThemeById(user?.themeId);
        const nextAssets = buildThemeAssets(nextTheme, 2, mediaType);

        // Preload each image
        nextAssets.forEach(asset => {
            if (asset?.url) {
                const img = new Image();
                img.src = asset.url;
            }
        });
    }, [result]);

    useEffect(() => {
        let mounted = true;
        setProcessError(null);

        async function processRound() {
            if (savedRef.current) return;

            try {
                if (scoringMode === 'ai') {
                    setStatus("Gemini is judging your wit...");
                    const scoreResult = await scoreSubmission(submission, assets.left, assets.right, mediaType);
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

                    setStatus("Dreaming up the fusion...");
                    const image = await generateFusionImage(theme, submission);
                    if (!mounted) return;
                    if (image.isFallback && image.errorReason) {
                        toast.info(image.errorReason);
                    }
                    setFusionImage(image);
                    setStatus("Complete");

                    if (!savedRef.current) {
                        finalizeCollision({
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
                        }, finalScore);
                    }
                    completeRound({ score: finalScore, baseScore: scoreResult.score, breakdown: scoreResult.breakdown });
                } else {
                    setStatus("Dreaming up the fusion...");
                    const image = await generateFusionImage(theme, submission);
                    if (!mounted) return;
                    if (image.isFallback && image.errorReason) {
                        toast.info(image.errorReason);
                    }
                    setFusionImage(image);
                    setStatus("Awaiting score");
                }
            } catch (err) {
                if (mounted) {
                    console.error('Reveal processRound failed:', err);
                    setScoringError({
                        message: 'Scoring failed — your submission is saved locally',
                        errorId: `err-${Date.now().toString(36)}`,
                    });
                    addToOfflineQueue({ submission, assets, mediaType });
                    setProcessError(err?.message || 'Something went wrong');
                }
            }
        }

        processRound();
        return () => { mounted = false; };
    }, [submission, assets, scoringMode, theme?.id, scoreMultiplier, retryTrigger]);

    const handleNext = () => {
        haptic('light');
        nextRound();
    };

    // Keyboard shortcut: S to share for judging
    useEffect(() => {
        if (!result || !savedCollision) return;
        const onKey = (e) => {
            if (e.key === 's' || e.key === 'S') {
                const target = e.target;
                if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
                e.preventDefault();
                handleShareForJudging();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [result, savedCollision]);

    const handleShareForJudging = async () => {
        if (!savedCollision || !assets?.left || !assets?.right) return;
        const roundPayload = {
            assets: { left: assets.left, right: assets.right },
            submission,
            imageUrl: fusionImage?.url,
            shareFrom: user?.name || 'A friend',
            collisionId: savedCollision.id,
        };
        const url = await createJudgeShareUrl(roundPayload);
        if (url && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            haptic('success');
            setShareCopied(true);
            trackEvent('share_click', { type: 'judge' });
            toast.success('Link copied — send to a friend and they\'ll score your connection!');
            setTimeout(() => setShareCopied(false), TIMINGS.TOAST_DISMISS);
        } else {
            toast.error('Could not copy link — try again');
        }
    };

    const handleChallengeShare = async () => {
        if (!savedCollision || !assets?.left || !assets?.right) return;
        const challenge = createChallenge({
            assets: { left: assets.left, right: assets.right },
            submission,
            score: result.finalScore || result.score,
            playerName: user?.name || 'Anonymous',
            themeId: theme?.id,
        });
        const url = createChallengeUrl(challenge);
        if (url && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            haptic('success');
            setChallengeCopied(true);
            trackEvent('challenge_sent', { score: result.finalScore || result.score });
            toast.success(`Challenge link copied! Your friend will try to beat your ${result.finalScore || result.score}/10.`);
            setTimeout(() => setChallengeCopied(false), TIMINGS.TOAST_DISMISS);
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
            finalizeCollision({
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
            }, finalScore);
        }
        completeRound({ score: finalScore, baseScore: scoreValue });
    };

    if (processError) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="text-6xl mb-4" role="img" aria-hidden="true">⚠️</div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-white/60 text-sm mb-6 max-w-sm">{processError}</p>
                <button
                    onClick={() => {
                        setProcessError(null);
                        savedRef.current = false;
                        setRetryTrigger((t) => t + 1);
                    }}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!fusionImage) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-8" aria-hidden="true" />
                <h2 id="reveal-status" className="text-3xl font-display font-bold text-white mb-2 animate-pulse" role="status" aria-live="polite">
                    {status}
                </h2>
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
                        <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-2xl ring-1 ring-white/20">
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

    const scoreBand = result && getScoreBand(result.finalScore || result.score);
    const finalScoreDisplay = result.finalScore || result.score;
    const stats = getStats();

    return (
        <div className={`w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700 ${shaking ? 'screen-shake' : ''}`}>
            {showComeback && comebackData && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-in zoom-in-95 duration-500">
                    <div className="text-7xl mb-4 animate-bounce">&#x1F525;</div>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                        COMEBACK KID!
                    </h2>
                    <p className="text-white/60 text-lg">
                        From {comebackData.prevScore}/10 &rarr; {comebackData.currentScore}/10
                    </p>
                </div>
            )}
            <Confetti active={showConfetti} duration={4000} particleCount={comebackData ? 120 : 60} />
            {newlyUnlocked.length > 0 && (
                <MilestoneCelebration
                    newlyUnlocked={newlyUnlocked}
                    onDismiss={() => setNewlyUnlocked([])}
                />
            )}

            {/* Screen reader score announcement */}
            <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
                {announceScore}
            </div>

            {/* Screen reader achievement announcement */}
            {newlyUnlocked?.length > 0 && (
                <div className="sr-only" role="alert">
                    Achievement unlocked: {newlyUnlocked.map(a => a.name || a.label || a.id).join(', ')}
                </div>
            )}

            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl">
                <div className="glass-panel rounded-[22px] p-4 sm:p-8 text-center max-w-2xl">
                    <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-4 sm:mb-6 border border-white/10">
                        YOUR SCORE
                    </div>

                    {/* Error state with retry */}
                    {scoringError && (
                        <div className="w-full max-w-md p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                            <div className="text-red-300 font-semibold mb-1">{scoringError.message}</div>
                            <div className="text-white/40 text-xs mb-3">Error ID: {scoringError.errorId}</div>
                            <button
                                onClick={async () => {
                                    setRetrying(true);
                                    setScoringError(null);
                                    try {
                                        const retryResult = await scoreSubmission(submission, assets.left, assets.right, mediaType);
                                        const finalScore = Math.min(10, Math.max(1, Math.round(retryResult.score * scoreMultiplier)));
                                        const resultPayload = {
                                            ...retryResult,
                                            finalScore,
                                            scoreMultiplier,
                                        };
                                        setResult(resultPayload);
                                        setProcessError(null);
                                        if (!savedRef.current) {
                                            finalizeCollision({
                                                submission,
                                                imageUrl: fusionImage?.url,
                                                fallbackImageUrl: fusionImage?.fallbackUrl,
                                                score: finalScore,
                                                baseScore: retryResult.score,
                                                breakdown: retryResult.breakdown,
                                                commentary: retryResult.commentary,
                                                themeId: theme?.id,
                                                scoringMode,
                                                roundNumber,
                                                totalRounds,
                                                scoreMultiplier,
                                            }, finalScore);
                                        }
                                        completeRound({ score: finalScore, baseScore: retryResult.score, breakdown: retryResult.breakdown });
                                    } catch {
                                        setScoringError({ message: 'Still unable to score. Using offline mode.', errorId: scoringError.errorId });
                                    }
                                    setRetrying(false);
                                }}
                                disabled={retrying}
                                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition"
                            >
                                {retrying ? 'Retrying...' : 'Retry Scoring'}
                            </button>
                        </div>
                    )}

                    <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-2xl ring-1 ring-white/20">
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

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${scoreBand?.color || 'from-yellow-300 to-amber-600'} transition-all`}>
                                {Math.round(animatedScore)}/10
                            </div>
                            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">
                                {scoreBand?.label || 'Final Score'}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <div className="text-lg font-bold text-white/90">
                                {result.relevance}
                            </div>
                        </div>
                    </div>

                    {/* Achievement progress */}
                    {!rolling && (
                        <div className="flex justify-center mb-4 animate-in fade-in duration-500">
                            <AchievementProgress score={finalScoreDisplay} stats={user?.stats} />
                        </div>
                    )}

                    {/* Percentile rank */}
                    {playerRank && playerRank.total > 0 && (
                        <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 animate-in fade-in duration-500">
                            <div className="text-sm font-bold text-purple-300">
                                Top {Math.max(1, Math.round(100 - playerRank.percentile))}% today!
                            </div>
                            <div className="text-white/40 text-xs">
                                Rank #{playerRank.rank} of {playerRank.total} players
                            </div>
                        </div>
                    )}

                    {result.breakdown && (
                        <>
                            <p className="text-white/50 text-xs mb-2">Your connection was scored on:</p>
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-white/70">
                                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Wit: <span className="text-white">{result.breakdown.wit}/10</span></div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Logic: <span className="text-white">{result.breakdown.logic}/10</span></div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Originality: <span className="text-white">{result.breakdown.originality}/10</span></div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Clarity: <span className="text-white">{result.breakdown.clarity}/10</span></div>
                            </div>
                        </>
                    )}
                    {scoreMultiplier !== 1 && (
                        <div className="mb-6 text-sm text-white/50">
                            Base {(result.baseScore ?? result.score)?.toFixed(1)} × {scoreMultiplier.toFixed(2)} = <span className="text-white">{finalScoreDisplay}/10</span>
                        </div>
                    )}

                    <blockquote className="text-xl italic text-white/80 font-serif mb-8 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
                        &ldquo;{result.commentary}&rdquo;
                        <footer className="text-xs text-white/40 not-italic mt-2">
                            — {scoringMode === 'human' ? 'Human Judge' : 'Gemini AI Host'}
                        </footer>
                    </blockquote>

                    {/* Connection Explanation */}
                    {result && assets?.left?.label && assets?.right?.label && (
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                            <div className="text-blue-300 text-xs uppercase tracking-wider font-bold mb-2">Why this score?</div>
                            <p className="text-white/70 text-sm leading-relaxed">
                                {getConnectionExplanation(submission, result.finalScore || result.score, assets.left.label, assets.right.label)}
                            </p>
                        </div>
                    )}

                    {/* Score coaching tips */}
                    {result?.breakdown && (
                        <div className="mt-3 space-y-1">
                            {result.breakdown.wit < 4 && (
                                <p className="text-purple-300 text-xs">Tip: Try wordplay or puns -- clever language boosts wit scores</p>
                            )}
                            {result.breakdown.originality < 4 && (
                                <p className="text-purple-300 text-xs">Tip: Think sideways -- unexpected connections score higher on originality</p>
                            )}
                            {result.breakdown.logic < 4 && (
                                <p className="text-purple-300 text-xs">Tip: Make the connection clearer -- the thread between concepts needs to be obvious</p>
                            )}
                            {result.breakdown.clarity < 4 && (
                                <p className="text-purple-300 text-xs">Tip: Keep it simple -- one sentence, one idea scores better for clarity</p>
                            )}
                            {(result.score || result.finalScore) >= 8 && (
                                <p className="text-green-300 text-xs">Great work! Your connection shows strong creative thinking</p>
                            )}
                        </div>
                    )}

                    {/* Visual Share Card */}
                    {savedCollision && (
                        <div className="mb-6">
                            <ShareCardCanvas
                                submission={submission}
                                score={finalScoreDisplay}
                                leftLabel={assets?.left?.label}
                                rightLabel={assets?.right?.label}
                                fusionImageUrl={fusionImage?.url}
                                playerName={user?.name}
                            />
                        </div>
                    )}

                    {/* Social sharing */}
                    {savedCollision && (
                        <div className="mb-6">
                            <SocialShareButtons
                                shareData={{
                                    submission,
                                    score: finalScoreDisplay,
                                    scoreBand: scoreBand?.label,
                                    commentary: result.commentary,
                                    assets,
                                }}
                                imageUrl={fusionImage?.url}
                                onToast={(type, msg) => toast[type]?.(msg)}
                            />
                        </div>
                    )}

                    {/* Challenge a friend */}
                    {savedCollision && (
                        <button
                            onClick={handleChallengeShare}
                            className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-all text-center group"
                        >
                            <div className="text-lg font-bold text-amber-300 group-hover:scale-105 transition-transform">
                                {challengeCopied ? 'Challenge link copied!' : `Challenge a friend to beat your ${finalScoreDisplay}/10!`}
                            </div>
                            <div className="text-white/40 text-xs mt-1">
                                They&apos;ll play the same concepts and try to outscore you
                            </div>
                        </button>
                    )}

                    {/* Post-reveal retention hooks */}
                    {result && (
                        <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-white/50 text-xs uppercase tracking-wider font-bold mb-3">Keep Going</div>
                            <div className="space-y-2">
                                {/* Battle pass XP */}
                                {(() => {
                                    const xpGained = (result.finalScore || result.score || 0) * 10;
                                    return (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-purple-400">&#11088;</span>
                                            <span className="text-white/70">+{xpGained} XP earned this round</span>
                                        </div>
                                    );
                                })()}

                                {/* Streak status */}
                                {stats?.currentStreak > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-orange-400">&#128293;</span>
                                        <span className="text-white/70">Day {stats.currentStreak} streak — play tomorrow to keep it!</span>
                                    </div>
                                )}

                                {/* Daily challenge prompt */}
                                {!isDailyChallenge && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-amber-400">&#128197;</span>
                                        <span className="text-white/70">Daily challenge available — try it for 1.5x bonus!</span>
                                    </div>
                                )}

                                {/* Rounds remaining */}
                                {roundNumber < totalRounds && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-cyan-400">&#127919;</span>
                                        <span className="text-white/70">{totalRounds - roundNumber} round{totalRounds - roundNumber > 1 ? 's' : ''} left in this session</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Round modifier result */}
                    {mod && mod.id === 'doubleOrNothing' && (
                        <div className={`mb-6 p-4 rounded-2xl border text-center animate-in zoom-in-95 duration-500 ${
                            finalScoreDisplay >= (mod.scoreThreshold || 7)
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                        }`}>
                            <div className="text-2xl mb-1">
                                {finalScoreDisplay >= (mod.scoreThreshold || 7) ? '🎲 DOUBLED!' : '🎲 BUST!'}
                            </div>
                            <div className="text-white/60 text-sm">
                                {finalScoreDisplay >= (mod.scoreThreshold || 7)
                                    ? `Scored ${finalScoreDisplay}+ — your points are doubled!`
                                    : `Needed ${mod.scoreThreshold || 7}+ to keep your points.`}
                            </div>
                        </div>
                    )}

                    {mod && mod.id === 'showdown' && (
                        <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center animate-in zoom-in-95 duration-500">
                            <div className="text-2xl mb-1">🏆 Final Showdown Complete!</div>
                            <div className="text-white/60 text-sm">2x points applied to your final round.</div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <div>
                            <button
                                onClick={handleShareForJudging}
                                disabled={!savedCollision}
                                className="px-8 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50"
                                title="Send this link to a friend — they'll score your connection. Press S for shortcut."
                            >
                                {shareCopied ? 'Link copied! Send to a friend' : 'Share for friend to judge'}
                            </button>
                            <p className="text-white/30 text-xs mt-1.5">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/50">S</kbd> to copy link</p>
                        </div>
                        <button
                            onClick={handleNext}
                            className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                        >
                            {roundNumber >= totalRounds ? 'See Results' : 'Next Round →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

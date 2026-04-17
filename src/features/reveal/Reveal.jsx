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
import { trackEvent, trackFunnel } from '../../services/analytics';
import { autoSaveHighlight } from '../../services/highlights';
import { ShareCardCanvas } from '../../components/ShareCardCanvas';
import { checkAchievements } from '../../services/achievements';
import { AchievementProgress } from '../../components/AchievementProgress';
import { addCoins, addBattlePassXp } from '../../services/shop';
import { addToOfflineQueue } from '../../services/offlineQueue';
import { getThemeById, buildThemeAssets, MEDIA_TYPES } from '../../data/themes';
import { getScoreBand } from '../../lib/scoreBands';
import { MilestoneCelebration } from '../../components/MilestoneCelebration';
import Confetti from '../../components/Confetti';
import SocialShareButtons from '../../components/SocialShareButtons';
import { haptic } from '../../lib/haptics';
import { TIMINGS } from '../../lib/timings';
import { ContextualTip } from '../../components/ContextualTip';
import { FusionImageCard } from './sections/FusionImageCard';
import { ScoreBreakdownGrid } from './sections/ScoreBreakdownGrid';
import { RetentionHooksPanel } from './sections/RetentionHooksPanel';
import { ModifierResultBanner } from './sections/ModifierResultBanner';
import { CoachingTips } from './sections/CoachingTips';
import { HumanJudgeForm } from './sections/HumanJudgeForm';
import { ScoreRollupDisplay } from './sections/ScoreRollupDisplay';
import { ComebackOverlay } from './sections/ComebackOverlay';
import { ConnectionExplanation } from './sections/ConnectionExplanation';
import { ChallengeFriendButton } from './sections/ChallengeFriendButton';
import { CommentaryBlockquote } from './sections/CommentaryBlockquote';
import { PercentileRankBadge } from './sections/PercentileRankBadge';
import { ScoringErrorBanner } from './sections/ScoringErrorBanner';
import { ProcessErrorView } from './sections/ProcessErrorView';
import { ShareActionsRow } from './sections/ShareActionsRow';

export function Reveal({ submission, assets }) {
    const { user, completeRound, roundNumber, totalRounds, currentModifier, nextRound, sessionResults, isDailyChallenge } = useGame();
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
        try { checkAchievements({ score: finalScore }); } catch { /* achievement tracking is best-effort */ }
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
                trackFunnel('first_score_revealed');
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

    // Reset comeback check when round changes so it can trigger each round
    useEffect(() => {
        comebackCheckedRef.current = false;
    }, [roundNumber]);

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
        // Submit to leaderboard (tracks best single-round score, not session averages)
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

    const handleRetryScoring = async () => {
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
            setScoringError({ message: 'Still unable to score. Using offline mode.', errorId: scoringError?.errorId });
        }
        setRetrying(false);
    };

    if (processError) {
        return (
            <ProcessErrorView
                processError={processError}
                onRetry={() => {
                    setProcessError(null);
                    savedRef.current = false;
                    setRetryTrigger((t) => t + 1);
                }}
            />
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
            <HumanJudgeForm
                fusionImage={fusionImage}
                submission={submission}
                humanScore={humanScore}
                setHumanScore={setHumanScore}
                humanRelevance={humanRelevance}
                setHumanRelevance={setHumanRelevance}
                humanCommentary={humanCommentary}
                setHumanCommentary={setHumanCommentary}
                onSubmit={handleHumanScore}
            />
        );
    }

    const scoreBand = result && getScoreBand(result.finalScore || result.score);
    const finalScoreDisplay = result.finalScore || result.score;
    const stats = getStats();

    return (
        <div className={`w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700 ${shaking ? 'screen-shake' : ''}`}>
            {showComeback && <ComebackOverlay comebackData={comebackData} />}
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
                    <ScoringErrorBanner
                        scoringError={scoringError}
                        retrying={retrying}
                        onRetry={handleRetryScoring}
                    />

                    <FusionImageCard fusionImage={fusionImage} submission={submission} />

                    <ScoreRollupDisplay
                        animatedScore={animatedScore}
                        scoreBand={scoreBand}
                        relevance={result.relevance}
                    />

                    {/* Achievement progress */}
                    {!rolling && (
                        <div className="flex justify-center mb-4 animate-in fade-in duration-500">
                            <AchievementProgress score={finalScoreDisplay} stats={user?.stats} />
                        </div>
                    )}

                    {/* Percentile rank */}
                    <PercentileRankBadge playerRank={playerRank} />

                    <ScoreBreakdownGrid breakdown={result.breakdown} />
                    {scoreMultiplier !== 1 && (
                        <div className="mb-6 text-sm text-white/50">
                            Base {(result.baseScore ?? result.score)?.toFixed(1)} × {scoreMultiplier.toFixed(2)} = <span className="text-white">{finalScoreDisplay}/10</span>
                        </div>
                    )}

                    <CommentaryBlockquote commentary={result.commentary} scoringMode={scoringMode} />

                    {/* Connection Explanation */}
                    <ConnectionExplanation result={result} submission={submission} assets={assets} />

                    {/* Score coaching tips */}
                    <CoachingTips result={result} />

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
                        <ChallengeFriendButton
                            onClick={handleChallengeShare}
                            challengeCopied={challengeCopied}
                            finalScoreDisplay={finalScoreDisplay}
                        />
                    )}

                    {/* Post-reveal retention hooks */}
                    <RetentionHooksPanel
                        result={result}
                        stats={stats}
                        isDailyChallenge={isDailyChallenge}
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                    />

                    {/* Round modifier result */}
                    <ModifierResultBanner mod={mod} finalScoreDisplay={finalScoreDisplay} />

                    {/* Contextual tip */}
                    <div className="mb-4">
                        <ContextualTip context="reveal" totalRounds={getStats().totalRounds} />
                    </div>

                    <ShareActionsRow
                        onShareForJudging={handleShareForJudging}
                        shareCopied={shareCopied}
                        savedCollision={savedCollision}
                        onNext={handleNext}
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                    />
                </div>
            </div>
        </div>
    );
}

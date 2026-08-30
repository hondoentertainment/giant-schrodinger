import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { scoreSubmission, generateFusionImage } from '../../services/gemini';
import { saveCollision, updateCollision } from '../../services/storage';
import { getMilestones, getStats, recordPlay } from '../../services/stats';
import { createJudgeShareLinks } from '../../services/share';
import { getThemeById } from '../../data/themes';
import { normalizeMediaType, getCollisionMediaMode, getEffectiveRoundMediaType } from '../../lib/mediaType';
import { getDailyChallenge } from '../../services/dailyChallenge';
import { getScoreBand } from '../../lib/scoreBands';
import { getScoreCoach } from '../../lib/scoreCoach';
import { consumeJudgeChain, peekJudgeChain, setForcedLine, setForcedPair } from '../../lib/forcedPair';
import { MilestoneCelebration } from '../../components/MilestoneCelebration';
import { AchievementProgress } from '../../components/AchievementProgress';
import { ScoreReveal } from '../../components/ScoreReveal';
import SocialShareButtons from '../../components/SocialShareButtons';
import { haptic } from '../../lib/haptics';
import { playScoreReveal } from '../../services/sounds';
import { reportAppError, reportAppEvent } from '../../lib/telemetry';
import { checkAchievements } from '../../services/achievements';
import { scrollMainToTop } from '../../lib/scroll';

export function Reveal({ submission, assets }) {
    const { user, completeRound, roundNumber, totalRounds, currentModifier, nextRound, replayCurrentRound, isDailyChallenge } = useGame();
    const { toast } = useToast();
    const [result, setResult] = useState(null);
    const [fusionImage, setFusionImage] = useState(null);
    const [status, setStatus] = useState('Preparing...');
    const [humanScore, setHumanScore] = useState('');
    const [humanRelevance, setHumanRelevance] = useState('Highly Logical');
    const [humanCommentary, setHumanCommentary] = useState('');
    const [savedCollision, setSavedCollision] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [shareLinks, setShareLinks] = useState(null);
    const [newlyUnlocked, setNewlyUnlocked] = useState([]);
    const [processError, setProcessError] = useState(null);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [secondChanceUsed, setSecondChanceUsed] = useState(false);
    const fromJudgeChain = peekJudgeChain();
    const savedRef = useRef(false);
    const scoringMode = user?.scoringMode || 'human';
    const theme = getThemeById(user?.themeId);
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;
    const mediaType = normalizeMediaType(user?.mediaType);
    const mod = currentModifier;
    // Friend Judge can open as soon as fusion + prompts exist (draft collision on share)
    const canShareForJudging = Boolean(fusionImage?.url && assets?.left && assets?.right);

    // Lobby → Round → Reveal: always open this screen at the top
    useLayoutEffect(() => {
        scrollMainToTop();
    }, [submission, assets?.left?.id, assets?.right?.id]);

    useEffect(() => {
        if (result || fusionImage) scrollMainToTop();
    }, [result, fusionImage]);

    const savedMediaType = getCollisionMediaMode({
        mediaType: getEffectiveRoundMediaType({
            userMediaType: mediaType,
            isDailyChallenge,
            dailyChallenge: isDailyChallenge ? getDailyChallenge() : null,
        }),
        assets: {
            left: assets?.left,
            right: assets?.right,
        },
    });
    const savedAssetPair = {
        left: {
            id: assets?.left?.id,
            label: assets?.left?.label || assets?.left?.title || assets?.left?.name || 'Left prompt',
            type: assets?.left?.type,
        },
        right: {
            id: assets?.right?.id,
            label: assets?.right?.label || assets?.right?.title || assets?.right?.name || 'Right prompt',
            type: assets?.right?.type,
        },
    };

    useEffect(() => {
        let mounted = true;
        setProcessError(null);

        async function processRound() {
            if (savedRef.current) return;

            try {
                if (scoringMode === 'ai') {
                    // 1. Score
                    setStatus("Gemini is judging your wit...");
                    const scoreResult = await scoreSubmission(submission, assets.left, assets.right, mediaType);
                    if (!mounted) return;
                    if (scoreResult.isMock) {
                        reportAppEvent('ai_mock_score_fallback', {
                            reason: scoreResult.errorReason || 'AI scoring unavailable',
                            mediaType,
                            themeId: theme?.id || null,
                        });
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
                    const image = await generateFusionImage(theme, submission, assets.left, assets.right);
                    if (!mounted) return;
                    if (image.isFallback && image.errorReason) {
                        reportAppEvent('fusion_image_fallback', {
                            reason: image.errorReason,
                            themeId: theme?.id || null,
                        });
                        toast.info(image.errorReason);
                    }
                    setFusionImage(image);
                    setStatus("Complete");

                    // 3. Save
                    let collision = savedCollision;
                    if (!savedRef.current) {
                        collision = saveCollision({
                            submission,
                            imageUrl: image.url,
                            fallbackImageUrl: image.fallbackUrl,
                            score: finalScore,
                            baseScore: scoreResult.score,
                            breakdown: scoreResult.breakdown,
                            commentary: scoreResult.commentary,
                            assets: savedAssetPair,
                            judgeMode: scoringMode,
                            isDailyChallenge,
                            themeId: theme?.id,
                            scoringMode,
                            roundNumber,
                            totalRounds,
                            scoreMultiplier,
                            mediaType: savedMediaType,
                        });
                        setSavedCollision(collision);
                        const { stats: updatedStats = getStats(), newlyUnlocked: unlocked } = recordPlay(finalScore, {
                            isDailyChallenge,
                            themeId: theme?.id,
                        });
                        if (unlocked?.length) setNewlyUnlocked(unlocked);
                        const achievements = checkAchievements({
                            score: finalScore,
                            isSpeedRound: mod?.id === 'speed',
                            isDoubleOrNothing: mod?.id === 'doubleOrNothing',
                            previousScore: null,
                            stats: updatedStats,
                            sessionRoundCount: roundNumber,
                        }) || [];
                        achievements.forEach((achievement) => {
                            toast.success(`Achievement unlocked: ${achievement.name}`);
                        });
                        savedRef.current = true;
                        createJudgeShareLinks({
                            assets: { left: assets.left, right: assets.right },
                            submission,
                            imageUrl: image.url,
                            shareFrom: user?.name || 'A friend',
                            collisionId: collision?.id || null,
                            judgeMode: 'friend',
                        }).then((links) => {
                            if (mounted && links) setShareLinks(links);
                        }).catch(() => {});
                    }
                    completeRound({
                        score: finalScore,
                        baseScore: scoreResult.score,
                        breakdown: scoreResult.breakdown,
                        collisionId: collision?.id,
                        judgeMode: scoringMode,
                        submission,
                        assets: savedAssetPair,
                    });
                } else {
                    // Human scoring path
                    setStatus("Dreaming up the fusion...");
                    const image = await generateFusionImage(theme, submission, assets.left, assets.right);
                    if (!mounted) return;
                    if (image.isFallback && image.errorReason) {
                        reportAppEvent('fusion_image_fallback', {
                            reason: image.errorReason,
                            themeId: theme?.id || null,
                        });
                        toast.info(image.errorReason);
                    }
                    setFusionImage(image);
                    setStatus("Awaiting score");
                }
            } catch (err) {
                if (mounted) {
                    console.error('Reveal processRound failed:', err);
                    reportAppError('reveal_process_round', err, {
                        scoringMode,
                        mediaType,
                        themeId: theme?.id || null,
                    });
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

    useEffect(() => {
        if (!result) return;
        const score = result.finalScore ?? result.score;
        if (Number.isFinite(score)) {
            playScoreReveal(score);
            haptic('success');
        }
        if (Number.isFinite(score) && score >= 8) {
            reportAppEvent('high_score_share_prompt_shown', {
                score,
                roundNumber,
                scoringMode,
            });
        }
    }, [result, roundNumber, scoringMode]);

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
    }, [result, savedCollision]); // handleShareForJudging is stable enough for this use

    const ensureDraftCollision = () => {
        if (savedCollision?.id) return savedCollision;
        if (!fusionImage?.url || !assets?.left || !assets?.right) return null;
        const draft = saveCollision({
            submission,
            imageUrl: fusionImage.url,
            fallbackImageUrl: fusionImage.fallbackUrl,
            score: null,
            pendingFriendJudge: true,
            commentary: '',
            themeId: theme?.id,
            scoringMode,
            assets: savedAssetPair,
            judgeMode: 'friend',
            isDailyChallenge,
            roundNumber,
            totalRounds,
            scoreMultiplier,
            mediaType: savedMediaType,
        });
        setSavedCollision(draft);
        return draft;
    };

    const handleShareForJudging = async () => {
        if (!canShareForJudging) return;
        const draft = ensureDraftCollision();
        let links = shareLinks;
        if (!links?.shareUrl) {
            const roundPayload = {
                assets: { left: assets.left, right: assets.right },
                submission,
                imageUrl: fusionImage?.url,
                shareFrom: user?.name || 'A friend',
                collisionId: draft?.id || savedCollision?.id || null,
                judgeMode: 'friend',
            };
            links = await createJudgeShareLinks(roundPayload);
            if (links) setShareLinks(links);
        }
        const url = links?.shareUrl;
        reportAppEvent('friend_judge_share_created', {
            hasSavedCollision: Boolean(draft?.id || savedCollision?.id),
            scoringMode,
            roundNumber,
            hasOgPreview: Boolean(links?.previewUrl && links.previewUrl !== url),
        });
        if (url?.includes('#judge_')) {
            toast.warn('Backend unavailable — sharing via link encoding');
        }
        if (!url) {
            toast.error('Could not create share link — try again');
            return;
        }

        const highlightScore = result?.finalScore ?? result?.score;
        const shareText = Number.isFinite(highlightScore)
            ? `Score my ${highlightScore}/10 Venn — open the link and give it 1–10.`
            : 'Score my Venn connection — open the link and give it 1–10.';
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                await navigator.share({
                    title: 'Judge my Venn connection',
                    text: shareText,
                    url,
                });
                haptic('success');
                setShareCopied(true);
                toast.success('Share sheet opened — send it to a friend!');
                setTimeout(() => setShareCopied(false), 2500);
                return;
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            haptic('success');
            setShareCopied(true);
            toast.success('Link copied — send to a friend and they\'ll score your connection!');
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

        let collision = savedCollision;
        if (fusionImage?.url && !savedRef.current) {
            const scoredPayload = {
                submission,
                imageUrl: fusionImage.url,
                fallbackImageUrl: fusionImage.fallbackUrl,
                score: finalScore,
                baseScore: scoreValue,
                commentary: scoreResult.commentary,
                themeId: theme?.id,
                scoringMode,
                assets: savedAssetPair,
                judgeMode: scoringMode,
                pendingFriendJudge: false,
                isDailyChallenge,
                roundNumber,
                totalRounds,
                scoreMultiplier,
                mediaType: savedMediaType,
            };
            if (savedCollision?.id) {
                collision = updateCollision(savedCollision.id, scoredPayload) || {
                    ...savedCollision,
                    ...scoredPayload,
                };
            } else {
                collision = saveCollision(scoredPayload);
            }
            setSavedCollision(collision);
            const { stats: updatedStats = getStats(), newlyUnlocked: unlocked } = recordPlay(finalScore, {
                isDailyChallenge,
                themeId: theme?.id,
            });
            if (unlocked?.length) setNewlyUnlocked(unlocked);
            const achievements = checkAchievements({
                score: finalScore,
                isSpeedRound: mod?.id === 'speed',
                isDoubleOrNothing: mod?.id === 'doubleOrNothing',
                previousScore: null,
                stats: updatedStats,
                sessionRoundCount: roundNumber,
            }) || [];
            achievements.forEach((achievement) => {
                toast.success(`Achievement unlocked: ${achievement.name}`);
            });
            savedRef.current = true;
            createJudgeShareLinks({
                assets: { left: assets.left, right: assets.right },
                submission,
                imageUrl: fusionImage.url,
                shareFrom: user?.name || 'A friend',
                collisionId: collision?.id || null,
                judgeMode: 'friend',
            }).then((links) => {
                if (links) setShareLinks(links);
            }).catch(() => {});
        }
        completeRound({
            score: finalScore,
            baseScore: scoreValue,
            collisionId: collision?.id,
            judgeMode: scoringMode,
            submission,
            assets: savedAssetPair,
        });
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
                    className="wordle-button wordle-primary"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!fusionImage) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="h-24 w-24 rounded-full border-2 border-t-game-accent border-white/10 animate-spin mb-8" aria-hidden="true" />
                <h2 id="reveal-status" className="text-3xl font-display font-bold text-white mb-2 animate-pulse" role="status" aria-live="polite">
                    {status}
                </h2>
                <p className="text-white/40 italic">&ldquo;{submission}&rdquo;</p>
            </div>
        );
    }

    if (scoringMode === 'human' && !result) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
                <div className="wordle-card p-6 sm:p-8 text-center max-w-2xl w-full">
                        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white/55 mb-6 border border-white/10 bg-white/[0.06]">
                            Human judge
                        </div>
                        <p className="text-white/60 text-sm mb-6">
                            Score it yourself now, or copy a link and let a friend be the judge.
                        </p>
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
                                    className="game-input"
                                    placeholder="10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Relevance</label>
                                <select
                                    value={humanRelevance}
                                    onChange={(e) => setHumanRelevance(e.target.value)}
                                    className="game-input"
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
                                    className="game-input"
                                    placeholder="Share your verdict..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="wordle-button wordle-primary w-full text-lg"
                            >
                                Submit Score
                            </button>
                        </form>
                        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4 text-left">
                            <p className="text-white font-semibold">Or skip self-score</p>
                            <p className="text-white/50 text-sm mt-1">
                                Send a Friend Judge link now — they score asynchronously while you keep playing.
                            </p>
                            <button
                                type="button"
                                onClick={handleShareForJudging}
                                disabled={!canShareForJudging}
                                className="wordle-button w-full mt-3 disabled:opacity-50"
                            >
                                {shareCopied ? 'Friend judge link copied!' : 'Ask a friend to judge'}
                            </button>
                        </div>
                </div>
            </div>
        );
    }

    const displayScore = result?.finalScore || result?.score || 0;
    const isFinalRound = roundNumber >= totalRounds;
    const scoreBand = result && getScoreBand(displayScore);
    const scoreCoach = result && getScoreCoach({
        score: displayScore,
        breakdown: result.breakdown,
        isMock: result.isMock,
        submission,
        leftLabel: assets?.left?.label,
        rightLabel: assets?.right?.label,
        rewrite: result.rewrite,
    });
    const statsSnapshot = getStats();
    const nextMilestone = getMilestones()
        .filter((milestone) => !statsSnapshot.milestonesUnlocked.includes(milestone.id))
        .map((milestone) => {
            const value = milestone.type === 'rounds' ? statsSnapshot.totalRounds : statsSnapshot.currentStreak;
            return {
                ...milestone,
                value,
                remaining: Math.max(0, milestone.threshold - value),
            };
        })
        .sort((a, b) => a.remaining - b.remaining)[0];
    const recommendedNextAction = isFinalRound
        ? {
            label: 'Review your session summary',
            detail: 'Compare every round, then jump into the gallery or start a new run.',
        }
        : displayScore >= 8
        ? {
            label: `Send this ${displayScore}/10 to a friend`,
            detail: 'A Friend Judge scores it in about 10 seconds while you keep playing.',
        }
        : {
            label: 'Keep momentum with the next round',
            detail: `Round ${roundNumber + 1} is ready. Build on this idea while it is fresh.`,
        };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
            {newlyUnlocked.length > 0 && (
                <MilestoneCelebration
                    newlyUnlocked={newlyUnlocked}
                    onDismiss={() => setNewlyUnlocked([])}
                />
            )}
            <div className="wordle-card animate-spring-in">
                <div className="p-5 sm:p-8 text-center max-w-2xl">
                    <div className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wide text-white/55 mb-6 rounded-full border border-white/10 bg-white/[0.06]">
                        Puzzle result
                    </div>

                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-[28px] overflow-hidden mb-8 shadow-game-card ring-1 ring-white/15">
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

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className={`wordle-tile min-h-[104px] flex-col ${displayScore >= 8 ? 'wordle-tile-correct' : displayScore >= 5 ? 'wordle-tile-present' : 'wordle-tile-filled'}`}>
                            <ScoreReveal score={displayScore} label={scoreBand?.label || 'Final Score'} />
                        </div>
                        <div className="wordle-tile wordle-tile-filled min-h-[104px] p-3">
                            <div className="text-lg font-bold text-white/90">
                                {result.relevance}
                            </div>
                        </div>
                    </div>
                    {result.breakdown && (
                        <>
                            <p className="text-white/50 text-xs mb-2">Your connection was scored on:</p>
                            <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-white/80">
                                <div className="wordle-tile min-h-[48px] p-2">Wit: <span className="text-white">{result.breakdown.wit}/10</span></div>
                                <div className="wordle-tile min-h-[48px] p-2">Logic: <span className="text-white">{result.breakdown.logic}/10</span></div>
                                <div className="wordle-tile min-h-[48px] p-2">Originality: <span className="text-white">{result.breakdown.originality}/10</span></div>
                                <div className="wordle-tile min-h-[48px] p-2">Clarity: <span className="text-white">{result.breakdown.clarity}/10</span></div>
                            </div>
                        </>
                    )}
                    {scoreMultiplier !== 1 && (
                        <div className="mb-6 text-sm text-white/50">
                            Base {(result.baseScore ?? result.score)?.toFixed(1)} × {scoreMultiplier.toFixed(2)} = <span className="text-white">{displayScore}/10</span>
                        </div>
                    )}

                    <blockquote className="text-xl italic text-white/80 font-serif mb-4 border-l-4 border-game-accent pl-4 py-2 bg-white/[0.04] rounded-r-2xl">
                        &ldquo;{result.commentary}&rdquo;
                        <footer className="text-xs text-white/40 not-italic mt-2">
                            — {scoringMode === 'human' ? 'Human Judge' : result.isMock ? 'Practice score' : 'Gemini AI Host'}
                        </footer>
                    </blockquote>
                    {scoreCoach && (
                        <div className="mb-8 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-left" data-testid="score-coach">
                            {scoreCoach.practice && (
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80 mb-1">
                                    Practice score
                                </div>
                            )}
                            <p className="text-white font-semibold">{scoreCoach.reason}</p>
                            <p className="text-white/55 text-sm mt-1">Try this: {scoreCoach.hint}</p>
                            {!secondChanceUsed && scoreCoach.hint && (
                                <button
                                    type="button"
                                    className="wordle-button wordle-primary w-full mt-3 min-h-[44px]"
                                    onClick={() => {
                                        setForcedPair(assets);
                                        setForcedLine(scoreCoach.hint);
                                        setSecondChanceUsed(true);
                                        replayCurrentRound?.();
                                    }}
                                >
                                    Say it like that
                                </button>
                            )}
                        </div>
                    )}

                    {/* Social sharing */}
                    {savedCollision && (
                        <div className="mb-6">
                            <SocialShareButtons
                                shareData={{
                                    submission,
                                    score: displayScore,
                                    scoreBand: scoreBand?.label,
                                    commentary: result.commentary,
                                    assets,
                                    judgeMode: scoringMode,
                                    isDailyChallenge,
                                    previewUrl: shareLinks?.previewUrl,
                                    surface: 'reveal',
                                }}
                                imageUrl={fusionImage?.url}
                                onToast={(type, msg) => toast[type]?.(msg)}
                            />
                        </div>
                    )}

                    {/* Round modifier result */}
                    {mod && mod.id === 'doubleOrNothing' && (
                        <div className={`mb-6 p-4 rounded-2xl border text-center animate-in zoom-in-95 duration-500 ${
                            (result.finalScore || result.score) >= (mod.scoreThreshold || 7)
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                        }`}>
                            <div className="text-2xl mb-1">
                                {(result.finalScore || result.score) >= (mod.scoreThreshold || 7) ? '🎲 DOUBLED!' : '🎲 BUST!'}
                            </div>
                            <div className="text-white/60 text-sm">
                                {(result.finalScore || result.score) >= (mod.scoreThreshold || 7)
                                    ? `Scored ${result.finalScore || result.score}+ — your points are doubled!`
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

                    <div
                        className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
                        aria-labelledby="reveal-workflow-title"
                    >
                        <div id="reveal-workflow-title" className="game-section-label mb-3">
                            What&apos;s next
                        </div>
                        <div className="mb-4 rounded-[22px] border border-amber-400/20 bg-amber-400/10 p-3">
                            <div className="game-section-label text-amber-200/70 mb-1 normal-case tracking-normal text-[10px]">
                                Recommended next move
                            </div>
                            <div className="text-white font-semibold">{recommendedNextAction.label}</div>
                            <div className="text-white/55 text-sm mt-1">{recommendedNextAction.detail}</div>
                            {(displayScore >= 8 || fromJudgeChain) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        consumeJudgeChain();
                                        handleShareForJudging();
                                    }}
                                    disabled={!canShareForJudging}
                                    className="wordle-button wordle-primary w-full mt-3 disabled:opacity-50"
                                >
                                    {shareCopied
                                        ? 'Link copied! Send to a friend'
                                        : fromJudgeChain
                                            ? 'Send this pair to someone else'
                                            : 'Ask a friend to judge'}
                                </button>
                            )}
                        </div>
                        <ol className="space-y-2 text-sm text-white/70">
                            <li className="flex gap-3">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-200">1</span>
                                <span>{savedCollision ? 'Saved to your gallery for later sharing and review.' : 'Generated and ready to save after scoring completes.'}</span>
                            </li>
                            {displayScore < 8 && (
                                <li className="flex gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">2</span>
                                    <span>Optional: copy a friend judge link if you want an outside score.</span>
                                </li>
                            )}
                            <li className="flex gap-3">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">{displayScore >= 8 ? '2' : '3'}</span>
                                <span>{isFinalRound ? 'Open your session summary to choose the next run.' : `Continue to round ${roundNumber + 1} when you are ready.`}</span>
                            </li>
                        </ol>
                        <div className="space-y-2 text-sm text-white/70 mt-4">
                            <p>
                                {isFinalRound
                                    ? 'Review your session results, then share your best connection or start a fresh run.'
                                    : `Round ${roundNumber + 1} is ready when you are.`}
                            </p>
                            {nextMilestone && (
                                <p>
                                    {nextMilestone.remaining === 0
                                        ? `${nextMilestone.label} is ready to unlock.`
                                        : `${nextMilestone.remaining} more ${nextMilestone.type === 'rounds' ? 'rounds' : 'streak days'} to unlock ${nextMilestone.label}.`}
                                </p>
                            )}
                            {statsSnapshot.currentStreak > 0 && (
                                <p>Day {statsSnapshot.currentStreak} streak: come back tomorrow to keep it alive.</p>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 flex justify-center">
                        <AchievementProgress score={displayScore} stats={statsSnapshot} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {displayScore >= 8 ? (
                            <button
                                onClick={handleNext}
                                className="wordle-button px-12 text-lg"
                            >
                                {isFinalRound ? 'See Results' : 'Next Round →'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleNext}
                                    className="wordle-button wordle-primary px-12 text-lg"
                                >
                                    {isFinalRound ? 'See Results' : 'Next Round →'}
                                </button>
                                <div>
                                    <button
                                        onClick={handleShareForJudging}
                                        disabled={!canShareForJudging}
                                        className="wordle-button px-8 disabled:opacity-50"
                                        title="Send this link to a friend — they'll score your connection. Press S for shortcut."
                                    >
                                        {shareCopied ? 'Link copied! Send to a friend' : 'Share for friend to judge'}
                                    </button>
                                    <p className="text-white/30 text-xs mt-1.5">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/50">S</kbd> to copy link</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



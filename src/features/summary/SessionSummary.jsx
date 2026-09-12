import React, { useMemo, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { getScoreBand } from '../../lib/scoreBands';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgementForCollision } from '../../services/judgements';
import { getStats, getStreakStatus } from '../../services/stats';
import { getDailyChallengeHistory, getDailyChallengeSummary, hasDailyChallengeBeenPlayed } from '../../services/dailyChallenge';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { haptic } from '../../lib/haptics';
import { playConfetti } from '../../services/sounds';
import { trackEvent } from '../../services/analytics';
import { LINK_COPIED_MESSAGE, shareOrCopy } from '../../lib/shareOrCopy';
import { markFirstSessionCelebrated, shouldCelebrateFirstSession } from '../../lib/firstSession';
import { getSessionPlayCta, SessionNextActions } from './SessionNextActions';

function RoundCard({ result, index, feedback }) {
    const mod = result.modifier;
    const score = result.score || 0;
    const band = getScoreBand(score);
    const isSpecial = mod && mod.id !== 'normal';

    return (
        <div
            className="game-list-row animate-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold shrink-0">
                {isSpecial ? mod.icon : index + 1}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">Round {index + 1}</span>
                    {isSpecial && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold">
                            {mod.label}
                        </span>
                    )}
                </div>
                {result.submission && (
                    <div className="text-white/75 text-sm mt-0.5 truncate italic">&ldquo;{result.submission}&rdquo;</div>
                )}
                {result.breakdown && (
                    <div className="text-white/30 text-xs mt-0.5">
                        W:{result.breakdown.wit} L:{result.breakdown.logic} O:{result.breakdown.originality} C:{result.breakdown.clarity}
                    </div>
                )}
                {feedback && (
                    <div className="text-white/50 text-xs mt-1">
                        Friend feedback: {feedback.judgeName || 'A friend'} gave it {feedback.score}/10
                    </div>
                )}
            </div>
            <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${band?.color || 'from-slate-400 to-slate-500'}`}>
                {score}
            </div>
        </div>
    );
}

function getRetentionCopy({ streakStatus, currentStreak, isDailyChallenge, dailyPlayed }) {
    if (streakStatus === 'at_risk' && currentStreak > 0) {
        return `Day ${currentStreak} streak is at risk — play today to keep it alive.`;
    }
    if (currentStreak > 0 && streakStatus === 'active_today') {
        return `Day ${currentStreak} streak is alive. Come back tomorrow to keep it.`;
    }
    if (isDailyChallenge || dailyPlayed) {
        return "Come back for tomorrow's pair.";
    }
    return null;
}

export function SessionSummary() {
    const { sessionResults, sessionScore, totalRounds, endSession, isDailyChallenge, setGameState, startSession, beginRound } = useGame();
    const { toast } = useToast();
    const [feedbackByCollision, setFeedbackByCollision] = useState({});
    const [shareCopied, setShareCopied] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const playerStats = useMemo(() => getStats(), []);
    const streakStatus = useMemo(() => getStreakStatus(playerStats), [playerStats]);
    const dailyHistory = useMemo(() => getDailyChallengeHistory(), []);
    const dailySummary = useMemo(() => getDailyChallengeSummary(), []);
    const dailyPlayed = useMemo(() => hasDailyChallengeBeenPlayed() || isDailyChallenge, [isDailyChallenge]);
    const isFirstSessionComplete = useMemo(
        () => shouldCelebrateFirstSession({
            totalRoundsPlayed: playerStats.totalRounds,
            sessionRoundCount: sessionResults.length || totalRounds,
        }),
        [playerStats.totalRounds, sessionResults.length, totalRounds]
    );

    useEffect(() => {
        trackEvent('session_summary_viewed', {
            totalRounds,
            sessionScore,
            isDailyChallenge,
            streakStatus,
            firstSession: isFirstSessionComplete,
        });
    }, [totalRounds, sessionScore, isDailyChallenge, streakStatus, isFirstSessionComplete]);

    useEffect(() => {
        if (!isFirstSessionComplete) return undefined;
        markFirstSessionCelebrated();
        haptic('success');
        playConfetti();
        return undefined;
    }, [isFirstSessionComplete]);

    useEffect(() => {
        const collisionIds = sessionResults.map((result) => result.collisionId).filter(Boolean);
        if (!collisionIds.length) {
            setFeedbackByCollision({});
            return;
        }

        const localFeedback = {};
        collisionIds.forEach((collisionId) => {
            const feedback = getJudgementForCollision(collisionId);
            if (feedback) {
                localFeedback[collisionId] = feedback;
            }
        });
        setFeedbackByCollision(localFeedback);

        let cancelled = false;
        getJudgementsByCollisionIds(collisionIds).then((backendFeedback) => {
            if (!cancelled && backendFeedback) {
                setFeedbackByCollision((prev) => ({ ...prev, ...backendFeedback }));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [sessionResults]);

    const stats = useMemo(() => {
        if (!sessionResults.length) return null;
        const scores = sessionResults.map((r) => r.score || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const best = Math.max(...scores);
        const worst = Math.min(...scores);
        const specialRounds = sessionResults.filter((r) => r.modifier && r.modifier.id !== 'normal').length;
        return { avg, best, worst, specialRounds };
    }, [sessionResults]);

    const bestRound = useMemo(() => {
        if (!sessionResults.length) return null;
        return sessionResults.reduce(
            (best, result) => ((result.score || 0) > (best.score || 0) ? result : best),
            sessionResults[0]
        );
    }, [sessionResults]);

    const playCta = getSessionPlayCta({ isDailyChallenge, dailyPlayed });
    const retentionCopy = getRetentionCopy({
        streakStatus,
        currentStreak: playerStats.currentStreak,
        isDailyChallenge,
        dailyPlayed,
    });
    const preferShareOnFirstSession = isFirstSessionComplete && (bestRound?.score || 0) >= 7 && Boolean(bestRound?.submission);

    const handlePlayAgain = () => {
        startSession(3, playCta.startDaily);
        beginRound();
    };

    const handleShareBestLine = async () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        const line = bestRound?.submission
            ? `My best Venn: "${bestRound.submission}" (${bestRound.score}/10). Play with me:`
            : `I scored ${sessionScore} points across ${totalRounds} rounds. Play Venn with Friends:`;
        const result = await shareOrCopy({
            title: 'Venn with Friends',
            text: line,
            url,
        });
        if (result.method === 'dismissed' || result.method === 'failed') return;
        haptic('success');
        if (result.copied) {
            setShareCopied(true);
            toast.success(LINK_COPIED_MESSAGE);
            setTimeout(() => setShareCopied(false), 2500);
        }
        trackEvent('session_summary_share', { method: result.method, firstSession: isFirstSessionComplete });
    };

    const handleInviteFriends = async () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        const result = await shareOrCopy({
            title: 'Venn with Friends',
            text: 'Play a Venn room with me:',
            url,
        });
        if (result.method === 'dismissed') return;
        if (result.copied) {
            haptic('success');
            setInviteCopied(true);
            toast.success(LINK_COPIED_MESSAGE);
            setTimeout(() => setInviteCopied(false), 2500);
        }
        endSession();
        if (typeof window !== 'undefined') {
            window.location.hash = 'friends';
        }
        setGameState('LOBBY');
    };

    const handleBackToLobby = () => {
        endSession();
        setGameState('LOBBY');
    };

    if (!sessionResults.length) {
        return (
            <div className="text-center text-white/45 py-12">
                <p>No results to show.</p>
                <button onClick={handleBackToLobby} className="mt-4 text-white/70 underline">
                    Back to Lobby
                </button>
            </div>
        );
    }

    const overallBand = getScoreBand(Math.round(stats?.avg || 0));

    return (
        <div className="w-full max-w-xl flex flex-col items-center animate-spring-in mx-auto">
            <div className="wordle-card p-6 sm:p-8 w-full">
                {isFirstSessionComplete ? (
                    <div className="first-session-celebrate text-center mb-6">
                        <div className="first-session-celebrate__mark text-4xl mb-3" role="img" aria-label="Celebration">🎉</div>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">First session in the books</h2>
                        <p className="text-white/60 text-sm">
                            You wrote {sessionResults.length} line{sessionResults.length === 1 ? '' : 's'}. That&apos;s the whole game.
                        </p>
                    </div>
                ) : (
                    <div className="text-center mb-5">
                        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-amber-200 mb-3 border border-amber-400/25 bg-amber-500/10">
                            {isDailyChallenge ? 'Daily challenge complete' : 'Session complete'}
                        </div>
                        <div className="game-section-label normal-case tracking-normal mb-1">What next</div>
                    </div>
                )}

                <div className="mb-6 flex items-center justify-between gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                    <div className="text-left">
                        <div className="game-section-label normal-case tracking-normal text-[10px]">Total</div>
                        <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${overallBand?.color || 'from-yellow-300 to-amber-600'} tabular-nums`}>
                            {sessionScore}
                        </div>
                    </div>
                    <div className="text-right text-sm text-white/55">
                        <div>Best <span className="text-white font-semibold tabular-nums">{stats.best}</span></div>
                        <div>Avg <span className="text-white font-semibold tabular-nums">{stats.avg.toFixed(1)}</span></div>
                    </div>
                </div>

                {bestRound?.submission && (
                    <div className="mb-6 rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-center">
                        <div className="game-section-label text-amber-200/70 mb-1">Best line</div>
                        <p className="text-lg font-display font-semibold text-white italic leading-snug">
                            &ldquo;{bestRound.submission}&rdquo;
                        </p>
                        <div className="mt-1 text-amber-200 font-bold tabular-nums text-sm">{bestRound.score}/10</div>
                    </div>
                )}

                {retentionCopy && !isFirstSessionComplete && (
                    <p className="mb-5 text-center text-sm text-white/60">{retentionCopy}</p>
                )}

                <SessionNextActions
                    playLabel={playCta.label}
                    playHint={!isFirstSessionComplete ? playCta.hint : null}
                    shareCopied={shareCopied}
                    inviteCopied={inviteCopied}
                    onPlay={handlePlayAgain}
                    onShare={handleShareBestLine}
                    onInvite={handleInviteFriends}
                    showShare={Boolean(bestRound?.submission)}
                    showInvite={!isFirstSessionComplete}
                    singleCta={isFirstSessionComplete ? preferShareOnFirstSession : false}
                />

                {isFirstSessionComplete && (
                    <div className="mt-6">
                        <PWAInstallBanner forceRounds={playerStats.totalRounds} />
                    </div>
                )}

                {!isFirstSessionComplete && (
                    <>
                        {isDailyChallenge && dailyHistory.length > 0 && (
                            <p className="mt-4 text-center text-xs text-white/40">
                                Daily history: {dailyHistory.length} completion{dailyHistory.length === 1 ? '' : 's'}
                                {dailySummary.weeklyCompletions > 0
                                    ? ` · this week ${dailySummary.weeklyCompletions}`
                                    : ''}
                            </p>
                        )}

                        <div className="mt-8 mb-2">
                            <div className="game-section-label mb-3">Round breakdown</div>
                            <div className="space-y-2">
                                {sessionResults.map((result, idx) => (
                                    <RoundCard
                                        key={idx}
                                        result={result}
                                        index={idx}
                                        feedback={result.collisionId ? feedbackByCollision[result.collisionId] : null}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <PWAInstallBanner />
                        </div>

                        <button
                            type="button"
                            onClick={handleBackToLobby}
                            className="mt-4 min-h-[44px] w-full text-sm text-white/45 hover:text-white underline"
                        >
                            Back to Lobby
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

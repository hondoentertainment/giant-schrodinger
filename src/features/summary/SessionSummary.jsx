import React, { useMemo, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { getScoreBand } from '../../lib/scoreBands';
import { ArrowRight, Home } from 'lucide-react';
import SocialShareButtons from '../../components/SocialShareButtons';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgementForCollision } from '../../services/judgements';
import { getStats, getStreakStatus } from '../../services/stats';
import { getDailyChallengeHistory, getDailyChallengeSummary } from '../../services/dailyChallenge';
import { AchievementProgress } from '../../components/AchievementProgress';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { haptic } from '../../lib/haptics';
import { trackEvent } from '../../services/analytics';

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

export function SessionSummary() {
    const { sessionResults, sessionScore, totalRounds, endSession, isDailyChallenge, setGameState } = useGame();
    const { toast } = useToast();
    const [feedbackByCollision, setFeedbackByCollision] = useState({});
    const [inviteCopied, setInviteCopied] = useState(false);
    const playerStats = useMemo(() => getStats(), []);
    const streakStatus = useMemo(() => getStreakStatus(playerStats), [playerStats]);
    const dailyHistory = useMemo(() => getDailyChallengeHistory(), []);
    const dailySummary = useMemo(() => getDailyChallengeSummary(), []);

    useEffect(() => {
        trackEvent('session_summary_viewed', {
            totalRounds,
            sessionScore,
            isDailyChallenge,
            streakStatus,
        });
    }, [totalRounds, sessionScore, isDailyChallenge, streakStatus]);

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

    const feedbackCount = useMemo(
        () => sessionResults.filter((result) => result.collisionId && feedbackByCollision[result.collisionId]).length,
        [sessionResults, feedbackByCollision]
    );

    const overallBand = getScoreBand(Math.round(stats?.avg || 0));

    const handlePlayAgain = () => {
        endSession();
    };

    const handleBackToLobby = () => {
        endSession();
        setGameState('LOBBY');
    };

    const handleInviteFriends = () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        const line = bestRound?.submission
            ? `My best Venn: "${bestRound.submission}" (${bestRound.score}/10). Play with me: ${url}`
            : `Play Venn with Friends with me! ${url}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(line);
            haptic('success');
            setInviteCopied(true);
            toast.success('Invite copied — send it to a friend!');
            setTimeout(() => setInviteCopied(false), 2500);
        }
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

    return (
        <div className="w-full max-w-xl flex flex-col items-center animate-spring-in mx-auto">
            <div className="wordle-card p-6 sm:p-8 w-full">
                <div className="text-center mb-8">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-amber-200 mb-4 border border-amber-400/25 bg-amber-500/10">
                        {isDailyChallenge ? 'Daily challenge complete' : 'Session complete'}
                    </div>
                    <div className="text-4xl mb-3 font-bold tracking-tight text-white/70">
                        {stats.avg >= 9 ? 'A+' : stats.avg >= 7 ? 'A' : stats.avg >= 5 ? 'B' : 'Keep going'}
                    </div>
                    <div className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${overallBand?.color || 'from-yellow-300 to-amber-600'} mb-2 tabular-nums`}>
                        {sessionScore}
                    </div>
                    <div className="game-section-label normal-case tracking-normal">Total points</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="game-stat-tile">
                        <div className="text-2xl font-bold text-white tabular-nums">{stats.avg.toFixed(1)}</div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Avg score</div>
                    </div>
                    <div className="game-stat-tile">
                        <div className="text-2xl font-bold text-emerald-300 tabular-nums">{stats.best}</div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Best</div>
                    </div>
                    <div className="game-stat-tile">
                        <div className="text-2xl font-bold text-white/70 tabular-nums">{totalRounds}</div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Rounds</div>
                    </div>
                </div>

                <div className="mb-8 p-4 rounded-[22px] bg-white/[0.05] border border-white/[0.08] text-center">
                    <div className="text-lg font-semibold text-white mb-1">{overallBand?.label}</div>
                    <div className="text-white/50 text-sm">
                        {stats.avg >= 9
                            ? 'Absolute genius-level connections. You see what others miss.'
                            : stats.avg >= 7
                            ? 'Sharp mind, clever connections. You\'ve got the gift.'
                            : stats.avg >= 5
                            ? 'Solid effort! Your connections are getting stronger.'
                            : 'Keep playing — every round sharpens your creative instincts.'}
                    </div>
                    {feedbackCount > 0 && (
                        <div className="mt-3 text-xs text-white/45">
                            Friend feedback is attached to {feedbackCount} round{feedbackCount === 1 ? '' : 's'} in this session.
                        </div>
                    )}
                </div>

                {bestRound && (
                    <div className="mb-8 rounded-[22px] border border-amber-400/25 bg-gradient-to-br from-amber-500/15 to-orange-500/10 p-5 text-center">
                        <div className="game-section-label text-amber-200/70 mb-2">Best line this session</div>
                        <p className="text-xl sm:text-2xl font-display font-bold text-white italic leading-snug">
                            &ldquo;{bestRound.submission || 'Untitled connection'}&rdquo;
                        </p>
                        <div className="mt-2 text-amber-200 font-bold tabular-nums">{bestRound.score}/10</div>
                        {isDailyChallenge && (
                            <p className="mt-3 text-white/50 text-xs">{dailySummary.shareLine}</p>
                        )}
                        <button
                            type="button"
                            onClick={handleInviteFriends}
                            className="wordle-button wordle-primary mt-4 min-h-[44px] w-full sm:w-auto px-8"
                        >
                            {inviteCopied ? 'Invite copied!' : 'Invite friends'}
                        </button>
                    </div>
                )}

                <div className="mb-8 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="game-section-label mb-3">Keep the run going</div>
                    <div className="space-y-3 text-sm text-white/65">
                        {streakStatus === 'active_today' || playerStats.currentStreak > 0 ? (
                            <p>
                                Day <span className="text-amber-300 font-bold">{playerStats.currentStreak}</span> streak is alive.
                                {streakStatus === 'active_today'
                                    ? ' Come back tomorrow to keep it.'
                                    : ' Play again tomorrow before the window closes.'}
                            </p>
                        ) : (
                            <p>Play again tomorrow to start a streak and unlock richer rewards.</p>
                        )}
                        {!isDailyChallenge && (
                            <p className="text-amber-100/80">
                                Tip: Tomorrow&apos;s Daily Venn applies a 1.5× score bonus and keeps your streak ritual sharp.
                            </p>
                        )}
                        {isDailyChallenge && dailyHistory.length > 0 && (
                            <p>
                                Daily challenge history: {dailyHistory.length} completion{dailyHistory.length === 1 ? '' : 's'} saved locally.
                                {dailySummary.weeklyCompletions > 0
                                    ? ` This week: ${dailySummary.weeklyCompletions} daily run${dailySummary.weeklyCompletions === 1 ? '' : 's'}.`
                                    : ''}
                            </p>
                        )}
                        <AchievementProgress score={Math.round(stats.avg)} stats={playerStats} />
                    </div>
                </div>

                <div className="mb-8">
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

                <div className="mb-8">
                    <SocialShareButtons
                        shareData={{
                            submission: bestRound?.submission
                                || `I scored ${sessionScore} points across ${totalRounds} rounds!`,
                            score: bestRound?.score ?? Math.round(stats.avg),
                            scoreBand: overallBand?.label,
                            commentary: isDailyChallenge
                                ? dailySummary.shareLine
                                : `Average: ${stats.avg.toFixed(1)}/10 | Best: ${stats.best}/10`,
                            judgeMode: sessionResults.some((result) => result.judgeMode === 'ai') ? 'ai' : 'human',
                            isDailyChallenge,
                            surface: 'session_summary',
                        }}
                        onToast={(type, msg) => toast[type]?.(msg)}
                    />
                </div>

                <div className="mb-8">
                    <PWAInstallBanner />
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handlePlayAgain}
                        className="wordle-button wordle-primary w-full text-lg flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-5 h-5" />
                        Play Again
                    </button>
                    <button
                        onClick={handleBackToLobby}
                        className="wordle-button w-full flex items-center justify-center gap-2 text-white/75"
                    >
                        <Home className="w-5 h-5" />
                        Back to Lobby
                    </button>
                    <button
                        onClick={() => {
                            endSession();
                            setGameState('GALLERY');
                        }}
                        className="wordle-button w-full text-white/75"
                    >
                        View Saved Gallery
                    </button>
                </div>
            </div>
        </div>
    );
}

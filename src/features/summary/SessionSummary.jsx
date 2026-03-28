import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { getScoreBand } from '../../lib/scoreBands';
import { getStats } from '../../services/stats';
import { getPlayerRank } from '../../services/leaderboard';
import { trackEvent } from '../../services/analytics';
import { Trophy, Star, Zap, ArrowRight, Home, Share2 } from 'lucide-react';
import SocialShareButtons from '../../components/SocialShareButtons';
import { generateStoryImage } from '../../lib/storyImage';

function RoundCard({ result, index }) {
    const mod = result.modifier;
    const score = result.score || 0;
    const band = getScoreBand(score);
    const isSpecial = mod && mod.id !== 'normal';

    return (
        <div
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold shrink-0">
                {isSpecial ? mod.icon : index + 1}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">
                        Round {index + 1}
                    </span>
                    {isSpecial && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold">
                            {mod.label}
                        </span>
                    )}
                </div>
                {result.breakdown && (
                    <div className="text-white/30 text-xs mt-0.5">
                        W:{result.breakdown.wit} L:{result.breakdown.logic} O:{result.breakdown.originality} C:{result.breakdown.clarity}
                    </div>
                )}
            </div>
            <div className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${band?.color || 'from-slate-400 to-slate-500'}`}>
                {score}
            </div>
        </div>
    );
}

function StoryShareButton({ score, sessionResults, playerName }) {
    const [generating, setGenerating] = useState(false);

    const handleShare = async () => {
        setGenerating(true);
        try {
            const best = sessionResults?.length > 0
                ? sessionResults.reduce((a, b) => ((a.score || a.finalScore || 0) > (b.score || b.finalScore || 0) ? a : b))
                : null;
            const conceptLeft = best.conceptLeft || 'Concept A';
            const conceptRight = best.conceptRight || 'Concept B';
            const submission = best.submission || 'My best answer';
            const dataUrl = await generateStoryImage(score, conceptLeft, conceptRight, submission, playerName);

            // Try Web Share API first, fall back to download
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'venn-story.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Venn with Friends', text: `I scored ${score}/10!` });
                    return;
                }
            }

            // Fallback: download
            const link = document.createElement('a');
            link.download = 'venn-story.png';
            link.href = dataUrl;
            link.click();
        } catch {
            // Ignore share cancellation
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-500/50 transition-all text-sm font-semibold disabled:opacity-50"
        >
            <Share2 className="w-4 h-4" />
            {generating ? 'Generating...' : 'Share to Stories'}
        </button>
    );
}

export function SessionSummary({ onBack }) {
    const { sessionResults, sessionScore, totalRounds, endSession, isDailyChallenge, setGameState, user } = useGame();
    const { toast } = useToast();

    const stats = useMemo(() => {
        if (!sessionResults.length) return null;
        const scores = sessionResults.map((r) => r.score || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const best = Math.max(...scores);
        const worst = Math.min(...scores);
        const specialRounds = sessionResults.filter((r) => r.modifier && r.modifier.id !== 'normal').length;
        return { avg, best, worst, specialRounds };
    }, [sessionResults]);

    // Find the best round
    const bestRound = useMemo(() => sessionResults?.reduce((best, r, i) =>
        (!best || (r.score || r.finalScore || 0) > (best.result.score || best.result.finalScore || 0))
            ? { result: r, index: i }
            : best
    , null), [sessionResults]);

    const overallBand = getScoreBand(Math.round(stats?.avg || 0));
    const playerStats = getStats();
    const playerRank = user?.name ? getPlayerRank(user.name) : null;

    useEffect(() => {
        if (stats) trackEvent('session_complete', { avgScore: stats.avg, totalRounds, isDailyChallenge });
    }, [stats]);

    const handlePlayAgain = () => {
        endSession();
        // endSession already sets gameState to LOBBY where user can start a new session
    };

    const handleViewGallery = () => {
        endSession();
        setGameState('GALLERY');
    };

    if (!sessionResults.length) {
        return (
            <div className="text-center text-white/40 py-12">
                <p>No results to show.</p>
                <button onClick={handlePlayAgain} className="mt-4 text-white underline">
                    Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-amber-900/30 via-purple-900/40 to-pink-900/30 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-4 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1 rounded-full bg-amber-500/10 text-sm font-bold tracking-widest text-amber-400 mb-4 border border-amber-500/20">
                            {isDailyChallenge ? 'DAILY CHALLENGE COMPLETE' : 'SESSION COMPLETE'}
                        </div>
                        <div className="text-6xl mb-3">
                            {stats.avg >= 9 ? '🌟' : stats.avg >= 7 ? '🔥' : stats.avg >= 5 ? '👍' : '💪'}
                        </div>
                        <div className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br ${overallBand?.color || 'from-yellow-300 to-amber-600'} mb-2`}>
                            {sessionScore}
                        </div>
                        <div className="text-white/50 text-sm uppercase tracking-widest">
                            Total Points
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                        <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-white">{stats.avg.toFixed(1)}</div>
                            <div className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Avg Score</div>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.best}</div>
                            <div className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Best</div>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-xl sm:text-2xl font-bold text-white/60">{totalRounds}</div>
                            <div className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Rounds</div>
                        </div>
                    </div>

                    {/* Rank & streak info */}
                    {(playerRank || playerStats.currentStreak > 0) && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {playerRank && playerRank.total > 0 && (
                                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
                                    <div className="text-lg font-bold text-purple-300">Top {Math.max(1, Math.round(100 - playerRank.percentile))}%</div>
                                    <div className="text-white/40 text-xs">Today&apos;s rank</div>
                                </div>
                            )}
                            {playerStats.currentStreak > 0 && (
                                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
                                    <div className="text-lg font-bold text-amber-400">🔥 {playerStats.currentStreak} day streak</div>
                                    <div className="text-white/40 text-xs">Keep it going!</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Performance verdict */}
                    <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-lg font-bold text-white mb-1">{overallBand?.label}</div>
                        <div className="text-white/50 text-sm">
                            {stats.avg >= 9
                                ? 'Absolute genius-level connections. You see what others miss.'
                                : stats.avg >= 7
                                ? 'Sharp mind, clever connections. You\'ve got the gift.'
                                : stats.avg >= 5
                                ? 'Solid effort! Your connections are getting stronger.'
                                : 'Keep playing — every round sharpens your creative instincts.'}
                        </div>
                    </div>

                    {/* Best connection highlight */}
                    {bestRound && (
                        <div className="w-full max-w-md mb-6 p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                            <div className="text-yellow-400 text-xs uppercase tracking-wider font-bold mb-2">
                                ⭐ Best Connection — Round {bestRound.index + 1}
                            </div>
                            {bestRound.result.submission && (
                                <p className="text-white text-lg font-medium mb-2 italic">
                                    &ldquo;{bestRound.result.submission}&rdquo;
                                </p>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-yellow-400">
                                    {bestRound.result.score || bestRound.result.finalScore}/10
                                </span>
                                {bestRound.result.breakdown && (
                                    <span className="text-white/50 text-sm">
                                        W:{bestRound.result.breakdown.wit} L:{bestRound.result.breakdown.logic} O:{bestRound.result.breakdown.originality} C:{bestRound.result.breakdown.clarity}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const text = `My best connection: "${bestRound.result.submission}" — scored ${bestRound.result.score || bestRound.result.finalScore}/10 on Venn with Friends!`;
                                    navigator.clipboard?.writeText(text);
                                }}
                                className="mt-3 px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm font-semibold hover:bg-yellow-500/30 transition"
                            >
                                Share Best Connection
                            </button>
                        </div>
                    )}

                    {/* Round-by-round breakdown */}
                    <div className="mb-8">
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Round Breakdown</div>
                        <div className="space-y-2">
                            {sessionResults.map((result, idx) => (
                                <RoundCard key={idx} result={result} index={idx} />
                            ))}
                        </div>
                    </div>

                    {/* Social sharing */}
                    <div className="mb-8">
                        <SocialShareButtons
                            shareData={{
                                submission: `I scored ${sessionScore} points across ${totalRounds} rounds!`,
                                score: Math.round(stats.avg),
                                scoreBand: overallBand?.label,
                                commentary: `Average: ${stats.avg.toFixed(1)}/10 | Best: ${stats.best}/10`,
                            }}
                            onToast={(type, msg) => toast[type]?.(msg)}
                        />
                    </div>

                    {/* Share to Stories */}
                    {sessionResults.length > 0 && (
                        <div className="mb-8 flex justify-center">
                            <StoryShareButton
                                score={Math.round(stats.avg)}
                                sessionResults={sessionResults}
                                playerName={user?.name || 'Anonymous'}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handlePlayAgain}
                            className="w-full py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-5 h-5" />
                            Play Again
                        </button>
                        <button
                            onClick={handleViewGallery}
                            className="w-full py-3 bg-white/10 text-white/70 font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Star className="w-5 h-5" />
                            View Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

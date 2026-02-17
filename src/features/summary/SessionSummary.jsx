import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { getScoreBand } from '../../lib/scoreBands';
import { Trophy, Star, Zap, ArrowRight, Home } from 'lucide-react';
import SocialShareButtons from '../../components/SocialShareButtons';

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

export function SessionSummary() {
    const { sessionResults, sessionScore, totalRounds, endSession, isDailyChallenge, setGameState } = useGame();
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

    const overallBand = getScoreBand(Math.round(stats?.avg || 0));

    const handlePlayAgain = () => {
        endSession();
    };

    const handleBackToLobby = () => {
        endSession();
        setGameState('LOBBY');
    };

    if (!sessionResults.length) {
        return (
            <div className="text-center text-white/40 py-12">
                <p>No results to show.</p>
                <button onClick={handleBackToLobby} className="mt-4 text-white underline">
                    Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-amber-900/30 via-purple-900/40 to-pink-900/30 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-8">
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
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-bold text-white">{stats.avg.toFixed(1)}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider">Avg Score</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{stats.best}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider">Best</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-bold text-white/60">{totalRounds}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider">Rounds</div>
                        </div>
                    </div>

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
                            onClick={handleBackToLobby}
                            className="w-full py-3 bg-white/10 text-white/70 font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Back to Lobby
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

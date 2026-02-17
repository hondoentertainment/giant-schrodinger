import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { Trophy, ArrowRight, Home, ThumbsUp, Crown, Star } from 'lucide-react';
import { getRoomSubmissions } from '../../services/multiplayer';

function ScoreBar({ label, value, max = 10 }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50 w-20 text-right">{label}</span>
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-white font-semibold w-8">{value}</span>
        </div>
    );
}

// Phases: countdown -> reveal -> voting -> results
const REVEAL_PHASES = {
    COUNTDOWN: 'countdown',
    REVEAL: 'reveal',
    VOTING: 'voting',
    RESULTS: 'results',
};

export function MultiplayerReveal() {
    const {
        room,
        players,
        submissions,
        isHost,
        roomPhase,
        playerName,
        advanceToNextRound,
        leaveCurrentRoom,
    } = useRoom();
    const { toast } = useToast();

    const [advancing, setAdvancing] = useState(false);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [revealPhase, setRevealPhase] = useState(REVEAL_PHASES.COUNTDOWN);
    const [countdownValue, setCountdownValue] = useState(3);
    const [revealedCount, setRevealedCount] = useState(0);
    const [votes, setVotes] = useState({});
    const [hasVoted, setHasVoted] = useState(false);

    const theme = getThemeById(room?.theme_id);
    const multiplier = theme?.modifier?.scoreMultiplier || 1;
    const isFinished = roomPhase === 'finished';
    const scoringMode = room?.scoring_mode || 'ai';

    // Fetch all submissions for finished state
    useEffect(() => {
        if (!isFinished || !room?.id) return undefined;
        let cancelled = false;
        getRoomSubmissions(room.id).then((data) => {
            if (!cancelled) setAllSubmissions(data);
        });
        return () => { cancelled = true; };
    }, [isFinished, room?.id]);

    // Dramatic countdown on mount
    useEffect(() => {
        if (isFinished) {
            setRevealPhase(REVEAL_PHASES.RESULTS);
            return;
        }
        setRevealPhase(REVEAL_PHASES.COUNTDOWN);
        setCountdownValue(3);
    }, [isFinished]);

    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.COUNTDOWN) return;
        if (countdownValue <= 0) {
            setRevealPhase(REVEAL_PHASES.REVEAL);
            return;
        }
        const timer = setTimeout(() => setCountdownValue((v) => v - 1), 800);
        return () => clearTimeout(timer);
    }, [countdownValue, revealPhase]);

    // Staggered reveal of answers
    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.REVEAL) return;
        const currentSubs = submissions;
        if (revealedCount >= currentSubs.length) {
            const moveToNext = setTimeout(() => {
                if (scoringMode === 'ai') {
                    setRevealPhase(REVEAL_PHASES.RESULTS);
                } else {
                    setRevealPhase(REVEAL_PHASES.VOTING);
                }
            }, 1000);
            return () => clearTimeout(moveToNext);
        }
        const timer = setTimeout(() => setRevealedCount((c) => c + 1), 600);
        return () => clearTimeout(timer);
    }, [revealPhase, revealedCount, submissions.length, scoringMode]);

    const handleVote = useCallback((submissionId) => {
        if (hasVoted) return;
        setVotes((prev) => ({
            ...prev,
            [submissionId]: (prev[submissionId] || 0) + 1,
        }));
        setHasVoted(true);
        toast.success('Vote cast!');
    }, [hasVoted, toast]);

    const handleFinishVoting = useCallback(() => {
        setRevealPhase(REVEAL_PHASES.RESULTS);
    }, []);

    // Build scored list
    const scored = useMemo(() => {
        const subs = isFinished ? allSubmissions : submissions;
        return [...subs]
            .map((s) => {
                const score = s.score || {};
                const player = players.find((p) => p.player_name === s.player_name);
                const voteCount = votes[s.id] || 0;
                return {
                    ...s,
                    parsedScore: score,
                    finalScore: score.finalScore || score.score || 0,
                    voteCount,
                    avatar: player?.avatar || '👽',
                };
            })
            .sort((a, b) => {
                if (revealPhase === REVEAL_PHASES.VOTING || (scoringMode !== 'ai' && revealPhase === REVEAL_PHASES.RESULTS)) {
                    return b.voteCount - a.voteCount;
                }
                return b.finalScore - a.finalScore;
            });
    }, [submissions, allSubmissions, players, isFinished, votes, revealPhase, scoringMode]);

    const sessionLeaderboard = useMemo(() => {
        const totals = new Map();
        for (const entry of scored) {
            const prev = totals.get(entry.player_name) || { totalScore: 0, rounds: 0, avatar: entry.avatar, totalVotes: 0 };
            totals.set(entry.player_name, {
                avatar: prev.avatar || entry.avatar,
                totalScore: prev.totalScore + entry.finalScore,
                totalVotes: prev.totalVotes + entry.voteCount,
                rounds: prev.rounds + 1,
            });
        }

        return players
            .map((player) => {
                const agg = totals.get(player.player_name) || { totalScore: 0, rounds: 0, avatar: player.avatar || '👽', totalVotes: 0 };
                return {
                    playerName: player.player_name,
                    avatar: agg.avatar || '👽',
                    totalScore: agg.totalScore,
                    totalVotes: agg.totalVotes,
                    rounds: agg.rounds,
                };
            })
            .sort((a, b) => b.totalScore - a.totalScore || b.totalVotes - a.totalVotes);
    }, [players, scored]);

    const hasNextRound = room && room.round_number < room.total_rounds;

    const handleNext = async () => {
        setAdvancing(true);
        await advanceToNextRound();
    };

    // Countdown screen
    if (revealPhase === REVEAL_PHASES.COUNTDOWN && !isFinished) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-center animate-in zoom-in-95 duration-500">
                    <div className="text-white/40 text-lg uppercase tracking-widest mb-4">
                        Round {room?.round_number} Answers
                    </div>
                    <div
                        className="text-[120px] font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-amber-400 animate-pulse leading-none"
                        role="status"
                        aria-live="polite"
                        aria-label={countdownValue > 0 ? `Get ready, ${countdownValue}` : 'Here they are'}
                    >
                        {countdownValue || '!'}
                    </div>
                    <div className="text-white/60 text-lg mt-4">
                        {countdownValue > 0 ? 'Get ready...' : 'Here they are!'}
                    </div>
                </div>
            </div>
        );
    }

    // Staggered reveal screen
    if (revealPhase === REVEAL_PHASES.REVEAL && !isFinished) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                    <div className="glass-panel rounded-[22px] p-8">
                        <div className="text-center mb-8">
                            <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-4 border border-white/10">
                                ROUND {room?.round_number} ANSWERS
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white">
                                And the connections are...
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {submissions.slice(0, revealedCount).map((entry, idx) => {
                                const player = players.find((p) => p.player_name === entry.player_name);
                                return (
                                    <div
                                        key={entry.id}
                                        className="rounded-2xl border bg-white/5 border-white/10 p-5 animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{player?.avatar || '👽'}</span>
                                            <span className="text-white font-bold text-lg">{entry.player_name}</span>
                                        </div>
                                        <div className="mt-3 pl-10">
                                            <p className="text-white/80 italic text-xl">&ldquo;{entry.submission}&rdquo;</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {revealedCount < submissions.length && (
                            <div className="text-center mt-6 text-white/30 animate-pulse">
                                Revealing answers...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Voting screen (for non-AI scoring)
    if (revealPhase === REVEAL_PHASES.VOTING && !isFinished) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                    <div className="glass-panel rounded-[22px] p-8">
                        <div className="text-center mb-8">
                            <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-sm font-bold tracking-widest text-purple-300 mb-4 border border-purple-500/20">
                                VOTE FOR THE BEST
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white mb-2">
                                Which connection is the best?
                            </h2>
                            <p className="text-white/40 text-sm">
                                {hasVoted ? 'You\'ve voted! Waiting for results...' : 'Tap the one you think deserves to win (you can\'t vote for yourself)'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {scored.map((entry) => {
                                const isOwnSubmission = entry.player_name === playerName;
                                const canVote = !hasVoted && !isOwnSubmission;
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => canVote && handleVote(entry.id)}
                                        disabled={!canVote}
                                        className={`w-full text-left rounded-2xl border p-5 transition-all ${
                                            canVote
                                                ? 'hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer'
                                                : isOwnSubmission
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-default'
                                        } ${
                                            entry.voteCount > 0
                                                ? 'bg-purple-500/10 border-purple-500/30'
                                                : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{entry.avatar}</span>
                                            <div className="flex-1">
                                                <span className="text-white font-bold">{entry.player_name}</span>
                                                {isOwnSubmission && <span className="text-white/30 text-xs ml-2">(you)</span>}
                                                <p className="text-white/70 italic text-lg mt-1">&ldquo;{entry.submission}&rdquo;</p>
                                            </div>
                                            {entry.voteCount > 0 && (
                                                <div className="flex items-center gap-1 text-purple-400">
                                                    <ThumbsUp className="w-5 h-5" />
                                                    <span className="font-bold">{entry.voteCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {isHost && (
                            <button
                                onClick={handleFinishVoting}
                                className="mt-6 w-full py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20"
                            >
                                End Voting &amp; Show Results
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Results screen (final reveal with scores)
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-4 border border-white/10">
                            {isFinished ? 'FINAL STANDINGS' : `ROUND ${room?.round_number} RESULTS`}
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white">
                            {isFinished ? 'Game Over!' : 'The results are in!'}
                        </h2>
                    </div>

                    {/* Per-round leaderboard */}
                    {!isFinished && (
                        <div className="space-y-4 mb-8">
                            {scored.map((entry, idx) => {
                                const isWinner = idx === 0;
                                const breakdown = entry.parsedScore?.breakdown;

                                return (
                                    <div
                                        key={entry.id}
                                        className={`rounded-2xl border p-5 transition-all animate-in slide-in-from-bottom-4 duration-500 ${
                                            isWinner
                                                ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                                : 'bg-white/5 border-white/10'
                                        }`}
                                        style={{ animationDelay: `${idx * 150}ms` }}
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                isWinner ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/50'
                                            }`}>
                                                {isWinner ? <Trophy className="w-4 h-4" /> : idx + 1}
                                            </div>
                                            <span className="text-2xl">{entry.avatar}</span>
                                            <span className="text-white font-bold text-lg flex-1">{entry.player_name}</span>
                                            <div className="flex items-center gap-3">
                                                {entry.voteCount > 0 && (
                                                    <div className="flex items-center gap-1 text-purple-400 text-sm">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        <span>{entry.voteCount}</span>
                                                    </div>
                                                )}
                                                {scoringMode === 'ai' && (
                                                    <div className={`text-3xl font-black ${
                                                        isWinner
                                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500'
                                                            : 'text-white/80'
                                                    }`}>
                                                        {entry.finalScore}/10
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3 pl-12">
                                            <p className="text-white/70 italic text-lg">&ldquo;{entry.submission}&rdquo;</p>
                                        </div>

                                        {breakdown && (
                                            <div className="pl-12 space-y-1.5">
                                                <ScoreBar label="Wit" value={breakdown.wit} />
                                                <ScoreBar label="Logic" value={breakdown.logic} />
                                                <ScoreBar label="Originality" value={breakdown.originality} />
                                                <ScoreBar label="Clarity" value={breakdown.clarity} />
                                            </div>
                                        )}

                                        {entry.parsedScore?.commentary && (
                                            <div className="mt-3 pl-12 text-sm text-white/50 italic">
                                                &ldquo;{entry.parsedScore.commentary}&rdquo;
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Session leaderboard (finished state) */}
                    {isFinished && (
                        <div className="space-y-3 mb-8">
                            {sessionLeaderboard.map((entry, idx) => (
                                <div
                                    key={entry.playerName}
                                    className={`rounded-2xl border p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500 ${
                                        idx === 0
                                            ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                                    }`}>
                                        {idx === 0 ? <Crown className="w-5 h-5" /> : idx === 1 ? <Star className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className="text-3xl">{entry.avatar}</span>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-lg">{entry.playerName}</div>
                                        <div className="text-white/40 text-sm">
                                            {entry.rounds} round{entry.rounds === 1 ? '' : 's'}
                                            {entry.totalVotes > 0 && ` · ${entry.totalVotes} votes`}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-3xl font-black ${idx === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500' : 'text-white'}`}>
                                            {entry.totalScore}
                                        </div>
                                        <div className="text-xs text-white/50">total pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No scores yet */}
                    {!isFinished && scored.length === 0 && (
                        <div className="text-center py-12 text-white/40">
                            <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mx-auto mb-4" />
                            <p>Waiting for scores...</p>
                        </div>
                    )}

                    {/* Multiplier note */}
                    {!isFinished && multiplier !== 1 && (
                        <div className="text-center text-sm text-white/40 mb-6">
                            Theme multiplier: <span className="text-white">x{multiplier.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {!isFinished && isHost && hasNextRound && (
                            <button
                                onClick={handleNext}
                                disabled={advancing}
                                className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-2 disabled:opacity-50"
                            >
                                <ArrowRight className="w-5 h-5" />
                                {advancing ? 'Loading...' : `Next Round (${room.round_number + 1}/${room.total_rounds})`}
                            </button>
                        )}
                        {(isFinished || (isHost && !hasNextRound)) && (
                            <button
                                onClick={leaveCurrentRoom}
                                className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Back to Lobby
                            </button>
                        )}
                        {!isFinished && !isHost && (
                            <div className="text-white/40 text-sm">
                                {hasNextRound ? 'Waiting for host to start next round...' : 'Game complete — waiting for final results...'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

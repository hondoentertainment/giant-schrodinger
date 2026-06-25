import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { Trophy, ArrowRight, Home, ThumbsUp, Crown, Star } from 'lucide-react';
import { getRoomSubmissions } from '../../services/multiplayer';
import { ConnectionBanner } from './ConnectionBanner';

function ScoreBar({ label, value, max = 10 }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50 w-20 text-right">{label}</span>
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #0a84ff, #64d2ff)',
                    }}
                />
            </div>
            <span className="text-white font-semibold w-8 tabular-nums">{value}</span>
        </div>
    );
}

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
        votes,
        isHost,
        roomPhase,
        playerName,
        castVoteForSubmission,
        finalizeMultiplayerVoting,
        advanceToNextRound,
        leaveCurrentRoom,
    } = useRoom();
    const { toast } = useToast();

    const [advancing, setAdvancing] = useState(false);
    const [finishingVotes, setFinishingVotes] = useState(false);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [revealPhase, setRevealPhase] = useState(REVEAL_PHASES.COUNTDOWN);
    const [countdownValue, setCountdownValue] = useState(3);
    const [revealedCount, setRevealedCount] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedVoteId, setSelectedVoteId] = useState(null);

    const theme = getThemeById(room?.theme_id);
    const multiplier = theme?.modifier?.scoreMultiplier || 1;
    const scoringMode = room?.scoring_mode || 'ai';
    const isFinished = roomPhase === 'finished';
    const isResultsReady = roomPhase === 'results' || room?.status === 'results' || isFinished;
    const expectedVoteCount = scoringMode === 'human' ? Math.max(submissions.length, 0) : 0;
    const currentVoteCount = votes.length;

    useEffect(() => {
        if (!isFinished || !room?.id) return undefined;
        let cancelled = false;
        getRoomSubmissions(room.id).then((data) => {
            if (!cancelled) setAllSubmissions(data);
        });
        return () => {
            cancelled = true;
        };
    }, [isFinished, room?.id]);

    useEffect(() => {
        setRevealedCount(0);
        setCountdownValue(3);
        setHasVoted(false);
        setSelectedVoteId(null);

        if (isResultsReady) {
            setRevealPhase(REVEAL_PHASES.RESULTS);
        } else {
            setRevealPhase(REVEAL_PHASES.COUNTDOWN);
        }
    }, [room?.id, room?.round_number, roomPhase, isResultsReady]);

    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.COUNTDOWN || isResultsReady) return;
        if (countdownValue <= 0) {
            setRevealPhase(REVEAL_PHASES.REVEAL);
            return;
        }
        const timer = setTimeout(() => setCountdownValue((value) => value - 1), 800);
        return () => clearTimeout(timer);
    }, [countdownValue, isResultsReady, revealPhase]);

    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.REVEAL || isResultsReady) return;
        if (revealedCount >= submissions.length) {
            const moveToNext = setTimeout(() => {
                if (scoringMode === 'ai') {
                    setRevealPhase(REVEAL_PHASES.RESULTS);
                } else {
                    setRevealPhase(REVEAL_PHASES.VOTING);
                }
            }, 1000);
            return () => clearTimeout(moveToNext);
        }

        const timer = setTimeout(() => setRevealedCount((count) => count + 1), 600);
        return () => clearTimeout(timer);
    }, [isResultsReady, revealPhase, revealedCount, scoringMode, submissions.length]);

    useEffect(() => {
        if (isResultsReady) {
            setRevealPhase(REVEAL_PHASES.RESULTS);
        }
    }, [isResultsReady]);

    useEffect(() => {
        if (!playerName) return;
        const existingVote = votes.find((entry) => entry.voter_name === playerName);
        if (!existingVote) return;
        setHasVoted(true);
        setSelectedVoteId(existingVote.submission_id);
    }, [playerName, votes]);

    const handleVote = useCallback(async (submissionId) => {
        if (hasVoted) return;

        const result = await castVoteForSubmission(submissionId);
        if (!result.ok) {
            if ((result.error || '').toLowerCase().includes('already')) {
                setHasVoted(true);
            }
            return;
        }

        setHasVoted(true);
        setSelectedVoteId(submissionId);
        toast.success('Vote cast!');
    }, [castVoteForSubmission, hasVoted, toast]);

    const handleFinishVoting = useCallback(async () => {
        setFinishingVotes(true);
        const ok = await finalizeMultiplayerVoting();
        if (!ok) {
            setFinishingVotes(false);
            return;
        }
        setFinishingVotes(false);
        setRevealPhase(REVEAL_PHASES.RESULTS);
    }, [finalizeMultiplayerVoting]);

    const sourceSubmissions = isFinished ? allSubmissions : submissions;
    const scored = useMemo(() => {
        return [...sourceSubmissions]
            .map((entry) => {
                const parsedScore = entry.score && typeof entry.score === 'object' ? entry.score : {};
                const player = players.find((p) => p.player_name === entry.player_name);
                const voteCount = Number(parsedScore.voteCount || 0);

                return {
                    ...entry,
                    parsedScore,
                    finalScore: Number(parsedScore.finalScore ?? parsedScore.score ?? voteCount ?? 0),
                    voteCount,
                    avatar: player?.avatar || '👽',
                };
            })
            .sort((a, b) => {
                if (scoringMode !== 'ai' && (isResultsReady || revealPhase === REVEAL_PHASES.RESULTS)) {
                    return b.voteCount - a.voteCount || b.finalScore - a.finalScore;
                }
                return b.finalScore - a.finalScore;
            });
    }, [isFinished, isResultsReady, players, revealPhase, scoringMode, sourceSubmissions]);

    const sessionLeaderboard = useMemo(() => {
        const totals = new Map();
        for (const entry of scored) {
            const previous = totals.get(entry.player_name) || {
                totalScore: 0,
                totalVotes: 0,
                rounds: 0,
                avatar: entry.avatar,
            };
            totals.set(entry.player_name, {
                avatar: previous.avatar || entry.avatar,
                totalScore: previous.totalScore + entry.finalScore,
                totalVotes: previous.totalVotes + entry.voteCount,
                rounds: previous.rounds + 1,
            });
        }

        return players
            .map((player) => {
                const aggregate = totals.get(player.player_name) || {
                    totalScore: 0,
                    totalVotes: 0,
                    rounds: 0,
                    avatar: player.avatar || '👽',
                };
                return {
                    playerName: player.player_name,
                    avatar: aggregate.avatar || '👽',
                    totalScore: aggregate.totalScore,
                    totalVotes: aggregate.totalVotes,
                    rounds: aggregate.rounds,
                };
            })
            .sort((a, b) => b.totalScore - a.totalScore || b.totalVotes - a.totalVotes);
    }, [players, scored]);

    const hasNextRound = room && room.round_number < room.total_rounds;

    const handleNext = async () => {
        setAdvancing(true);
        await advanceToNextRound();
        setAdvancing(false);
    };

    const withConnectionBanner = (content) => (
        <>
            <ConnectionBanner />
            {content}
        </>
    );

    if (revealPhase === REVEAL_PHASES.COUNTDOWN && !isResultsReady) {
        return withConnectionBanner(
            <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[50vh] animate-spring-in">
                <div className="text-center">
                    <div className="game-section-label mb-4">
                        Round {room?.round_number} answers
                    </div>
                    <div
                        className="game-mp-countdown"
                        role="status"
                        aria-live="polite"
                        aria-label={countdownValue > 0 ? `Get ready, ${countdownValue}` : 'Here they are'}
                    >
                        {countdownValue || '!'}
                    </div>
                    <div className="text-white/55 text-lg mt-4">
                        {countdownValue > 0 ? 'Get ready...' : 'Here they are'}
                    </div>
                </div>
            </div>
        );
    }

    if (revealPhase === REVEAL_PHASES.REVEAL && !isResultsReady) {
        return withConnectionBanner(
            <div className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
                <div className="game-mp-shell p-6 sm:p-8 w-full">
                        <div className="text-center mb-8">
                            <div className="game-section-label mb-3">
                                Round {room?.round_number} answers
                            </div>
                            <h2 className="text-2xl font-display font-bold tracking-tight text-white">
                                And the connections are...
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {submissions.slice(0, revealedCount).map((entry) => {
                                const player = players.find((p) => p.player_name === entry.player_name);
                                return (
                                    <div
                                        key={entry.id}
                                        className="game-player-row flex-col items-stretch p-5 animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{player?.avatar || '👽'}</span>
                                            <span className="text-white font-semibold text-lg">{entry.player_name}</span>
                                        </div>
                                        <div className="mt-3 pl-10">
                                            <p className="text-white/75 italic text-xl">&ldquo;{entry.submission}&rdquo;</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {revealedCount < submissions.length && (
                            <div className="text-center mt-6 text-white/35 animate-pulse text-sm">
                                Revealing answers...
                            </div>
                        )}
                </div>
            </div>
        );
    }

    if (revealPhase === REVEAL_PHASES.VOTING && !isResultsReady) {
        return withConnectionBanner(
            <div className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
                <div className="game-mp-shell p-6 sm:p-8 w-full">
                        <div className="text-center mb-8">
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-3 border border-game-accent/30 bg-game-accent/10">
                                Vote for the best
                            </div>
                            <h2 className="text-2xl font-display font-bold tracking-tight text-white mb-2">
                                Which connection wins this round?
                            </h2>
                            <p className="text-white/45 text-sm">
                                {hasVoted
                                    ? 'Your vote is locked in. Waiting for the host to reveal results...'
                                    : 'Tap one connection to cast your vote. You cannot vote for yourself.'}
                            </p>
                            <p className="text-white/30 text-xs mt-2 tabular-nums">
                                Votes locked in: {currentVoteCount}/{expectedVoteCount || submissions.length}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {scored.map((entry) => {
                                const isOwnSubmission = entry.player_name === playerName;
                                const canVote = !hasVoted && !isOwnSubmission;
                                const isSelected = selectedVoteId === entry.id;

                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => canVote && handleVote(entry.id)}
                                        disabled={!canVote}
                                        className={`w-full text-left rounded-[22px] border p-5 transition-all ${
                                            canVote
                                                ? 'hover:bg-white/[0.08] hover:border-game-accent/40 cursor-pointer'
                                                : isOwnSubmission
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-default'
                                        } ${
                                            isSelected
                                                ? 'bg-game-accent/12 border-game-accent/45'
                                                : 'bg-white/[0.05] border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{entry.avatar}</span>
                                            <div className="flex-1">
                                                <span className="text-white font-semibold">{entry.player_name}</span>
                                                {isOwnSubmission && <span className="text-white/30 text-xs ml-2">(you)</span>}
                                                <p className="text-white/70 italic text-lg mt-1">&ldquo;{entry.submission}&rdquo;</p>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-1 text-blue-200">
                                                    <ThumbsUp className="w-5 h-5" />
                                                    <span className="font-semibold">Voted</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {isHost && (
                            <>
                                <button
                                    onClick={handleFinishVoting}
                                    disabled={finishingVotes}
                                    className="wordle-button w-full mt-6 disabled:opacity-60"
                                >
                                    {finishingVotes ? 'Finalizing...' : `Show Results (${currentVoteCount}/${expectedVoteCount || submissions.length} votes)`}
                                </button>
                                <p className="mt-3 text-center text-xs text-white/35">
                                    {currentVoteCount >= expectedVoteCount && expectedVoteCount > 0
                                        ? 'All submitted players have voted.'
                                        : 'You can wait for the remaining submitted players or reveal results now.'}
                                </p>
                            </>
                        )}
                </div>
            </div>
        );
    }

    return withConnectionBanner(
        <div className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
            <div className="game-mp-shell p-6 sm:p-8 w-full">
                    <div className="text-center mb-8">
                        <div className="game-section-label mb-3">
                            {isFinished ? 'Final standings' : `Round ${room?.round_number} results`}
                        </div>
                        <h2 className="text-3xl font-display font-bold tracking-tight text-white">
                            {isFinished ? 'Game over' : 'The results are in'}
                        </h2>
                    </div>

                    {!isFinished && (
                        <div className="space-y-4 mb-8">
                            {scored.map((entry, index) => {
                                const isWinner = index === 0;
                                const breakdown = entry.parsedScore?.breakdown;

                                return (
                                    <div
                                        key={entry.id}
                                        className={`rounded-[22px] border p-5 transition-all animate-in slide-in-from-bottom-4 duration-500 ${
                                            isWinner
                                                ? 'bg-gradient-to-r from-amber-500/12 to-yellow-500/8 border-amber-400/30 shadow-[0_0_30px_rgba(255,214,10,0.12)]'
                                                : 'bg-white/[0.05] border-white/10'
                                        }`}
                                        style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                isWinner ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/50'
                                            }`}>
                                                {isWinner ? <Trophy className="w-4 h-4" /> : index + 1}
                                            </div>
                                            <span className="text-2xl">{entry.avatar}</span>
                                            <span className="text-white font-bold text-lg flex-1">{entry.player_name}</span>
                                            <div className="flex items-center gap-3">
                                                {scoringMode === 'ai' ? (
                                                    <div className={`text-3xl font-black ${
                                                        isWinner
                                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500'
                                                            : 'text-white/80'
                                                    }`}>
                                                        {entry.finalScore}/10
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-purple-300 text-sm">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        <span className="font-bold">{entry.voteCount}</span>
                                                        <span className="text-white/50">vote{entry.voteCount === 1 ? '' : 's'}</span>
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

                    {isFinished && (
                        <div className="space-y-3 mb-8">
                            {sessionLeaderboard.map((entry, index) => (
                                <div
                                    key={entry.playerName}
                                    className={`rounded-2xl border p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500 ${
                                        index === 0
                                            ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-amber-500 text-black' : index === 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                                    }`}>
                                        {index === 0 ? <Crown className="w-5 h-5" /> : index === 1 ? <Star className="w-4 h-4" /> : index + 1}
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
                                        <div className={`text-3xl font-black ${
                                            index === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500' : 'text-white'
                                        }`}>
                                            {entry.totalScore}
                                        </div>
                                        <div className="text-xs text-white/50">total pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isFinished && scored.length === 0 && (
                        <div className="text-center py-12 text-white/40">
                            <div className="w-12 h-12 rounded-full border-2 border-t-game-accent border-white/10 animate-spin mx-auto mb-4" />
                            <p>Waiting for scores...</p>
                        </div>
                    )}

                    {!isFinished && multiplier !== 1 && (
                        <div className="text-center text-sm text-white/40 mb-6">
                            Theme multiplier: <span className="text-white">x{multiplier.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {!isFinished && isHost && hasNextRound && (
                            <button
                                onClick={handleNext}
                                disabled={advancing}
                                className="wordle-button wordle-primary px-8 text-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <ArrowRight className="w-5 h-5" />
                                {advancing ? 'Loading...' : `Next Round (${room.round_number + 1}/${room.total_rounds})`}
                            </button>
                        )}
                        {(isFinished || (isHost && !hasNextRound)) && (
                            <button
                                onClick={leaveCurrentRoom}
                                className="wordle-button wordle-primary px-8 text-lg flex items-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Back to Lobby
                            </button>
                        )}
                        {!isFinished && !isHost && (
                            <div className="text-white/40 text-sm">
                                {hasNextRound ? 'Waiting for host to start next round...' : 'Game complete - waiting for final results...'}
                            </div>
                        )}
                    </div>
            </div>
        </div>
    );
}

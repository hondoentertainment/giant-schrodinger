import React, { useEffect, useMemo, useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { getThemeById } from '../../data/themes';
import { Trophy, ArrowRight, Home } from 'lucide-react';
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

export function MultiplayerReveal() {
    const {
        room,
        players,
        submissions,
        isHost,
        roomPhase,
        advanceToNextRound,
        leaveCurrentRoom,
    } = useRoom();

    const [advancing, setAdvancing] = useState(false);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const theme = getThemeById(room?.theme_id);
    const multiplier = theme?.modifier?.scoreMultiplier || 1;
    const isFinished = roomPhase === 'finished';

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

    // Sort submissions by final score (descending)
    const scored = [...(isFinished ? allSubmissions : submissions)]
        .map((s) => {
            const score = s.score || {};
            const player = players.find((p) => p.player_name === s.player_name);
            return {
                ...s,
                parsedScore: score,
                finalScore: score.finalScore || score.score || 0,
                avatar: player?.avatar || '👽',
            };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

    const sessionLeaderboard = useMemo(() => {
        const totals = new Map();
        for (const entry of scored) {
            const prev = totals.get(entry.player_name) || { totalScore: 0, rounds: 0, avatar: entry.avatar };
            totals.set(entry.player_name, {
                avatar: prev.avatar || entry.avatar,
                totalScore: prev.totalScore + entry.finalScore,
                rounds: prev.rounds + 1,
            });
        }

        return players
            .map((player) => {
                const agg = totals.get(player.player_name) || { totalScore: 0, rounds: 0, avatar: player.avatar || '👽' };
                return {
                    playerName: player.player_name,
                    avatar: agg.avatar || '👽',
                    totalScore: agg.totalScore,
                    rounds: agg.rounds,
                };
            })
            .sort((a, b) => b.totalScore - a.totalScore);
    }, [players, scored]);

    const hasNextRound = room && room.round_number < room.total_rounds;

    const handleNext = async () => {
        setAdvancing(true);
        await advanceToNextRound();
        // Room update via Realtime will transition phase
    };

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
                            {isFinished ? 'Session complete' : 'Who had the best connection?'}
                        </h2>
                    </div>

                    {/* Leaderboard */}
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
                                        {/* Player row */}
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                isWinner ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/50'
                                            }`}>
                                                {isWinner ? <Trophy className="w-4 h-4" /> : idx + 1}
                                            </div>
                                            <span className="text-2xl">{entry.avatar}</span>
                                            <span className="text-white font-bold text-lg flex-1">{entry.player_name}</span>
                                            <div className={`text-3xl font-black ${
                                                isWinner
                                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500'
                                                    : 'text-white/80'
                                            }`}>
                                                {entry.finalScore}/10
                                            </div>
                                        </div>

                                        {/* Submission */}
                                        <div className="mb-3 pl-12">
                                            <p className="text-white/70 italic text-lg">&ldquo;{entry.submission}&rdquo;</p>
                                        </div>

                                        {/* Score breakdown */}
                                        {breakdown && (
                                            <div className="pl-12 space-y-1.5">
                                                <ScoreBar label="Wit" value={breakdown.wit} />
                                                <ScoreBar label="Logic" value={breakdown.logic} />
                                                <ScoreBar label="Originality" value={breakdown.originality} />
                                                <ScoreBar label="Clarity" value={breakdown.clarity} />
                                            </div>
                                        )}

                                        {/* Commentary */}
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
                            {sessionLeaderboard.map((entry, idx) => (
                                <div
                                    key={entry.playerName}
                                    className={`rounded-2xl border p-4 flex items-center gap-3 ${
                                        idx === 0
                                            ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        idx === 0 ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/60'
                                    }`}>
                                        {idx === 0 ? <Trophy className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className="text-2xl">{entry.avatar}</span>
                                    <div className="flex-1">
                                        <div className="text-white font-semibold">{entry.playerName}</div>
                                        <div className="text-white/40 text-sm">
                                            {entry.rounds} round{entry.rounds === 1 ? '' : 's'} scored
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white">{entry.totalScore}</div>
                                        <div className="text-xs text-white/50">session pts</div>
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
                            Theme multiplier applied: <span className="text-white">x{multiplier.toFixed(2)}</span>
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
                                Leave Room
                            </button>
                        )}
                        {!isFinished && !isHost && (
                            <div className="text-white/40 text-sm">
                                {hasNextRound ? 'Waiting for host to start next round...' : 'Game complete!'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

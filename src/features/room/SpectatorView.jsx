import React, { useState, useEffect, useCallback } from 'react';
import { useRoom } from '../../context/RoomContext';
import { ArrowLeft, Eye, Users, Clock } from 'lucide-react';

export function SpectatorView({ onBack }) {
    const { room, players, submissions, roomPhase } = useRoom();
    const [revealedCount, setRevealedCount] = useState(0);

    // Animate submission reveals
    useEffect(() => {
        if (roomPhase === 'revealing' && submissions.length > 0) {
            setRevealedCount(0);
            const timer = setInterval(() => {
                setRevealedCount(prev => {
                    if (prev >= submissions.length) {
                        clearInterval(timer);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 800);
            return () => clearInterval(timer);
        }
    }, [roomPhase, submissions.length]);

    if (!room) {
        return (
            <div className="w-full max-w-md text-center animate-in fade-in duration-500">
                <div className="glass-panel rounded-3xl p-8">
                    <Eye className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Spectator Mode</h2>
                    <p className="text-white/50 text-sm mb-6">Join a room to watch players compete in real time.</p>
                    <button
                        onClick={onBack}
                        className="px-8 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Leave spectator mode"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-display font-bold text-white flex-1">
                    Spectating Room {room.code}
                </h2>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>LIVE</span>
                </div>
            </div>

            {/* Room status */}
            <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{players.length} players</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        roomPhase === 'playing' ? 'bg-emerald-500/20 text-emerald-400' :
                        roomPhase === 'revealing' ? 'bg-amber-500/20 text-amber-400' :
                        roomPhase === 'finished' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-white/10 text-white/60'
                    }`}>
                        {roomPhase === 'playing' ? 'In Progress' :
                         roomPhase === 'revealing' ? 'Revealing Scores' :
                         roomPhase === 'finished' ? 'Finished' :
                         'Waiting'}
                    </div>
                </div>

                {/* Round info */}
                {room.round_number && (
                    <div className="text-center text-white/40 text-sm">
                        Round {room.round_number} of {room.total_rounds}
                    </div>
                )}
            </div>

            {/* Players list */}
            <div className="glass-panel rounded-2xl p-4">
                <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3 font-semibold">Players</h3>
                <div className="space-y-2">
                    {players.map((player, i) => {
                        const playerSub = submissions.find(s => s.player_name === player.player_name);
                        const hasSubmitted = !!playerSub;
                        const isRevealed = roomPhase === 'revealing' && i < revealedCount;

                        return (
                            <div key={player.id || i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{player.avatar || '👤'}</span>
                                    <span className="text-white/80 text-sm font-semibold">{player.player_name}</span>
                                    {player.is_host && <span className="text-xs text-amber-400">HOST</span>}
                                </div>
                                <div>
                                    {roomPhase === 'playing' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            hasSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                        }`}>
                                            {hasSubmitted ? 'Submitted' : 'Thinking...'}
                                        </span>
                                    )}
                                    {isRevealed && playerSub && (
                                        <div className="animate-in zoom-in-95 duration-300">
                                            <span className="text-white font-bold">{playerSub.score || '?'}/10</span>
                                        </div>
                                    )}
                                    {roomPhase === 'finished' && playerSub && (
                                        <span className="text-white font-bold">{playerSub.score || '?'}/10</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Submissions reveal */}
            {roomPhase === 'revealing' && submissions.length > 0 && (
                <div className="glass-panel rounded-2xl p-4">
                    <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3 font-semibold">Submissions</h3>
                    <div className="space-y-2">
                        {submissions.slice(0, revealedCount).map((sub, i) => (
                            <div key={sub.id || i} className="bg-white/5 rounded-xl p-3 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white/60 text-sm">{sub.player_name}</span>
                                    <span className={`font-bold ${
                                        (sub.score || 0) >= 8 ? 'text-emerald-400' :
                                        (sub.score || 0) >= 5 ? 'text-amber-400' :
                                        'text-red-400'
                                    }`}>{sub.score || '?'}/10</span>
                                </div>
                                <p className="text-white/80 text-sm italic">&ldquo;{sub.submission}&rdquo;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Final standings */}
            {roomPhase === 'finished' && (
                <div className="glass-panel rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <h3 className="text-amber-300 text-xs uppercase tracking-wider mb-3 font-semibold text-center">Final Results</h3>
                    <div className="space-y-2">
                        {[...submissions]
                            .sort((a, b) => (b.score || 0) - (a.score || 0))
                            .map((sub, i) => (
                                <div key={sub.id || i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                        <span className="text-white/80 text-sm">{sub.player_name}</span>
                                    </div>
                                    <span className="text-white font-bold">{sub.score || 0}/10</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

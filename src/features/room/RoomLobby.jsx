import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { Copy, Users, Crown, LogOut, Play } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { ConnectionBanner } from './ConnectionBanner';

export function RoomLobby() {
    const {
        room,
        players,
        isHost,
        isSpectator,
        roomCode,
        leaveCurrentRoom,
        startMultiplayerRound,
    } = useRoom();
    const { toast } = useToast();
    const [starting, setStarting] = useState(false);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            setCountdown(null);
            startMultiplayerRound().finally(() => setStarting(false));
            return;
        }
        haptic('light');
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown, startMultiplayerRound]);

    const copyCode = () => {
        if (roomCode && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(roomCode);
            haptic('light');
            toast.success('Room code copied!');
        }
    };

    const handleStart = () => {
        if (players.length < 2) {
            toast.warn('Need at least 2 players to start');
            return;
        }
        setStarting(true);
        setCountdown(3);
    };

    return (
        <div className="w-full max-w-md wordle-card p-6 sm:p-8 animate-spring-in">
            <ConnectionBanner />
            {isSpectator && (
                <div className="w-full py-2.5 px-4 bg-amber-500/15 border border-amber-400/25 text-amber-200 text-sm font-semibold text-center rounded-2xl mb-6">
                    Spectating — watch and react
                </div>
            )}

            <div className="text-center mb-8">
                <div className="game-section-label mb-4">Multiplayer room</div>

                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-4xl sm:text-5xl font-display font-bold tracking-[0.12em] text-gradient-vibrant">
                        {roomCode}
                    </span>
                    <button
                        onClick={copyCode}
                        className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Copy room code"
                        title="Copy room code"
                    >
                        <Copy className="w-5 h-5 text-white/70" />
                    </button>
                </div>
                <p className="text-white/50 text-sm">Share this code with friends to join</p>
                <div className="mt-4 p-4 rounded-[22px] bg-white/[0.05] border border-white/[0.08] text-left text-sm text-white/55">
                    <div className="font-semibold text-white/80 mb-1">How to invite</div>
                    <p>Friends join from the main lobby: tap Play with Friends, enter this code, then Join. Everyone sees the same concepts and plays simultaneously.</p>
                </div>
            </div>

            <div className="flex gap-3 mb-6 text-sm">
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg">{room?.total_rounds || 3}</div>
                    <div className="text-white/45 text-xs mt-0.5">Rounds</div>
                </div>
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg">{room?.scoring_mode === 'human' ? 'Manual' : 'AI'}</div>
                    <div className="text-white/45 text-xs mt-0.5">Judge</div>
                </div>
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg capitalize">{room?.theme_id || 'neon'}</div>
                    <div className="text-white/45 text-xs mt-0.5">Theme</div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 text-white/55 text-sm">
                    <Users className="w-4 h-4" />
                    <span>Players ({players.length})</span>
                </div>
                <div className="space-y-2" role="list" aria-label="Players in room" aria-live="polite">
                    {players.map((p) => (
                        <div key={p.id} className="game-player-row" role="listitem">
                            <span className="text-2xl">{p.avatar || '👽'}</span>
                            <span className="text-white font-semibold flex-1">{p.player_name}</span>
                            {p.is_host && (
                                <Crown className="w-5 h-5 text-amber-300" aria-label="Host" />
                            )}
                        </div>
                    ))}
                    {players.length === 1 && (
                        <div className="text-center py-4 text-white/35 text-sm animate-pulse">
                            Waiting for more players...
                        </div>
                    )}
                </div>
            </div>

            {countdown !== null && countdown > 0 && (
                <div className="game-modal-overlay animate-in fade-in duration-200">
                    <div className="game-mp-countdown" role="status" aria-live="polite">
                        {countdown}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {isHost && (
                    <button
                        onClick={handleStart}
                        disabled={starting || players.length < 2}
                        className="wordle-button wordle-primary w-full text-lg flex items-center justify-center gap-2 disabled:hover:scale-100"
                    >
                        <Play className="w-5 h-5" />
                        {starting && countdown === null ? 'Starting...' : countdown !== null && countdown > 0 ? `${countdown}...` : 'Start Game'}
                    </button>
                )}
                {!isHost && !isSpectator && (
                    <div className="text-center py-4 px-4 rounded-[22px] bg-white/[0.05] border border-white/[0.08]">
                        <p className="text-white/70 font-medium mb-1">Waiting for the host to start</p>
                        <p className="text-white/40 text-xs">The host can start once everyone has joined</p>
                    </div>
                )}
                {isSpectator && (
                    <div className="text-center py-4 px-4 rounded-[22px] bg-amber-500/10 border border-amber-400/20">
                        <p className="text-amber-200 font-medium mb-1">You are spectating</p>
                        <p className="text-white/40 text-xs">Watch the game and react to submissions</p>
                    </div>
                )}
                <button
                    onClick={leaveCurrentRoom}
                    className="wordle-button w-full flex items-center justify-center gap-2 text-white/70"
                >
                    <LogOut className="w-4 h-4" />
                    {isSpectator ? 'Stop Watching' : 'Leave Room'}
                </button>
            </div>
        </div>
    );
}

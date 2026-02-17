import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { Copy, Users, Crown, LogOut, Play } from 'lucide-react';
import { haptic } from '../../lib/haptics';

export function RoomLobby() {
    const {
        room,
        players,
        isHost,
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
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
            {/* Room header */}
            <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-4 border border-white/10">
                    MULTIPLAYER ROOM
                </div>

                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-5xl font-black font-display tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {roomCode}
                    </span>
                    <button
                        onClick={copyCode}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Copy room code"
                        title="Copy room code"
                    >
                        <Copy className="w-5 h-5 text-white/70" />
                    </button>
                </div>
                <p className="text-white/50 text-sm">Share this code with friends to join</p>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-left text-sm text-white/60">
                    <div className="font-semibold text-white/80 mb-1">How to invite</div>
                    <p>Friends join from the main lobby: click &quot;Play with Friends&quot; → enter this code → Join. Everyone sees the same concepts and plays simultaneously.</p>
                </div>
            </div>

            {/* Room info */}
            <div className="flex gap-3 mb-6 text-sm text-white/60">
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-white font-semibold">{room?.total_rounds || 3}</div>
                    <div className="text-xs">Rounds</div>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-white font-semibold">{room?.scoring_mode === 'human' ? 'Manual' : 'AI'}</div>
                    <div className="text-xs">Judge</div>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-white font-semibold capitalize">{room?.theme_id || 'neon'}</div>
                    <div className="text-xs">Theme</div>
                </div>
            </div>

            {/* Players list */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 text-white/60 text-sm">
                    <Users className="w-4 h-4" />
                    <span>Players ({players.length})</span>
                </div>
                <div className="space-y-2" role="list" aria-label="Players in room" aria-live="polite">
                    {players.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                        >
                            <span className="text-2xl">{p.avatar || '👽'}</span>
                            <span className="text-white font-semibold flex-1">{p.player_name}</span>
                            {p.is_host && (
                                <Crown className="w-5 h-5 text-amber-400" />
                            )}
                        </div>
                    ))}
                    {players.length === 1 && (
                        <div className="text-center py-4 text-white/30 text-sm animate-pulse">
                            Waiting for more players...
                        </div>
                    )}
                </div>
            </div>

            {/* Countdown overlay */}
            {countdown !== null && countdown > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="text-8xl font-black text-white animate-in zoom-in-95 duration-300" role="status" aria-live="polite">
                        {countdown}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {isHost && (
                    <button
                        onClick={handleStart}
                        disabled={starting || players.length < 2}
                        className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        <Play className="w-6 h-6" />
                        {starting && countdown === null ? 'Starting...' : countdown !== null && countdown > 0 ? `${countdown}...` : 'Start Game'}
                    </button>
                )}
                {!isHost && (
                    <div className="text-center py-4 px-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/70 font-medium mb-1">Waiting for the host to start</p>
                        <p className="text-white/40 text-xs">The host can start once everyone has joined</p>
                    </div>
                )}
                <button
                    onClick={leaveCurrentRoom}
                    className="w-full py-3 bg-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Leave Room
                </button>
            </div>
        </div>
    );
}

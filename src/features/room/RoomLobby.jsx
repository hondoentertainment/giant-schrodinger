import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { Copy, Users, Crown, LogOut, Play, Share2 } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { trackEvent } from '../../services/analytics';
import { ConnectionBanner } from './ConnectionBanner';

function buildJoinInvite(code) {
    const origin = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';
    const joinUrl = `${origin}?join=${encodeURIComponent(code)}`;
    const text = `Join my Venn with Friends room! Code ${code}: ${joinUrl}`;
    return { joinUrl, text };
}

export function RoomLobby() {
    const {
        room,
        players,
        activePlayers,
        isHost,
        isSpectator,
        roomCode,
        leaveCurrentRoom,
        startMultiplayerRound,
        passThePhone,
        setPassThePhone,
        addCouchWriter,
    } = useRoom();
    const seatedPlayers = activePlayers || players.filter((player) => !player.is_spectator);
    const watchers = players.filter((player) => player.is_spectator);
    const { toast } = useToast();
    const [starting, setStarting] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [inviteShared, setInviteShared] = useState(false);
    const [couchName, setCouchName] = useState('');
    const [addingWriter, setAddingWriter] = useState(false);

    useEffect(() => {
        if (!roomCode) return;
        trackEvent('room_waiting_shown', {
            playerCount: seatedPlayers.length,
            isHost,
            passThePhone: Boolean(passThePhone),
        });
    }, [roomCode]);

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

    // Mid-session return to lobby (waiting) — auto-start next round for the host
    useEffect(() => {
        if (!isHost || starting || countdown !== null) return;
        if (room?.status === 'waiting' && (room.round_number || 1) > 1 && seatedPlayers.length >= 2) {
            setStarting(true);
            setCountdown(2);
        }
    }, [countdown, isHost, seatedPlayers.length, room?.round_number, room?.status, starting]);

    const copyCode = () => {
        if (roomCode && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(roomCode);
            haptic('light');
            toast.success('Room code copied!');
        }
    };

    const shareInvite = async () => {
        if (!roomCode) return;
        const { joinUrl, text } = buildJoinInvite(roomCode);
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                await navigator.share({
                    title: 'Join my Venn room',
                    text,
                    url: joinUrl,
                });
                haptic('success');
                setInviteShared(true);
                trackEvent('room_invite_shared', { method: 'share_sheet', playerCount: seatedPlayers.length });
                toast.success('Invite shared!');
                setTimeout(() => setInviteShared(false), 2500);
                return;
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            haptic('success');
            setInviteShared(true);
            trackEvent('room_invite_shared', { method: 'clipboard', playerCount: seatedPlayers.length });
            toast.success('Invite link copied!');
            setTimeout(() => setInviteShared(false), 2500);
        }
    };

    const handleStart = () => {
        if (seatedPlayers.length < 2) {
            toast.warn('Need at least 2 players to start');
            return;
        }
        trackEvent('room_first_round_started', {
            playerCount: seatedPlayers.length,
            passThePhone: Boolean(passThePhone),
        });
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
                    <span className="text-6xl sm:text-7xl font-display font-bold tracking-[0.16em] text-gradient-vibrant">
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
                <p className="text-white/50 text-sm mb-3">
                    {passThePhone
                        ? 'Pass this phone. Each writer gets 30 seconds, then we reveal on this screen.'
                        : 'Share this code. Pass one phone around, or everyone stays on their own. The round starts when the host hits Go.'}
                </p>
                <button
                    type="button"
                    onClick={shareInvite}
                    className={`wordle-button min-h-[52px] w-full px-6 inline-flex items-center justify-center gap-2 ${seatedPlayers.length < 2 ? 'wordle-primary' : ''}`}
                >
                    <Share2 className="w-4 h-4" />
                    {inviteShared ? 'Invite ready!' : seatedPlayers.length < 2 ? 'Share invite — get the next writer' : 'Share invite'}
                </button>
                <div className="mt-4 p-4 rounded-[22px] bg-white/[0.05] border border-white/[0.08] text-left text-sm text-white/55">
                    <div className="font-semibold text-white/80 mb-1">How to invite</div>
                    <p>Share the link, or add a name on this phone. The first writer starts as soon as two people are in.</p>
                </div>
            </div>

            <div className="flex gap-3 mb-6 text-sm">
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg">{room?.total_rounds || 3}</div>
                    <div className="text-white/45 text-xs mt-0.5">Rounds</div>
                </div>
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg">{room?.scoring_mode === 'human' ? 'Room vote' : 'AI'}</div>
                    <div className="text-white/45 text-xs mt-0.5">Scoring</div>
                </div>
                <div className="game-stat-tile">
                    <div className="text-white font-semibold text-lg capitalize">{room?.theme_id || 'neon'}</div>
                    <div className="text-white/45 text-xs mt-0.5">Theme</div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 text-white/55 text-sm">
                    <Users className="w-4 h-4" />
                    <span>Players ({seatedPlayers.length})</span>
                </div>
                <div className="space-y-2" role="list" aria-label="Players in room" aria-live="polite">
                    {seatedPlayers.map((p) => (
                        <div key={p.id} className="game-player-row" role="listitem">
                            <span className="text-2xl">{p.avatar || '👽'}</span>
                            <span className="text-white font-semibold flex-1">{p.player_name}</span>
                            {p.is_host && (
                                <Crown className="w-5 h-5 text-amber-300" aria-label="Host" />
                            )}
                        </div>
                    ))}
                    {watchers.length > 0 && (
                        <div className="text-white/40 text-xs pt-1">
                            Watching: {watchers.map((watcher) => watcher.player_name).join(', ')}
                        </div>
                    )}
                    {seatedPlayers.length === 1 && (
                        <div className="text-center py-4 text-white/55 text-sm space-y-2">
                            <p className="animate-pulse">Waiting for the next writer...</p>
                            <p className="text-white/40 text-xs">
                                Add their name on this phone, or send the invite.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isHost && (
                <div className="mb-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <label className="flex items-center justify-between gap-3 text-sm text-white/80">
                        <span>Pass the phone</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={passThePhone}
                            onClick={() => setPassThePhone?.(!passThePhone)}
                            className={`relative h-7 w-12 rounded-full transition-colors ${passThePhone ? 'bg-amber-400' : 'bg-white/15'}`}
                        >
                            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${passThePhone ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </label>
                    <p className="mt-2 text-white/45 text-xs">
                        Same couch, same screen. Add each writer, then hand the phone around.
                    </p>
                    <form
                        className="mt-3 flex gap-2"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            if (!couchName.trim() || addingWriter) return;
                            setAddingWriter(true);
                            const ok = await addCouchWriter?.(couchName);
                            setAddingWriter(false);
                            if (ok) {
                                trackEvent('room_couch_writer_added', { playerCount: seatedPlayers.length + 1 });
                                setCouchName('');
                            }
                        }}
                    >
                        <input
                            value={couchName}
                            onChange={(event) => setCouchName(event.target.value)}
                            placeholder="Add the next writer"
                            className="game-input-hero min-h-[44px] flex-1 text-sm"
                            aria-label="Writer name"
                        />
                        <button
                            type="submit"
                            disabled={addingWriter || !couchName.trim()}
                            className="wordle-button min-h-[44px] px-4 disabled:opacity-50"
                        >
                            {addingWriter ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>
            )}

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
                        disabled={starting || seatedPlayers.length < 2}
                        className={`wordle-button w-full text-lg flex items-center justify-center gap-2 disabled:hover:scale-100 ${seatedPlayers.length >= 2 ? 'wordle-primary' : ''}`}
                    >
                        <Play className="w-5 h-5" />
                        {starting && countdown === null
                            ? 'Starting...'
                            : countdown !== null && countdown > 0
                                ? `${countdown}...`
                                : seatedPlayers.length < 2
                                    ? 'Need one more writer'
                                    : 'Start Game'}
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

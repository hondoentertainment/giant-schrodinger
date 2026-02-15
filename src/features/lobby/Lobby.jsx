import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useRoom } from '../../context/RoomContext';
import { THEMES, getThemeById } from '../../data/themes';
import { getStats, getMilestones, isAvatarUnlocked, isThemeUnlocked } from '../../services/stats';
import { isBackendEnabled } from '../../lib/supabase';
import { Users, Wifi, WifiOff } from 'lucide-react';

const AVATARS = ['👽', '🎨', '🧠', '👾', '🤖', '🔮', '🎪', '🎭', '🎯', '⭐', '🏆', '🔥'];

export function Lobby() {
    const {
        user,
        login,
        setGameState,
        sessionId,
        roundNumber,
        totalRounds,
        sessionScore,
        roundComplete,
        sessionResults,
        startSession,
        beginRound,
        advanceRound,
        endSession,
    } = useGame();
    const { hostRoom, joinRoomByCode } = useRoom();

    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || AVATARS[0]);
    const [themeId, setThemeId] = useState(user?.themeId || THEMES[0].id);
    const [scoringMode] = useState('ai');
    const [sessionLength, setSessionLength] = useState(3);
    const [inviteCopied, setInviteCopied] = useState(false);

    // Multiplayer state
    const [showMultiplayer, setShowMultiplayer] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [mpLoading, setMpLoading] = useState(false);

    const theme = getThemeById(themeId);
    const stats = getStats();
    const milestones = getMilestones();
    const backendReady = isBackendEnabled();

    const handleInvite = () => {
        const url = window.location.origin + window.location.pathname;
        const msg = `Play Venn with Friends with me! ${url}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(msg);
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        login({ name, avatar, themeId, gradient: theme.gradient, scoringMode });
    };

    const startGame = () => {
        if (!sessionId) {
            startSession(sessionLength);
            beginRound();
            return;
        }

        if (roundComplete && roundNumber >= totalRounds) {
            return;
        }

        if (roundComplete && roundNumber < totalRounds) {
            advanceRound();
            beginRound();
            return;
        }

        beginRound();
    };

    const handleCreateRoom = async () => {
        if (!user?.name) return;
        setMpLoading(true);
        await hostRoom({
            hostName: user.name,
            themeId: user.themeId || themeId,
            totalRounds: sessionLength,
            scoringMode: 'ai',
        });
        setMpLoading(false);
    };

    const handleJoinRoom = async () => {
        if (!user?.name || !joinCode.trim()) return;
        setMpLoading(true);
        await joinRoomByCode(joinCode.trim(), user.name, user.avatar || avatar);
        setMpLoading(false);
    };

    // ============================================================
    // Logged-in view
    // ============================================================
    if (user) {
        return (
            <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <div className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${getThemeById(user?.themeId).gradient} flex items-center justify-center text-5xl mb-4 shadow-lg`}>
                        {user.avatar}
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                        Hi, {user.name}!
                    </h2>
                    <p className="text-white/60 mb-4">Ready to make some connections?</p>
                    <div className="mb-4 flex flex-wrap gap-3 justify-center text-sm text-white/60">
                        <span>Scoring: <span className="text-white font-semibold">AI Judge</span></span>
                        {stats.currentStreak > 0 && (
                            <span className="text-amber-400 font-semibold">🔥 {stats.currentStreak} day streak</span>
                        )}
                        <span>{stats.totalRounds} rounds played</span>
                    </div>
                    <button
                        onClick={handleInvite}
                        className="mb-4 text-sm text-white/50 hover:text-white underline"
                    >
                        {inviteCopied ? 'Copied!' : 'Invite friends to play'}
                    </button>
                    {sessionId && (
                        <div className="mb-6 text-sm text-white/60">
                            Session: <span className="text-white font-semibold">Round {roundNumber} of {totalRounds}</span> ·
                            <span className="text-white font-semibold"> {sessionScore} pts</span>
                        </div>
                    )}

                    {/* Solo play */}
                    {!showMultiplayer && (
                        <>
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={startGame}
                                    disabled={sessionId && roundComplete && roundNumber >= totalRounds}
                                    className="flex-1 py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {sessionId
                                        ? roundComplete && roundNumber === totalRounds
                                            ? 'Session Complete'
                                            : `Start Round ${roundComplete ? roundNumber + 1 : roundNumber}`
                                        : 'Solo Session'}
                                </button>
                                <button
                                    onClick={() => setGameState('GALLERY')}
                                    className="px-4 py-4 bg-white/10 text-white font-bold text-xl rounded-xl hover:bg-white/20 transition-colors"
                                    title="Gallery"
                                >
                                    🖼️
                                </button>
                            </div>

                            {/* Multiplayer button */}
                            <button
                                onClick={() => setShowMultiplayer(true)}
                                className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Users className="w-5 h-5" />
                                Play with Friends
                                {!backendReady && <WifiOff className="w-4 h-4 opacity-50" />}
                            </button>
                        </>
                    )}

                    {/* Multiplayer panel */}
                    {showMultiplayer && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2 justify-center mb-4 text-white/60 text-sm">
                                {backendReady ? (
                                    <><Wifi className="w-4 h-4 text-emerald-400" /> Connected</>
                                ) : (
                                    <><WifiOff className="w-4 h-4 text-red-400" /> Backend not configured</>
                                )}
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={mpLoading || !backendReady}
                                    className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {mpLoading ? 'Creating...' : 'Create Room'}
                                </button>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="Room code"
                                        maxLength={6}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg text-center tracking-widest font-bold uppercase"
                                    />
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={mpLoading || !backendReady || joinCode.trim().length < 4}
                                        className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Join
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowMultiplayer(false)}
                                    className="w-full text-sm text-white/40 hover:text-white underline"
                                >
                                    Back to solo play
                                </button>
                            </div>
                        </div>
                    )}

                    {sessionId && roundComplete && roundNumber === totalRounds && (
                        <div className="mt-4 text-sm text-white/60">
                            Session complete! Average score: <span className="text-white font-semibold">{(sessionScore / sessionResults.length).toFixed(1)}</span>
                        </div>
                    )}

                    <button
                        onClick={() => login(null)} // simplistic logout to edit profile
                        className="mt-4 text-sm text-white/40 hover:text-white underline"
                    >
                        Edit Profile
                    </button>
                    {sessionId && (
                        <button
                            onClick={endSession}
                            className="mt-2 text-sm text-white/40 hover:text-white underline"
                        >
                            Start New Session
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================
    // Create Profile view
    // ============================================================
    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">Create Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Username</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg"
                        placeholder="Enter your name..."
                        maxLength={12}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Avatar</label>
                    <div className="grid grid-cols-4 gap-2">
                        {AVATARS.map((a) => {
                            const locked = !isAvatarUnlocked(a, stats);
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => !locked && setAvatar(a)}
                                    disabled={locked}
                                    className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all relative
                                        ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                        ${avatar === a ? 'bg-white/20 shadow-inner scale-95 ring-2 ring-purple-500' : 'bg-white/5 hover:bg-white/10'}
                                    `}
                                    title={locked ? 'Unlock with milestones' : a}
                                >
                                    {a}
                                    {locked && <span className="absolute bottom-0 right-0 text-xs">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Theme</label>
                    <div className="flex gap-2 justify-between flex-wrap">
                        {THEMES.map((t) => {
                            const locked = !isThemeUnlocked(t.id, stats);
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => !locked && setThemeId(t.id)}
                                    disabled={locked}
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} transition-all relative
                                        ${locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                        ${themeId === t.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}
                                    `}
                                    title={locked ? 'Unlock with 7-day streak' : t.label}
                                >
                                    {locked && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-center text-white/50 text-sm">
                        {theme.label}
                        {theme.unlockMilestone && !isThemeUnlocked(theme.id, stats) && ' (locked)'}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Scoring</label>
                    <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white">
                        <div className="font-semibold">AI Judge</div>
                        <div className="text-xs text-white/50 mt-1">
                            Multiplayer currently uses AI scoring.
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Progress</label>
                    <div className="space-y-2 mb-4">
                        <div className="text-white/50 text-xs flex justify-between">
                            <span>Rounds: {stats.totalRounds}</span>
                            <span>Best streak: {stats.maxStreak} days</span>
                        </div>
                        {milestones.filter((m) => !stats.milestonesUnlocked.includes(m.id)).slice(0, 2).map((m) => (
                            <div key={m.id} className="text-xs text-white/40">
                                🔒 {m.label}: {m.type === 'rounds' ? stats.totalRounds : stats.currentStreak}/{m.threshold}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Session Length</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[3, 5, 7].map((rounds) => (
                            <button
                                key={rounds}
                                type="button"
                                onClick={() => setSessionLength(rounds)}
                                className={`py-3 rounded-xl text-sm font-semibold transition-all ${sessionLength === rounds
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {rounds} Rounds
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4"
                >
                    Join Lobby
                </button>
            </form>
        </div>
    );
}

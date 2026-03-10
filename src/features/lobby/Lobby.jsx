import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useRoom } from '../../context/RoomContext';
import { THEMES, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getStats, getMilestones, isAvatarUnlocked, isThemeUnlocked } from '../../services/stats';
import { getDailyChallenge, hasDailyChallengeBeenPlayed } from '../../services/dailyChallenge';
import { getTimeUntilNextChallenge, formatCountdown } from '../../services/countdown';
import { getPlayerRank, getDailyLeaderboard } from '../../services/leaderboard';
import { getStreakBonus } from '../../services/challenges';
import { parseReferralFromUrl, trackReferral, hasReferralBonus, claimReferralBonus, generateReferralCode } from '../../services/referrals';
import { trackEvent } from '../../services/analytics';
import { toggleMute, isMuted } from '../../services/sounds';
import { isBackendEnabled } from '../../lib/supabase';
import { Users, Wifi, WifiOff, HelpCircle, Image, Film, Music, CalendarDays, Zap, Pencil, Unlock, Volume2, VolumeX, Trophy, Award, Palette, ShoppingBag, Brain } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { OnboardingModal } from '../../components/OnboardingModal';
import { UnlockModal } from '../../components/UnlockModal';
import { CustomImagesManager } from '../../components/CustomImagesManager';
import { getCustomImages } from '../../services/customImages';

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
    const [scoringMode, setScoringMode] = useState(user?.scoringMode || 'human');
    const [mediaType, setMediaType] = useState(user?.mediaType || MEDIA_TYPES.IMAGE);
    const [useCustomImages, setUseCustomImages] = useState(user?.useCustomImages ?? false);
    const [customImages, setCustomImages] = useState(() => getCustomImages());

    useEffect(() => {
        if (user?.useCustomImages !== undefined) setUseCustomImages(user.useCustomImages);
    }, [user?.useCustomImages]);

    const handleUseCustomImagesChange = (value) => {
        setUseCustomImages(value);
        if (user) login({ ...user, useCustomImages: value });
    };

    const refreshCustomImages = () => setCustomImages(getCustomImages());
    const [sessionLength, setSessionLength] = useState(3);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingDismissCallback, setOnboardingDismissCallback] = useState(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Multiplayer state
    const [showMultiplayer, setShowMultiplayer] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [mpLoading, setMpLoading] = useState(false);
    const [mpLoadingAction, setMpLoadingAction] = useState(null); // 'create' | 'join'
    const [soundMuted, setSoundMuted] = useState(isMuted());
    const [countdown, setCountdown] = useState(() => formatCountdown(getTimeUntilNextChallenge()));

    const theme = getThemeById(themeId);
    const stats = useMemo(() => getStats(), [sessionId, roundNumber]);
    const milestones = useMemo(() => getMilestones(), [sessionId, roundNumber]);
    const backendReady = isBackendEnabled();
    const streakBonus = useMemo(() => getStreakBonus(stats), [stats]);

    // Update countdown every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(formatCountdown(getTimeUntilNextChallenge()));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Handle referral on mount
    useEffect(() => {
        const refCode = parseReferralFromUrl();
        if (refCode) {
            trackReferral(refCode);
            trackEvent('referral_click', { code: refCode });
        }
    }, []);

    const handleInvite = () => {
        const refCode = user?.name ? generateReferralCode(user.name) : '';
        const base = window.location.origin + window.location.pathname;
        const url = refCode ? `${base}?ref=${refCode}` : base;
        const msg = `Play Venn with Friends with me! ${url}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(msg);
            haptic('light');
            setInviteCopied(true);
            trackEvent('share_click', { type: 'invite' });
            setTimeout(() => setInviteCopied(false), 2500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;
        login({ name: trimmedName, avatar, themeId, gradient: theme.gradient, scoringMode, mediaType, useCustomImages });
    };

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const dailyPlayed = useMemo(() => hasDailyChallengeBeenPlayed(), []);

    const startGame = () => {
        if (!sessionId && stats.totalRounds === 0) {
            setOnboardingDismissCallback(() => handleOnboardingDismiss);
            setShowOnboarding(true);
            return;
        }

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

    const startDailyChallenge = () => {
        if (!sessionId && stats.totalRounds === 0) {
            setOnboardingDismissCallback(() => {
                setShowOnboarding(false);
                startSession(3, true);
                beginRound();
            });
            setShowOnboarding(true);
            return;
        }
        startSession(3, true);
        beginRound();
    };

    const handleOnboardingDismiss = () => {
        setShowOnboarding(false);
        startSession(sessionLength);
        beginRound();
    };

    const handleCreateRoom = async () => {
        if (!user?.name) return;
        setMpLoading(true);
        setMpLoadingAction('create');
        await hostRoom({
            hostName: user.name,
            themeId: user.themeId || themeId,
            totalRounds: sessionLength,
            scoringMode,
        });
        setMpLoading(false);
        setMpLoadingAction(null);
    };

    const handleJoinRoom = async () => {
        if (!user?.name || !joinCode.trim()) return;
        setMpLoading(true);
        setMpLoadingAction('join');
        await joinRoomByCode(joinCode.trim(), user.name, user.avatar || avatar);
        setMpLoading(false);
        setMpLoadingAction(null);
    };

    // ============================================================
    // Logged-in view
    // ============================================================
    if (user) {
        return (
            <>
                {showOnboarding && onboardingDismissCallback && (
                    <OnboardingModal onDismiss={onboardingDismissCallback} />
                )}
                {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    {/* Top bar: Edit Profile + Sound toggle */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => login(null)}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Edit profile"
                            title="Edit profile"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { const m = toggleMute(); setSoundMuted(m); }}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
                            title={soundMuted ? 'Unmute' : 'Mute'}
                        >
                            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="relative inline-block mb-3">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getThemeById(user?.themeId).gradient} flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/5`}>
                            {user.avatar}
                        </div>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1">
                        Hi, {user.name}!
                    </h2>

                    {/* Streak Hero Display */}
                    {stats.currentStreak > 0 ? (
                        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25">
                            <div className="text-5xl font-black text-amber-400 mb-1">
                                🔥 {stats.currentStreak}
                            </div>
                            <div className="text-amber-300/80 text-sm font-semibold">Day Streak</div>
                            {streakBonus > 1 && (
                                <div className="text-amber-400/60 text-xs mt-1">
                                    +{Math.round((streakBonus - 1) * 100)}% streak bonus active
                                </div>
                            )}
                            {stats.currentStreak < 7 && (
                                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                                        style={{ width: `${(stats.currentStreak / 7) * 100}%` }}
                                    />
                                </div>
                            )}
                            {stats.currentStreak < 7 && (
                                <div className="text-white/30 text-xs mt-1">{7 - stats.currentStreak} days to Mystery Box unlock</div>
                            )}
                        </div>
                    ) : (
                        <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-white/50 text-sm">Play today to start a streak!</div>
                            <div className="text-white/30 text-xs mt-1">Streaks unlock bonuses and rewards</div>
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap gap-3 justify-center text-sm text-white/60">
                        <span>Media: <span className="text-white font-semibold">
                            {(user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE ? 'Images' :
                             (user?.mediaType) === MEDIA_TYPES.VIDEO ? 'Videos' : 'Audio'}
                        </span></span>
                        <span>{stats.totalRounds} rounds played</span>
                        {stats.maxStreak > 0 && <span>Best streak: <span className="text-amber-400 font-semibold">{stats.maxStreak}d</span></span>}
                    </div>
                    {/* Scoring mode toggle */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">Scoring</label>
                        <div className="flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setScoringMode('human');
                                    login({ ...user, scoringMode: 'human' });
                                }}
                                aria-pressed={scoringMode === 'human'}
                                aria-label="Manual judge — you or a friend score each round"
                                className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'human'
                                    ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Manual Judge
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setScoringMode('ai');
                                    login({ ...user, scoringMode: 'ai' });
                                }}
                                aria-pressed={scoringMode === 'ai'}
                                aria-label="AI judge — Gemini scores your connections automatically"
                                className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'ai'
                                    ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                AI Judge
                            </button>
                        </div>
                        <p className="text-center text-white/40 text-xs mt-1">
                            {scoringMode === 'human'
                                ? 'You or a friend score each round manually.'
                                : 'Gemini AI scores your connections automatically.'
                            }
                        </p>
                    </div>
                    {(user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE && (
                        <div className="mb-4">
                            <CustomImagesManager
                                customImages={customImages}
                                onRefresh={refreshCustomImages}
                                useCustomImages={useCustomImages}
                                onUseCustomImagesChange={handleUseCustomImagesChange}
                            />
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                        <button
                            onClick={handleInvite}
                            className="text-sm text-white/50 hover:text-white underline min-h-[44px] flex items-center"
                            aria-label={inviteCopied ? 'Link copied to clipboard' : 'Invite friends to play'}
                        >
                            {inviteCopied ? 'Copied!' : 'Invite friends to play'}
                        </button>
                        <button
                            onClick={() => {
                                setOnboardingDismissCallback(() => () => setShowOnboarding(false));
                                setShowOnboarding(true);
                            }}
                            className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[44px]"
                            aria-label="How it works"
                        >
                            <HelpCircle className="w-4 h-4" />
                            How it works
                        </button>
                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[44px]"
                            aria-label="How to unlock avatars and themes"
                        >
                            <Unlock className="w-4 h-4" />
                            Unlocks
                        </button>
                    </div>
                    {sessionId && (
                        <div className="mb-6 text-sm text-white/60">
                            Session: <span className="text-white font-semibold">Round {roundNumber} of {totalRounds}</span> ·
                            <span className="text-white font-semibold"> {sessionScore} pts</span>
                        </div>
                    )}

                    {/* Daily Challenge */}
                    {!showMultiplayer && !dailyPlayed && (
                        <button
                            onClick={startDailyChallenge}
                            disabled={!!sessionId}
                            className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <CalendarDays className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-bold flex items-center gap-2">
                                        Daily Challenge
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">NEW</span>
                                    </div>
                                    <div className="text-white/50 text-sm">{dailyChallenge.prompt}</div>
                                </div>
                                <Zap className="w-5 h-5 text-amber-400" />
                            </div>
                        </button>
                    )}
                    {!showMultiplayer && dailyPlayed && (
                        <div className="w-full mb-4 p-4 rounded-2xl border border-white/10 bg-white/5 text-center">
                            <div className="text-white/40 text-sm mb-1">
                                <CalendarDays className="w-4 h-4 inline mr-2" />
                                Daily challenge completed!
                            </div>
                            <div className="text-white/60 text-lg font-bold">
                                Next challenge in {countdown}
                            </div>
                        </div>
                    )}

                    {/* Solo play */}
                    {!showMultiplayer && (
                        <>
                            {/* Session length (only when not in active session) */}
                            {!sessionId && (
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">Session length</label>
                                    <div className="flex gap-2 justify-center">
                                        {[3, 5, 7].map((rounds) => (
                                            <button
                                                key={rounds}
                                                type="button"
                                                onClick={() => setSessionLength(rounds)}
                                                aria-pressed={sessionLength === rounds}
                                                aria-label={`${rounds} rounds`}
                                                className={`min-w-[52px] min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                                                    sessionLength === rounds
                                                        ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                                        : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                            >
                                                {rounds}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-white/40 text-xs mt-1">{sessionLength} rounds · beat your average</p>
                                </div>
                            )}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={startGame}
                                    disabled={sessionId && roundComplete && roundNumber >= totalRounds}
                                    className="flex-1 py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[52px]"
                                    aria-label={sessionId
                                        ? roundComplete && roundNumber === totalRounds
                                            ? 'Session complete'
                                            : `Start round ${roundComplete ? roundNumber + 1 : roundNumber}`
                                        : `Start solo session (${sessionLength} rounds)`}
                                >
                                    {sessionId
                                        ? roundComplete && roundNumber === totalRounds
                                            ? 'Session Complete'
                                            : `Start Round ${roundComplete ? roundNumber + 1 : roundNumber}`
                                        : `Solo Session (${sessionLength} rounds)`}
                                </button>
                                <button
                                    onClick={() => setGameState('GALLERY')}
                                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex items-center justify-center"
                                    aria-label="View connection gallery"
                                    title="Gallery"
                                >
                                    🖼️
                                </button>
                                <button
                                    onClick={() => setGameState('LEADERBOARD')}
                                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex items-center justify-center"
                                    aria-label="View leaderboard"
                                    title="Leaderboard"
                                >
                                    <Trophy className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quick nav row */}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => setGameState('ACHIEVEMENTS')}
                                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                                    title="Achievements"
                                >
                                    <Award className="w-4 h-4" /> Achievements
                                </button>
                                <button
                                    onClick={() => setGameState('THEME_BUILDER')}
                                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                                    title="Theme Builder"
                                >
                                    <Palette className="w-4 h-4" /> Creator
                                </button>
                                <button
                                    onClick={() => setGameState('SHOP')}
                                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                                    title="Shop"
                                >
                                    <ShoppingBag className="w-4 h-4" /> Shop
                                </button>
                                <button
                                    onClick={() => setGameState('AI_SETTINGS')}
                                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                                    title="AI Settings"
                                >
                                    <Brain className="w-4 h-4" /> AI
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
                            <div className="flex flex-col items-center gap-1 mb-4 text-white/60 text-sm">
                                {backendReady ? (
                                    <><Wifi className="w-4 h-4 text-emerald-400" /> Connected</>
                                ) : (
                                    <>
                                        <span className="flex items-center gap-2"><WifiOff className="w-4 h-4 text-amber-400" /> Multiplayer needs server</span>
                                        <span className="text-white/40 text-xs">Play solo above — it works without setup</span>
                                    </>
                                )}
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={mpLoading || !backendReady}
                                    className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {mpLoading && mpLoadingAction === 'create' ? 'Creating...' : 'Create Room'}
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
                                        className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                                        aria-busy={mpLoading && mpLoadingAction === 'join'}
                                        aria-label={mpLoading && mpLoadingAction === 'join' ? 'Joining room...' : 'Join room'}
                                    >
                                        {mpLoading && mpLoadingAction === 'join' ? 'Joining...' : 'Join'}
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
                        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                            <div className="text-2xl mb-1">🎉</div>
                            <div className="text-white font-semibold">Session complete!</div>
                            <div className="text-white/70 text-sm mt-1">
                                Average score: <span className="text-amber-400 font-bold">{(sessionScore / sessionResults.length).toFixed(1)}</span>/10
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 justify-center">
                        {sessionId && (
                            <button
                                onClick={endSession}
                                className="text-sm text-white/40 hover:text-white underline min-h-[44px] flex items-center"
                                aria-label="Start new session"
                            >
                                Start New Session
                            </button>
                        )}
                    </div>
                </div>
            </div>
            </>
        );
    }

    // ============================================================
    // Create Profile view
    // ============================================================
    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
            {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">Create Profile</h2>
            <p className="text-white/50 text-sm text-center mb-6">Customize your experience and unlock rewards by playing</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <section aria-labelledby="profile-username">
                    <label id="profile-username" className="block text-sm font-medium text-white/60 mb-2">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg pr-14"
                            placeholder="Enter your name..."
                            maxLength={12}
                            aria-describedby="name-char-count"
                            aria-invalid={!name.trim()}
                        />
                        <span
                            id="name-char-count"
                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm tabular-nums ${name.length >= 10 ? 'text-amber-400' : 'text-white/40'}`}
                            aria-live="polite"
                        >
                            {name.length}/12
                        </span>
                    </div>
                </section>

                <section aria-labelledby="profile-avatar">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-avatar" className="block text-sm font-medium text-white/60">Avatar</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="How to unlock more avatars"
                        >
                            <Unlock className="w-3 h-3" />
                            Unlock more
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2" role="group">
                        {AVATARS.map((a) => {
                            const locked = !isAvatarUnlocked(a, stats);
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => !locked && setAvatar(a)}
                                    disabled={locked}
                                    aria-pressed={avatar === a}
                                    aria-label={locked ? `Locked. Unlock with milestones.` : `Select avatar ${a}`}
                                    className={`aspect-square min-w-[44px] min-h-[44px] rounded-xl text-2xl flex items-center justify-center transition-all relative
                                        ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                        ${avatar === a ? 'bg-white/20 shadow-inner scale-95 ring-2 ring-purple-500' : 'bg-white/5 hover:bg-white/10'}
                                    `}
                                    title={locked ? 'Unlock with milestones' : a}
                                >
                                    {a}
                                    {locked && <span className="absolute bottom-0 right-0 text-xs" aria-hidden="true">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="profile-theme">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-theme" className="block text-sm font-medium text-white/60">Theme</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="How to unlock Mystery Box theme"
                        >
                            <Unlock className="w-3 h-3" />
                            Unlock
                        </button>
                    </div>
                    <div className="flex gap-2 justify-between flex-wrap" role="group">
                        {THEMES.map((t) => {
                            const locked = !isThemeUnlocked(t.id, stats);
                            const timeLimit = t.modifier?.timeLimit || 60;
                            const mult = t.modifier?.scoreMultiplier || 1;
                            const title = locked
                                ? 'Play 1 round per day for 7 days to unlock'
                                : `${t.label}: ${timeLimit}s · x${mult.toFixed(1)} multiplier`;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => !locked && setThemeId(t.id)}
                                    disabled={locked}
                                    aria-pressed={themeId === t.id}
                                    aria-label={locked ? `${t.label} — locked` : title}
                                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-gradient-to-br ${t.gradient} transition-all relative
                                        ${locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                        ${themeId === t.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}
                                    `}
                                    title={title}
                                >
                                    {locked && <span className="absolute -top-1 -right-1 text-xs" aria-hidden="true">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-center text-white/50 text-sm">
                        {theme.label}
                        {theme.unlockMilestone && !isThemeUnlocked(theme.id, stats)
                            ? ` — Play 1 round/day for 7 days to unlock`
                            : ` · ${theme.modifier?.timeLimit || 60}s · x${(theme.modifier?.scoreMultiplier || 1).toFixed(1)}`
                        }
                    </div>
                </section>

                <section aria-labelledby="profile-scoring">
                    <label id="profile-scoring" className="block text-sm font-medium text-white/60 mb-2">Scoring</label>
                    <div className="grid grid-cols-2 gap-3" role="group">
                        <button
                            type="button"
                            onClick={() => setScoringMode('human')}
                            aria-pressed={scoringMode === 'human'}
                            aria-label="Manual judge — you or a friend score each round"
                            className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'human'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            Manual Judge
                        </button>
                        <button
                            type="button"
                            onClick={() => setScoringMode('ai')}
                            aria-pressed={scoringMode === 'ai'}
                            aria-label="AI judge — Gemini scores your connections automatically"
                            className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'ai'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            AI Judge
                        </button>
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {scoringMode === 'human'
                            ? 'You or a friend score each round manually.'
                            : 'Gemini AI scores your connections automatically.'
                        }
                    </p>
                </section>

                {mediaType === MEDIA_TYPES.IMAGE && (
                    <section aria-labelledby="profile-custom-images">
                        <CustomImagesManager
                            customImages={customImages}
                            onRefresh={refreshCustomImages}
                            useCustomImages={useCustomImages}
                            onUseCustomImagesChange={setUseCustomImages}
                        />
                    </section>
                )}

                <section aria-labelledby="profile-media">
                    <label id="profile-media" className="block text-sm font-medium text-white/60 mb-2">Media Type</label>
                    <div className="grid grid-cols-3 gap-3" role="group">
                        {[
                            { type: MEDIA_TYPES.IMAGE, label: 'Images', Icon: Image, desc: 'Classic visual Venn' },
                            { type: MEDIA_TYPES.VIDEO, label: 'Videos', Icon: Film, desc: 'Looping video clips' },
                            { type: MEDIA_TYPES.AUDIO, label: 'Audio', Icon: Music, desc: 'Sound-based connections' },
                        ].map(({ type, label, Icon, desc }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setMediaType(type)}
                                aria-pressed={mediaType === type}
                                aria-label={`${label} — ${desc}`}
                                className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${mediaType === type
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {mediaType === MEDIA_TYPES.IMAGE && 'Classic mode — connect two images with a phrase.'}
                        {mediaType === MEDIA_TYPES.VIDEO && 'Video mode — connect two video clips with a phrase.'}
                        {mediaType === MEDIA_TYPES.AUDIO && 'Audio mode — connect two sounds with a phrase.'}
                    </p>
                </section>

                <section aria-labelledby="profile-progress">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-progress" className="block text-sm font-medium text-white/60">Progress</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="View unlock progress"
                        >
                            <Unlock className="w-3 h-3" />
                            Details
                        </button>
                    </div>
                    <p className="text-white/50 text-xs mb-2">
                        Streak = play at least 1 round per day. Mystery Box unlocks at 7-day streak!
                    </p>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Rounds played</span>
                            <span className="text-white font-semibold">{stats.totalRounds}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Best streak</span>
                            <span className="text-amber-400 font-semibold">{stats.maxStreak} days</span>
                        </div>
                        {stats.currentStreak > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-white/60">Current streak</span>
                                <span className="text-emerald-400 font-semibold">🔥 {stats.currentStreak} days</span>
                            </div>
                        )}
                        {milestones.filter((m) => !stats.milestonesUnlocked.includes(m.id)).length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                                {milestones.filter((m) => !stats.milestonesUnlocked.includes(m.id)).slice(0, 2).map((m) => {
                                    const value = m.type === 'rounds' ? stats.totalRounds : stats.currentStreak;
                                    const pct = Math.min(100, (value / m.threshold) * 100);
                                    return (
                                        <div key={m.id} className="flex items-center gap-2">
                                            <span className="text-xs text-white/40 w-24 truncate">🔒 {m.label}</span>
                                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/50 tabular-nums">{value}/{m.threshold}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <section aria-labelledby="profile-session">
                    <label id="profile-session" className="block text-sm font-medium text-white/60 mb-2">Session Length</label>
                    <div className="grid grid-cols-3 gap-3" role="group">
                        {[3, 5, 7].map((rounds) => (
                            <button
                                key={rounds}
                                type="button"
                                onClick={() => setSessionLength(rounds)}
                                aria-pressed={sessionLength === rounds}
                                aria-label={`${rounds} rounds per session`}
                                className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${sessionLength === rounds
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {rounds} Rounds
                            </button>
                        ))}
                    </div>
                </section>

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

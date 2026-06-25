import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useRoom } from '../../context/RoomContext';
import { THEMES, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getStats, getMilestones, isAvatarUnlocked, isThemeUnlocked } from '../../services/stats';
import { getDailyChallenge, getDailyChallengeSummary, hasDailyChallengeBeenPlayed } from '../../services/dailyChallenge';
import { isBackendEnabled } from '../../lib/supabase';
import { Users, Wifi, WifiOff, HelpCircle, Image, Film, Music, Laugh, CalendarDays, Zap, Pencil, Unlock, Trophy, Award, Palette, ShoppingBag, Brain, Shield, Link, BarChart3 } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { OnboardingModal } from '../../components/OnboardingModal';
import { UnlockModal } from '../../components/UnlockModal';
import { CustomImagesManager } from '../../components/CustomImagesManager';
import { getCustomImages } from '../../services/customImages';
import { ServiceStatusCard } from '../../components/ServiceStatusCard';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { isE2EMockRoomEnabled } from '../../lib/e2eMockRoom';
import { trackEvent } from '../../services/analytics';
import { getCurrentWeeklyEvent, getTimeUntilNextWeek, formatWeeklyCountdown } from '../../services/weeklyEvents';
import { useTranslation } from '../../hooks/useTranslation';

const AVATARS = ['👽', '🎨', '🧠', '👾', '🤖', '🔮', '🎪', '🎭', '🎯', '⭐', '🏆', '🔥'];

export function Lobby() {
    const { t: tr } = useTranslation();
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
    const [showAllFeatures, setShowAllFeatures] = useState(() => localStorage.getItem('vwf_show_all_features') === 'true');
    const [welcomeDismissed, setWelcomeDismissed] = useState(false);

    // Multiplayer state
    const [showMultiplayer, setShowMultiplayer] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [mpLoading, setMpLoading] = useState(false);
    const [mpLoadingAction, setMpLoadingAction] = useState(null); // 'create' | 'join'

    const theme = getThemeById(themeId);
    const stats = getStats();
    const milestones = getMilestones();
    const backendReady = isBackendEnabled() || isE2EMockRoomEnabled();
    const lobbyTier = stats.totalRounds >= 5 ? 3 : stats.totalRounds >= 3 ? 2 : stats.totalRounds >= 1 ? 1 : 0;
    const isFirstSession = lobbyTier === 0 && !sessionId;
    const weeklyEvent = useMemo(() => getCurrentWeeklyEvent(), []);
    const weeklyCountdown = useMemo(() => formatWeeklyCountdown(getTimeUntilNextWeek()), []);
    const welcomeMessage = useMemo(() => {
        if (!user || !stats.lastPlayedDate || stats.totalRounds === 0) return null;
        const lastPlayed = new Date(`${stats.lastPlayedDate}T00:00:00`);
        if (Number.isNaN(lastPlayed.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysAway = Math.round((today - lastPlayed) / (24 * 60 * 60 * 1000));
        if (daysAway <= 0) return `Welcome back, ${user.name}. Your streak is active today.`;
        if (daysAway === 1) return `Welcome back, ${user.name}. Keep yesterday's momentum going.`;
        return `Welcome back, ${user.name}. Fresh prompts are waiting.`;
    }, [stats.lastPlayedDate, stats.totalRounds, user]);
    const showFeatureNav = showAllFeatures || lobbyTier >= 2;
    const showAdvancedModes = showAllFeatures || lobbyTier >= 3;

    const handleShowAllFeatures = () => {
        const nextValue = !showAllFeatures;
        setShowAllFeatures(nextValue);
        localStorage.setItem('vwf_show_all_features', String(nextValue));
    };

    const handleInvite = () => {
        const url = window.location.origin + window.location.pathname;
        const msg = `Play Venn with Friends with me! ${url}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(msg);
            haptic('light');
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;
        trackEvent('first_session_profile_created', {
            scoringMode,
            mediaType,
            themeId,
        });
        login({ name: trimmedName, avatar, themeId, gradient: theme.gradient, scoringMode, mediaType, useCustomImages });
    };

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const dailySummary = useMemo(() => getDailyChallengeSummary(), []);
    const dailyPlayed = useMemo(() => hasDailyChallengeBeenPlayed(), []);

    const startGame = () => {
        if (!sessionId && stats.totalRounds === 0) {
            trackEvent('first_session_onboarding_opened', { source: 'solo' });
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
            trackEvent('first_session_onboarding_opened', { source: 'daily' });
            setOnboardingDismissCallback(() => {
                setShowOnboarding(false);
                trackEvent('first_session_onboarding_completed', { source: 'daily' });
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
        trackEvent('first_session_onboarding_completed', { source: 'solo' });
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
            <div className="w-full max-w-md space-y-6 wordle-card p-5 sm:p-7 animate-spring-in">
                <div className="text-center">
                    {welcomeMessage && !welcomeDismissed && !isFirstSession && (
                        <div className="mb-4 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-3 text-left flex items-center gap-3 backdrop-blur-xl">
                            <p className="text-emerald-200 text-sm flex-1">{welcomeMessage}</p>
                            <button
                                type="button"
                                onClick={() => setWelcomeDismissed(true)}
                                className="min-h-[44px] min-w-[44px] text-white/50 hover:text-white"
                                aria-label="Dismiss welcome back message"
                            >
                                &times;
                            </button>
                        </div>
                    )}
                    {/* Avatar with prominent Edit Profile */}
                    <div className="relative inline-block mb-4 group">
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getThemeById(user?.themeId).gradient} flex items-center justify-center text-5xl shadow-lg ring-4 ring-white/5 transition-transform group-hover:ring-white/10`}>
                            {user.avatar}
                        </div>
                        <button
                            onClick={() => login(null)}
                            className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Edit profile"
                            title="Edit profile"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                    <h2 className="text-2xl font-display font-bold tracking-tight text-white mb-2">
                        Hi, {user.name}
                    </h2>
                    <p className="text-white/55 mb-4">
                        {isFirstSession ? 'Your first run is a guided 3-round warmup.' : 'Ready to make some connections?'}
                    </p>
                    <p className="text-white/40 text-sm mb-4">
                        {isFirstSession
                            ? 'Write one clever phrase, score it, then send the best one to a friend.'
                            : `Complete ${sessionId ? totalRounds : sessionLength} rounds and try to beat your average score.`}
                    </p>
                    {!isFirstSession && <ServiceStatusCard className="mb-4" />}
                    {!isFirstSession && <PWAInstallBanner className="mb-4" />}
                    <div className="mb-4 grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-white/70">
                        <span className="wordle-tile min-h-[44px] flex-col px-2 text-[0.65rem]">
                            <span>Judge</span>
                            <span className="text-white/80">{scoringMode === 'human' ? 'Manual' : 'AI'}</span>
                        </span>
                        <span className="wordle-tile min-h-[44px] flex-col px-2 text-[0.65rem]">
                            <span>Media</span>
                            <span className="text-white/80">
                                {(user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE ? tr('lobby.images') :
                                 (user?.mediaType) === MEDIA_TYPES.VIDEO ? tr('lobby.videos') :
                                 (user?.mediaType) === MEDIA_TYPES.MEMES_VIDEOS ? tr('lobby.memesVideos') : tr('lobby.audio')}
                            </span>
                        </span>
                        <span className="wordle-tile min-h-[44px] flex-col px-2 text-[0.65rem]">
                            <span>Rounds</span>
                            <span className="text-white/80">{stats.totalRounds}</span>
                        </span>
                        {stats.currentStreak > 0 && (
                            <span className="col-span-3 wordle-tile wordle-tile-present min-h-[36px] px-2 text-[0.65rem]">{stats.currentStreak} day streak</span>
                        )}
                    </div>
                    {!isFirstSession && ([MEDIA_TYPES.IMAGE, MEDIA_TYPES.MEMES_VIDEOS, MEDIA_TYPES.VIDEO].includes(user?.mediaType || MEDIA_TYPES.IMAGE)) && (
                        <div className="mb-4">
                            <CustomImagesManager
                                customImages={customImages}
                                onRefresh={refreshCustomImages}
                                useCustomImages={useCustomImages}
                                onUseCustomImagesChange={handleUseCustomImagesChange}
                                mediaType={user?.mediaType || MEDIA_TYPES.IMAGE}
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

                    {!showMultiplayer && !sessionId && (
                        <div className="mb-3 text-center">
                            <div className="game-section-label">Start here</div>
                            <p className="text-white/55 text-sm mt-1">Play today&apos;s puzzle first, then practice or invite friends.</p>
                        </div>
                    )}

                    {/* Daily Challenge */}
                    {!showMultiplayer && !dailyPlayed && (
                        <button
                            onClick={startDailyChallenge}
                            disabled={!!sessionId}
                            aria-label="Start today's Venn daily puzzle"
                            className="game-hero-card w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="wordle-tile wordle-tile-present h-12 w-12 shrink-0 rounded-2xl">
                                    <CalendarDays className="w-6 h-6 text-amber-950" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-semibold flex items-center gap-2">
                                        Today&apos;s Venn
                                        <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300/40 bg-amber-300/20 text-amber-100 font-semibold">Daily Challenge</span>
                                    </div>
                                    <div className="text-white/50 text-sm">{dailyChallenge.prompt}</div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-200/70">
                                        <span>{dailySummary.completions} daily completion{dailySummary.completions === 1 ? '' : 's'}</span>
                                        {dailySummary.bestScore !== null && <span>Best daily: {dailySummary.bestScore}/10</span>}
                                    </div>
                                </div>
                                <Zap className="w-5 h-5 text-amber-400" />
                            </div>
                        </button>
                    )}
                    {!isFirstSession && !showMultiplayer && weeklyEvent && (
                        <div className="w-full mb-4 p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-left">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-purple-300 text-xs uppercase tracking-wider font-bold">This Week&apos;s Event</span>
                                <span className="text-white/40 text-xs">Ends in {weeklyCountdown}</span>
                            </div>
                            <div className="text-white font-bold">{weeklyEvent.name}</div>
                            <div className="text-white/60 text-sm">{weeklyEvent.description}</div>
                        </div>
                    )}
                    {!showMultiplayer && dailyPlayed && (
                        <div className="w-full mb-4 p-4 rounded-xl border border-amber-400/20 bg-amber-500/10 text-left text-sm">
                            <div className="flex items-center gap-2 text-amber-200 font-semibold">
                                <CalendarDays className="w-4 h-4" />
                                Daily challenge complete
                            </div>
                            <p className="mt-1 text-white/60">{dailySummary.shareLine}</p>
                            <p className="mt-2 text-white/40 text-xs">Come back tomorrow for a new prompt and another streak check-in.</p>
                        </div>
                    )}

                    {/* Solo play */}
                    {!showMultiplayer && (
                        <>
                            {/* Session length (only when not in active session) */}
                            {!sessionId && !isFirstSession && (
                                <div className="mb-4">
                                    <label className="game-section-label block mb-2 text-center">Session length</label>
                                    <div className="flex gap-2 justify-center">
                                        {[3, 5, 7].map((rounds) => (
                                            <button
                                                key={rounds}
                                                type="button"
                                                onClick={() => setSessionLength(rounds)}
                                                aria-pressed={sessionLength === rounds}
                                                aria-label={`${rounds} rounds`}
                                                className={`game-segment ${sessionLength === rounds ? 'game-segment-selected' : ''}`}
                                            >
                                                {rounds}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-white/40 text-xs mt-2">{sessionLength} rounds · beat your average</p>
                                </div>
                            )}
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={startGame}
                                    disabled={sessionId && roundComplete && roundNumber >= totalRounds}
                                    className="wordle-button wordle-primary flex-1 min-h-[52px] text-base"
                                    aria-label={sessionId
                                        ? roundComplete && roundNumber === totalRounds
                                            ? 'Session complete'
                                            : `Start round ${roundComplete ? roundNumber + 1 : roundNumber}`
                                        : `Start solo session (${sessionLength} rounds)`}
                                >
                                    {isFirstSession
                                        ? 'Start First Round'
                                        : sessionId
                                        ? roundComplete && roundNumber === totalRounds
                                            ? 'Session Complete'
                                            : `Start Round ${roundComplete ? roundNumber + 1 : roundNumber}`
                                        : `Practice Run (${sessionLength} rounds)`}
                                </button>
                                <button
                                    onClick={() => setGameState('GALLERY')}
                                    className="wordle-button min-w-[52px] min-h-[52px] flex items-center justify-center text-xl"
                                    aria-label="View connection gallery"
                                    title="Connection Gallery"
                                >
                                    🖼️
                                </button>
                            </div>

                            {!isFirstSession && (
                                <button
                                    onClick={() => setShowMultiplayer(true)}
                                    className="wordle-button mt-4 w-full flex items-center justify-center gap-2"
                                >
                                    <Users className="w-5 h-5" />
                                    Play with Friends
                                    {!backendReady && <WifiOff className="w-4 h-4 opacity-50" />}
                                </button>
                            )}

                            {showFeatureNav && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setGameState('LEADERBOARD')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Leaderboard
                                    </button>
                                    <button
                                        onClick={() => setGameState('ACHIEVEMENTS')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Award className="w-4 h-4" />
                                        Achievements
                                    </button>
                                    <button
                                        onClick={() => setGameState('THEME_BUILDER')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Palette className="w-4 h-4" />
                                        Creator
                                    </button>
                                    <button
                                        onClick={() => setGameState('SHOP')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                        Shop
                                    </button>
                                </div>
                            )}

                            {showAdvancedModes && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setGameState('RANKED')}
                                        className="py-3 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-indigo-400/20"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Ranked
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!sessionId) startSession(sessionLength);
                                            setGameState('AI_BATTLE');
                                        }}
                                        className="py-3 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-red-400/20"
                                    >
                                        <Brain className="w-4 h-4" />
                                        AI Battle
                                    </button>
                                    <button
                                        onClick={() => setGameState('TOURNAMENT')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Tournament
                                    </button>
                                    <button
                                        onClick={() => setGameState('ASYNC_CHAINS')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Link className="w-4 h-4" />
                                        Challenge Links
                                    </button>
                                    <button
                                        onClick={() => setGameState('AI_SETTINGS')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Brain className="w-4 h-4" />
                                        AI Settings
                                    </button>
                                    <button
                                        onClick={() => setGameState('ANALYTICS')}
                                        className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Stats
                                    </button>
                                </div>
                            )}

                            {lobbyTier < 3 && (
                                <button
                                    onClick={handleShowAllFeatures}
                                    className="mt-3 text-sm text-white/40 hover:text-white underline"
                                >
                                    {showAllFeatures ? 'Hide advanced features' : 'Show all features'}
                                </button>
                            )}
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
                            {!backendReady && (
                                <div className="mb-4 wordle-card p-3 text-left text-xs text-white/60">
                                    <div className="font-bold uppercase tracking-[0.18em] text-amber-200 mb-1">Live-room launch gate</div>
                                    <p>Configure Supabase env vars and apply `supabase/schema.sql` before public multiplayer. This keeps room joins, votes, reconnects, and final standings authoritative.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={mpLoading || !backendReady}
                                    className="wordle-button wordle-primary w-full text-lg disabled:hover:scale-100"
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
                                        className="game-input flex-1 text-lg text-center tracking-widest font-bold uppercase"
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
        <div className="w-full max-w-md wordle-card p-5 sm:p-7 animate-spring-in">
            {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            <h2 className="text-2xl font-display font-bold tracking-tight text-white mb-2 text-center">Create Profile</h2>
            <p className="text-white/50 text-sm text-center mb-6">Set up today&apos;s puzzle run and keep your streak moving.</p>
            <ServiceStatusCard className="mb-6" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <section aria-labelledby="profile-username">
                    <label id="profile-username" className="block text-sm font-medium text-white/60 mb-2">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            className="game-input text-lg pr-14"
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
                                    className={`wordle-tile aspect-square min-w-[44px] min-h-[44px] text-2xl transition-all relative
                                        ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                        ${avatar === a ? 'wordle-tile-correct scale-95' : 'hover:border-[#565758]'}
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
                            aria-label="Manual judge — you enter the score yourself after each round"
                            className={`game-choice min-h-[44px] py-3 text-sm font-semibold transition-all ${scoringMode === 'human'
                                    ? 'game-choice-selected'
                                    : ''
                                }`}
                        >
                            Manual Judge
                        </button>
                        <button
                            type="button"
                            onClick={() => setScoringMode('ai')}
                            aria-pressed={scoringMode === 'ai'}
                            aria-label="AI judge — Gemini scores your connections automatically"
                            className={`game-choice min-h-[44px] py-3 text-sm font-semibold transition-all ${scoringMode === 'ai'
                                    ? 'game-choice-selected'
                                    : ''
                                }`}
                        >
                            AI Judge
                        </button>
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {scoringMode === 'human'
                            ? 'Manual Judge means you score the reveal yourself. Friend Judge links can still be copied after the round.'
                            : 'AI Judge scores automatically with Gemini when configured, and falls back gracefully when unavailable.'
                        }
                    </p>
                </section>

                {([MEDIA_TYPES.IMAGE, MEDIA_TYPES.MEMES_VIDEOS, MEDIA_TYPES.VIDEO].includes(mediaType)) && (
                    <section aria-labelledby="profile-custom-images">
                        <CustomImagesManager
                            customImages={customImages}
                            onRefresh={refreshCustomImages}
                            useCustomImages={useCustomImages}
                            onUseCustomImagesChange={setUseCustomImages}
                            mediaType={mediaType}
                        />
                    </section>
                )}

                <section aria-labelledby="profile-media">
                    <label id="profile-media" className="block text-sm font-medium text-white/60 mb-2">Media Type</label>
                    <div className="grid grid-cols-2 gap-3" role="group">
                        {[
                            { type: MEDIA_TYPES.IMAGE, label: tr('lobby.images'), Icon: Image, desc: tr('lobby.imagesDesc') },
                            { type: MEDIA_TYPES.MEMES_VIDEOS, label: tr('lobby.memesVideos'), Icon: Laugh, desc: tr('lobby.memesVideosDesc') },
                            { type: MEDIA_TYPES.VIDEO, label: tr('lobby.videos'), Icon: Film, desc: tr('lobby.videosDesc') },
                            { type: MEDIA_TYPES.AUDIO, label: tr('lobby.audio'), Icon: Music, desc: tr('lobby.audioDesc') },
                        ].map(({ type, label, Icon, desc }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setMediaType(type)}
                                aria-pressed={mediaType === type}
                                aria-label={`${label} — ${desc}`}
                                className={`game-choice min-h-[44px] py-3 text-sm font-semibold flex flex-col items-center gap-1 ${mediaType === type
                                        ? 'game-choice-selected'
                                        : ''
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {mediaType === MEDIA_TYPES.IMAGE && tr('lobby.imagesDesc')}
                        {mediaType === MEDIA_TYPES.MEMES_VIDEOS && tr('lobby.memesVideosDesc')}
                        {mediaType === MEDIA_TYPES.VIDEO && tr('lobby.videosDesc')}
                        {mediaType === MEDIA_TYPES.AUDIO && tr('lobby.audioDesc')}
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
                                className={`game-segment w-full ${sessionLength === rounds ? 'game-segment-selected' : ''}`}
                            >
                                {rounds} Rounds
                            </button>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="wordle-button wordle-primary w-full mt-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Join Lobby
                </button>
            </form>
        </div>
    );
}


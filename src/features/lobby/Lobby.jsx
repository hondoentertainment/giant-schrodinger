import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useRoom } from '../../context/RoomContext';
import { THEMES, getAvailableThemes, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { normalizeMediaType } from '../../lib/mediaType';
import { getStats, getMilestones, isThemeUnlocked, getProfileSummary } from '../../services/stats';
import { reportAppEvent } from '../../lib/telemetry';
import { getDailyChallenge, getDailyChallengeSummary, getDailyStampWeek, getYesterdayChallenge, hasDailyChallengeBeenPlayed } from '../../services/dailyChallenge';
import { formatCountdown, getTimeUntilNextChallenge } from '../../services/countdown';
import { getCollisions } from '../../services/storage';
import { getDailyRitualShareCard } from '../../services/dailyRitualShare';
import { createShareCard, dataURLtoFile, downloadFusionImage } from '../../services/socialShare';
import { isBackendEnabled } from '../../lib/supabase';
import { Wifi, WifiOff, HelpCircle, Image, Film, Music, Laugh, CalendarDays, Pencil, Unlock, Trophy, Award, Palette, ShoppingBag, Brain, Shield, Link, BarChart3 } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { OnboardingModal } from '../../components/OnboardingModal';
import { UnlockModal } from '../../components/UnlockModal';
import { CustomImagesManager } from '../../components/CustomImagesManager';
import { getCustomImages } from '../../services/customImages';
import { ServiceStatusCard } from '../../components/ServiceStatusCard';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { LocalPreviewBadge } from '../../components/LocalPreviewBadge';
import { NotificationBanner } from '../../components/NotificationBanner';
import { isE2EMockRoomEnabled } from '../../lib/e2eMockRoom';
import { trackEvent } from '../../services/analytics';
import { getCurrentWeeklyEvent, getTimeUntilNextWeek, formatWeeklyCountdown } from '../../services/weeklyEvents';
import { consumeAutostartDaily, markAutostartDaily, peekAutostartDaily } from '../../lib/firstSession';
import { parseSiteShortcut } from '../../lib/siteIdentity';
import { extractRoomCode } from '../../lib/roomCode';
import { useTranslation } from '../../hooks/useTranslation';

const AVATARS = ['👽', '🎨', '🧠', '👾', '🤖', '🔮', '🎪', '🎭', '🎯', '⭐', '🏆', '🔥'];

function LobbyOverflowMenu({ onGallery, onHowTo, onSettings, onAchievements }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
            if (!menuRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    const items = [
        { label: 'Gallery', ariaLabel: 'View connection gallery', onClick: onGallery },
        { label: 'How to', ariaLabel: 'How it works', onClick: onHowTo },
        { label: 'Settings', ariaLabel: 'Open settings', onClick: onSettings },
        { label: 'Achievements', ariaLabel: 'Achievements', onClick: onAchievements },
    ];

    return (
        <div className="lobby-overflow" ref={menuRef}>
            <button
                type="button"
                className="lobby-overflow-trigger"
                aria-label="More lobby actions"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((value) => !value)}
            >
                ⋯
            </button>
            <div className={`lobby-overflow-menu ${open ? 'is-open' : ''}`} role="menu" aria-label="Lobby shortcuts">
                {items.map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        className="lobby-overflow-item"
                        aria-label={item.ariaLabel}
                        onClick={() => {
                            setOpen(false);
                            item.onClick();
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function DailyPairCard({ dailyChallenge, dailySummary, variant = 'lobby' }) {
    const weekTitle = dailyChallenge?.weekTitle;
    const pair = dailyChallenge?.pair;
    const pairLine = pair ? `${pair.left} × ${pair.right}` : null;

    if (variant === 'gate') {
        return (
            <div className="game-daily-card game-daily-card--inset mb-4">
                {weekTitle && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--game-warning)]">
                        {weekTitle}
                    </p>
                )}
                {pairLine && (
                    <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white">
                        {pairLine}
                    </p>
                )}
                <p className="mt-1.5 text-xs text-white/55">Today&apos;s pair. Same one as everyone.</p>
            </div>
        );
    }

    return (
        <div className="game-daily-card">
            <div className="flex items-center justify-between gap-3 text-[var(--game-warning)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em]">Daily pair</p>
                <p className="text-xs font-medium">1.5× bonus</p>
            </div>
            {pairLine && (
                <p className="mt-2 text-base font-semibold text-white">
                    {pairLine}
                </p>
            )}
            {weekTitle && (
                <p className="mt-1 text-xs font-semibold text-amber-100/80 max-sm:hidden">{weekTitle}</p>
            )}
            <p className="mt-1.5 text-[13px] text-white/55">
                Same prompt worldwide. Beat yesterday you.
            </p>
            {dailyChallenge?.prompt && (
                <p className="mt-1 text-xs text-white/45 line-clamp-2 max-sm:hidden">{dailyChallenge.prompt}</p>
            )}
            {dailySummary && (
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-amber-200/70 max-sm:hidden">
                    <span className="sr-only">Daily Challenge</span>
                    <span>{dailySummary.completions} daily completion{dailySummary.completions === 1 ? '' : 's'}</span>
                    {dailySummary.bestScore !== null && <span>Best daily: {dailySummary.bestScore}/10</span>}
                </div>
            )}
        </div>
    );
}

export function Lobby() {
    const { t: tr } = useTranslation();
    const {
        user,
        login,
        logout,
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
    const [mpLoadingAction, setMpLoadingAction] = useState(null); // 'create' | 'join' | 'spectate'
    const [dailyShareCopied, setDailyShareCopied] = useState(false);
    const [dailyRefreshKey, setDailyRefreshKey] = useState(0);
    const [dailyConflictOpen, setDailyConflictOpen] = useState(false);
    const pendingJoinRef = useRef({ code: '', watch: false, consumed: false });
    const autostartedDailyRef = useRef(false);
    const userRef = useRef(user);
    userRef.current = user;
    const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
    const [siteShortcut, setSiteShortcut] = useState(() => (
        typeof window === 'undefined' ? null : parseSiteShortcut(window.location.hash)
    ));
    const hadProfileOnDailyShortcutRef = useRef(
        Boolean(user) && (typeof window === 'undefined' ? null : parseSiteShortcut(window.location.hash)) === 'daily'
    );

    const theme = getThemeById(themeId);
    const stats = getStats();
    const profileSummary = useMemo(() => getProfileSummary(stats), [stats]);
    const milestones = getMilestones();
    const backendReady = isBackendEnabled() || isE2EMockRoomEnabled();
    const lobbyTier = stats.totalRounds >= 5 ? 3 : stats.totalRounds >= 3 ? 2 : stats.totalRounds >= 1 ? 1 : 0;
    const isFirstSession = lobbyTier === 0 && !sessionId;

    useEffect(() => {
        if (!sessionId) setDailyRefreshKey((key) => key + 1);
    }, [sessionId]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const params = new URLSearchParams(window.location.search || '');
        const join = (params.get('join') || '').trim().toUpperCase();
        const watch = params.get('watch') === '1' || params.get('spectate') === '1';
        if (!join || join.length < 4) return undefined;
        setJoinCode(join);
        setShowMultiplayer(true);
        pendingJoinRef.current = { code: join, watch, consumed: false };
        trackEvent('join_link_opened', { codeLength: join.length, watch });
        // Defer URL cleanup so React Strict Mode remount can still read ?join=
        const timer = window.setTimeout(() => {
            const latest = new URLSearchParams(window.location.search || '');
            if (!latest.has('join')) return;
            latest.delete('join');
            latest.delete('watch');
            latest.delete('spectate');
            const next = latest.toString();
            const cleaned = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash || ''}`;
            window.history.replaceState(null, '', cleaned);
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const applyShortcut = () => {
            const shortcut = parseSiteShortcut(window.location.hash);
            if (shortcut === 'daily') {
                hadProfileOnDailyShortcutRef.current = Boolean(userRef.current);
            }
            setSiteShortcut(shortcut);
            if (shortcut === 'friends') setShowMultiplayer(true);
        };
        applyShortcut();
        window.addEventListener('hashchange', applyShortcut);
        return () => window.removeEventListener('hashchange', applyShortcut);
    }, []);

    useEffect(() => {
        const pending = pendingJoinRef.current;
        if (!user?.name || !backendReady || !pending.code || pending.consumed) return undefined;
        pending.consumed = true;
        let cancelled = false;
        setMpLoading(true);
        setMpLoadingAction(pending.watch ? 'spectate' : 'join');
        Promise.resolve(
            joinRoomByCode(pending.code, user.name, user.avatar || avatar, { spectator: pending.watch })
        ).finally(() => {
            if (!cancelled) {
                setMpLoading(false);
                setMpLoadingAction(null);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [avatar, backendReady, joinRoomByCode, user?.avatar, user?.name]);

    useEffect(() => {
        if (profileSummary.streakAtRisk) {
            trackEvent('streak_at_risk', {
                currentStreak: profileSummary.currentStreak,
            });
        }
    }, [profileSummary.streakAtRisk, profileSummary.currentStreak]);

    const weeklyEvent = useMemo(() => getCurrentWeeklyEvent(), []);
    const weeklyCountdown = useMemo(() => formatWeeklyCountdown(getTimeUntilNextWeek()), []);

    useEffect(() => {
        if (weeklyEvent && !isFirstSession) {
            reportAppEvent('weekly_event_view', {
                eventId: weeklyEvent.id || weeklyEvent.name,
            });
        }
    }, [weeklyEvent, isFirstSession]);
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
    const showFeatureNav = showAllFeatures;
    const showAdvancedModes = showAllFeatures;

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

    const commitProfile = (autostartDaily) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;
        if (autostartDaily) markAutostartDaily();
        trackEvent('first_session_profile_created', {
            scoringMode,
            mediaType,
            themeId,
            autostartDaily: Boolean(autostartDaily),
        });
        login({
            name: trimmedName,
            avatar: avatar || AVATARS[0],
            themeId,
            gradient: theme.gradient,
            scoringMode,
            mediaType,
            useCustomImages,
        });
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        commitProfile(true);
    };

    const handleJoinFriends = () => {
        if (commitProfile(false)) {
            setShowMultiplayer(true);
        }
    };

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const dailySummary = useMemo(() => getDailyChallengeSummary(), [dailyRefreshKey]);
    const dailyPlayed = useMemo(() => hasDailyChallengeBeenPlayed(), [dailyRefreshKey]);
    const dailyStamps = useMemo(() => getDailyStampWeek(), [dailyRefreshKey]);
    const yesterdayVenn = useMemo(() => {
        const yesterday = getYesterdayChallenge();
        const collision = getCollisions().find((item) => (
            item.isDailyChallenge && String(item.timestamp || '').startsWith(yesterday.date)
        ));
        return {
            pair: yesterday.pair,
            submission: collision?.submission || null,
            score: collision?.score ?? null,
        };
    }, [dailyRefreshKey]);
    const nextDaily = useMemo(() => formatCountdown(getTimeUntilNextChallenge()), [dailyRefreshKey]);

    const handleDailyShare = async () => {
        const url = window.location.origin + window.location.pathname;
        const card = getDailyRitualShareCard({ origin: url });
        trackEvent('daily_challenge_share', {
            completions: dailySummary.completions,
            hasImage: Boolean(card.imageUrl),
        });
        try {
            const shareCard = await createShareCard(card.imageUrl, card.shareData);
            if (shareCard && typeof navigator.share === 'function') {
                const file = dataURLtoFile(shareCard, 'venn-daily-share-card.png');
                const payload = {
                    title: 'Venn Daily',
                    text: card.text,
                    url,
                };
                if (!navigator.canShare || navigator.canShare({ files: [file] })) {
                    payload.files = [file];
                }
                await navigator.share(payload);
                haptic('success');
                setDailyShareCopied(true);
                setTimeout(() => setDailyShareCopied(false), 2500);
                return;
            }
            if (shareCard) {
                await downloadFusionImage(card.imageUrl, card.shareData, 'venn-daily-share-card.png');
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(card.text);
            haptic('success');
            setDailyShareCopied(true);
            setTimeout(() => setDailyShareCopied(false), 2500);
        }
    };

    const handleScoringModeChange = (mode) => {
        setScoringMode(mode);
        if (user) login({ ...user, scoringMode: mode });
    };

    const startGame = () => {
        if (!sessionId && stats.totalRounds === 0) {
            beginDailyChallenge();
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

    const beginDailyChallenge = (source = 'lobby') => {
        trackEvent(stats.totalRounds === 0 ? 'first_session_daily_started' : 'daily_challenge_started', {
            source,
        });
        startSession(3, true);
        beginRound();
    };

    useEffect(() => {
        if (autostartedDailyRef.current) return;
        if (!user || sessionId || pendingJoinRef.current.code) return;
        const fromProfile = peekAutostartDaily();
        const fromShortcut = siteShortcut === 'daily' && hadProfileOnDailyShortcutRef.current;
        if (!fromProfile && !fromShortcut) return;
        if (fromShortcut && !fromProfile && hasDailyChallengeBeenPlayed()) return;
        autostartedDailyRef.current = true;
        consumeAutostartDaily();
        beginDailyChallenge(fromShortcut ? 'shortcut' : 'lobby');
    }, [sessionId, siteShortcut, user]);

    const startDailyChallenge = () => {
        if (sessionId) {
            setDailyConflictOpen(true);
            return;
        }
        beginDailyChallenge();
    };

    const openEditProfile = () => {
        setName(user?.name || '');
        setAvatar(user?.avatar || AVATARS[0]);
        setThemeId(user?.themeId || THEMES[0].id);
        setScoringMode(user?.scoringMode || 'human');
        setMediaType(normalizeMediaType(user?.mediaType) || MEDIA_TYPES.IMAGE);
        setUseCustomImages(user?.useCustomImages ?? false);
        setSessionLength(totalRounds || 3);
        logout();
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

    const handleJoinAsSpectator = async () => {
        if (!user?.name || !joinCode.trim()) return;
        setMpLoading(true);
        setMpLoadingAction('spectate');
        await joinRoomByCode(joinCode.trim(), user.name, user.avatar || avatar, { spectator: true });
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
                {dailyConflictOpen && (
                    <div className="game-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="daily-conflict-title">
                        <div className="game-modal-panel p-6 max-w-md w-full">
                            <h2 id="daily-conflict-title" className="text-xl font-display font-bold text-white mb-2">
                                Practice session in progress
                            </h2>
                            <p className="text-white/60 text-sm mb-5">
                                End this practice run to play today&apos;s Daily, or keep practicing.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    className="wordle-button wordle-primary min-h-[48px]"
                                    onClick={() => {
                                        setDailyConflictOpen(false);
                                        endSession();
                                        beginDailyChallenge();
                                    }}
                                >
                                    End session &amp; play Daily
                                </button>
                                <button
                                    type="button"
                                    className="wordle-button min-h-[48px]"
                                    onClick={() => setDailyConflictOpen(false)}
                                >
                                    Keep practicing
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            <div className="game-play-col space-y-5 animate-spring-in">
                <div className="text-left w-full">
                    {welcomeMessage && !welcomeDismissed && !isFirstSession && (
                        <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-2.5 text-left flex items-center gap-2">
                            <p className="text-emerald-200 text-xs sm:text-sm flex-1">{welcomeMessage}</p>
                            <button
                                type="button"
                                onClick={() => setWelcomeDismissed(true)}
                                className="min-h-[40px] min-w-[40px] text-white/50 hover:text-white"
                                aria-label="Dismiss welcome back message"
                            >
                                &times;
                            </button>
                        </div>
                    )}
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-[32px] leading-none font-display font-bold tracking-tight text-white truncate sm:text-2xl sm:leading-tight">
                                Hey {user.name} {user.avatar}
                            </h2>
                            <p className="mt-2 text-[13px] text-white/55">
                                {sessionId
                                    ? `Round ${roundNumber} of ${totalRounds} · ${sessionScore} pts`
                                    : `Streak ${profileSummary.currentStreak || 0} · Best ${profileSummary.bestScore != null ? profileSummary.bestScore : '—'} · ${profileSummary.savedCount ?? profileSummary.highlightCount ?? 0} saved`}
                            </p>
                        </div>
                        <button
                            onClick={openEditProfile}
                            className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 min-w-[40px] min-h-[40px] flex items-center justify-center max-sm:opacity-55"
                            aria-label="Edit profile"
                            title="Edit profile"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {profileSummary.streakAtRisk && (
                        <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100 text-xs text-left">
                            Day {profileSummary.currentStreak} streak is at risk — play today to keep it alive.
                        </div>
                    )}

                    {/* Daily Challenge — featured pair card */}
                    {!showMultiplayer && !dailyPlayed && (
                        <div className="mb-3">
                            <DailyPairCard
                                dailyChallenge={dailyChallenge}
                                dailySummary={dailySummary}
                                variant="lobby"
                            />
                        </div>
                    )}
                    {!showMultiplayer && dailyPlayed && (
                        <div className="w-full mb-3 p-3 rounded-xl border border-amber-400/20 bg-amber-500/10 text-left text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-amber-200 font-semibold">
                                    <CalendarDays className="w-4 h-4" />
                                    Daily complete
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDailyShare}
                                    className="text-xs text-amber-100 underline min-h-[40px] px-2"
                                >
                                    {dailyShareCopied ? 'Shared!' : 'Share card'}
                                </button>
                            </div>
                            {dailyChallenge.weekTitle && (
                                <p className="mt-1 text-amber-100/75 text-xs font-semibold">{dailyChallenge.weekTitle}</p>
                            )}
                            <p className="mt-1 text-white/55 text-xs line-clamp-2">{dailySummary.shareLine}</p>
                            <div className="mt-3 flex justify-between gap-1" aria-label="This week's daily stamps">
                                {dailyStamps.map((stamp) => (
                                    <div key={stamp.date} className="flex-1 text-center">
                                        <div className={`mx-auto h-8 w-8 rounded-full border text-xs font-bold flex items-center justify-center ${
                                            stamp.played
                                                ? 'border-amber-300/50 bg-amber-300/20 text-amber-100'
                                                : stamp.isToday
                                                    ? 'border-white/25 text-white/70'
                                                    : 'border-white/10 text-white/30'
                                        }`}>
                                            {stamp.played ? '✓' : stamp.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-white/40 text-[11px]">Next pair in {nextDaily}</p>
                            {yesterdayVenn.pair && (
                                <p className="mt-1 text-white/45 text-[11px] line-clamp-2">
                                    Yesterday: {yesterdayVenn.pair.left} × {yesterdayVenn.pair.right}
                                    {yesterdayVenn.submission ? ` — “${yesterdayVenn.submission}”` : ''}
                                </p>
                            )}
                        </div>
                    )}

                    {isFirstSession && !showMultiplayer && (
                        <p className="text-white/40 text-xs text-left mb-3 max-sm:hidden">
                            Today&apos;s pair is the whole tutorial. One line. Then we talk settings.
                        </p>
                    )}

                    {/* Primary / secondary CTAs — Redesign v2 hierarchy */}
                    {!showMultiplayer && (
                        <div className="flex flex-col gap-2.5 w-full">
                            {!dailyPlayed && (
                                <button
                                    type="button"
                                    onClick={startDailyChallenge}
                                    aria-label="Play today's pair — Start today's Venn daily puzzle"
                                    className="wordle-button wordle-primary w-full min-h-[49px] text-base"
                                >
                                    Play today&apos;s pair
                                </button>
                            )}
                            {sessionId && (
                                <button
                                    type="button"
                                    onClick={startGame}
                                    disabled={roundComplete && roundNumber >= totalRounds}
                                    className={`wordle-button w-full min-h-[49px] text-base ${dailyPlayed ? 'wordle-primary' : ''}`}
                                    aria-label={roundComplete && roundNumber === totalRounds
                                        ? 'Session complete'
                                        : `Start round ${roundComplete ? roundNumber + 1 : roundNumber}`}
                                >
                                    {roundComplete && roundNumber === totalRounds
                                        ? 'Session Complete'
                                        : `Start Round ${roundComplete ? roundNumber + 1 : roundNumber}`}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowMultiplayer(true)}
                                className="wordle-button w-full min-h-[49px] text-base"
                                aria-label="Join friends room — Play with Friends"
                            >
                                Join friends room
                                {!backendReady && <WifiOff className="w-4 h-4 opacity-50 ml-2" />}
                            </button>
                            <LobbyOverflowMenu
                                onGallery={() => setGameState('GALLERY')}
                                onHowTo={() => {
                                    setOnboardingDismissCallback(() => () => setShowOnboarding(false));
                                    setShowOnboarding(true);
                                }}
                                onSettings={() => setMoreOptionsOpen(true)}
                                onAchievements={() => setGameState('ACHIEVEMENTS')}
                            />
                            {!isFirstSession && !sessionId && (
                                <div className="flex items-center justify-center gap-2 pt-1">
                                    <span className="text-white/40 text-xs">Rounds</span>
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
                            )}
                            {!isFirstSession && !sessionId && (
                                <button
                                    type="button"
                                    onClick={startGame}
                                    className="text-sm text-white/45 hover:text-white underline min-h-[44px]"
                                    aria-label={`Start solo session (${sessionLength} rounds)`}
                                >
                                    Practice Run ({sessionLength} rounds)
                                </button>
                            )}
                            {!backendReady && !isFirstSession && <ServiceStatusCard className="mt-1" />}
                            {stats.totalRounds >= 3 && <NotificationBanner />}
                        </div>
                    )}

                    {!showMultiplayer && (
                        <>

                            <details
                                className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] text-left group"
                                open={moreOptionsOpen}
                                onToggle={(event) => setMoreOptionsOpen(event.currentTarget.open)}
                            >
                                <summary className="cursor-pointer list-none px-4 py-3 text-sm text-white/70 font-semibold flex items-center justify-between min-h-[44px]">
                                    <span>Progress &amp; settings</span>
                                    <span className="text-white/35 text-xs group-open:hidden">Show</span>
                                    <span className="text-white/35 text-xs hidden group-open:inline">Hide</span>
                                </summary>
                                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                                    {!isFirstSession && stats.totalRounds > 0 && (
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                            <div className="game-section-label mb-2">{tr('lobby.yourProgress')}</div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <div className="text-white/50 text-xs">{tr('lobby.favoriteTheme')}</div>
                                                    <div className="text-white font-bold">{profileSummary.favoriteThemeId ? getThemeById(profileSummary.favoriteThemeId).label : '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-white/50 text-xs">{tr('lobby.nextUnlock')}</div>
                                                    <div className="text-white font-bold">
                                                        {profileSummary.nextMilestone ? profileSummary.nextMilestone.label : tr('lobby.allUnlocked')}
                                                    </div>
                                                    {profileSummary.nextMilestone && (
                                                        <div className="text-amber-200/80 text-[11px] mt-1">
                                                            {profileSummary.nextMilestone.remaining === 0
                                                                ? 'Ready to unlock'
                                                                : `${profileSummary.nextMilestone.remaining} more ${profileSummary.nextMilestone.type === 'rounds' ? 'rounds' : 'streak days'}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                                                <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2 py-2">
                                                    <div className="text-white/40">Avg</div>
                                                    <div className="text-white font-semibold tabular-nums">
                                                        {profileSummary.averageScore != null ? profileSummary.averageScore.toFixed(1) : '—'}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2 py-2">
                                                    <div className="text-white/40">Friend scores</div>
                                                    <div className="text-white font-semibold tabular-nums">{profileSummary.friendJudgedCount}</div>
                                                </div>
                                                <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2 py-2">
                                                    <div className="text-white/40">Highlights</div>
                                                    <div className="text-white font-semibold tabular-nums">{profileSummary.highlightCount}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                        <div className="game-section-label mb-2">Who scores solo rounds?</div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => handleScoringModeChange('human')}
                                                aria-pressed={scoringMode === 'human'}
                                                className={`game-choice min-h-[40px] py-2 text-xs font-semibold ${scoringMode === 'human' ? 'game-choice-selected' : ''}`}
                                            >
                                                You score
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleScoringModeChange('ai')}
                                                aria-pressed={scoringMode === 'ai'}
                                                className={`game-choice min-h-[40px] py-2 text-xs font-semibold ${scoringMode === 'ai' ? 'game-choice-selected' : ''}`}
                                            >
                                                AI scores
                                            </button>
                                        </div>
                                        <p className="text-white/45 text-[11px] leading-relaxed">
                                            {scoringMode === 'human'
                                                ? 'You score the reveal. Friend Judge is a separate share link after any round. Live rooms use room vote when Manual.'
                                                : 'AI scores solo rounds when configured. Friend Judge still works after reveal.'}
                                        </p>
                                    </div>

                                    {!isFirstSession && ([MEDIA_TYPES.IMAGE, MEDIA_TYPES.MEMES_VIDEOS, MEDIA_TYPES.VIDEO].includes(user?.mediaType || MEDIA_TYPES.IMAGE)) && (
                                        <CustomImagesManager
                                            customImages={customImages}
                                            onRefresh={refreshCustomImages}
                                            useCustomImages={useCustomImages}
                                            onUseCustomImagesChange={handleUseCustomImagesChange}
                                            mediaType={user?.mediaType || MEDIA_TYPES.IMAGE}
                                        />
                                    )}

                                    {!isFirstSession && weeklyEvent && (
                                        <div className="p-3 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                                            <div className="flex items-center justify-between gap-3 mb-1">
                                                <span className="text-purple-300 text-xs uppercase tracking-wider font-bold">This Week</span>
                                                <span className="text-white/40 text-xs">{weeklyCountdown}</span>
                                            </div>
                                            <div className="text-white font-bold text-sm">{weeklyEvent.name}</div>
                                            <div className="text-white/60 text-xs">{weeklyEvent.description}</div>
                                        </div>
                                    )}

                                    {!isFirstSession && <PWAInstallBanner />}

                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <button
                                            onClick={handleInvite}
                                            className="text-sm text-white/50 hover:text-white underline min-h-[40px]"
                                            aria-label={inviteCopied ? 'Link copied to clipboard' : 'Invite friends to play'}
                                        >
                                            {inviteCopied ? 'Copied!' : 'Invite friends'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOnboardingDismissCallback(() => () => setShowOnboarding(false));
                                                setShowOnboarding(true);
                                            }}
                                            className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[40px]"
                                            aria-label="How it works"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            How it works
                                        </button>
                                        <button
                                            onClick={() => setShowUnlockModal(true)}
                                            className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[40px]"
                                            aria-label="How to unlock avatars and themes"
                                        >
                                            <Unlock className="w-4 h-4" />
                                            Unlocks
                                        </button>
                                    </div>

                                    {showFeatureNav && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setGameState('LEADERBOARD')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Trophy className="w-4 h-4" />
                                                Leaderboard
                                            </button>
                                            <button
                                                onClick={() => setGameState('ACHIEVEMENTS')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Award className="w-4 h-4" />
                                                Achievements
                                            </button>
                                            <button
                                                onClick={() => setGameState('THEME_BUILDER')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Palette className="w-4 h-4" />
                                                Creator
                                            </button>
                                            <button
                                                onClick={() => setGameState('SHOP')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                Shop
                                                <LocalPreviewBadge />
                                            </button>
                                        </div>
                                    )}

                                    {showAdvancedModes && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setGameState('RANKED')}
                                                className="py-3 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-100 text-sm font-semibold flex items-center justify-center gap-2 border border-indigo-400/20"
                                            >
                                                <Shield className="w-4 h-4" />
                                                Ranked
                                                <LocalPreviewBadge />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!sessionId) startSession(sessionLength);
                                                    setGameState('AI_BATTLE');
                                                }}
                                                className="py-3 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-100 text-sm font-semibold flex items-center justify-center gap-2 border border-red-400/20"
                                            >
                                                <Brain className="w-4 h-4" />
                                                AI Battle
                                                <LocalPreviewBadge />
                                            </button>
                                            <button
                                                onClick={() => setGameState('TOURNAMENT')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Trophy className="w-4 h-4" />
                                                Tournament
                                                <LocalPreviewBadge />
                                            </button>
                                            <button
                                                onClick={() => setGameState('ASYNC_CHAINS')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Link className="w-4 h-4" />
                                                Challenge Links
                                                <LocalPreviewBadge />
                                            </button>
                                            <button
                                                onClick={() => setGameState('AI_SETTINGS')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Brain className="w-4 h-4" />
                                                AI Settings
                                                <LocalPreviewBadge />
                                            </button>
                                            <button
                                                onClick={() => setGameState('ANALYTICS')}
                                                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 text-sm font-semibold flex items-center justify-center gap-2"
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                                Stats
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleShowAllFeatures}
                                        className="w-full text-sm text-white/40 hover:text-white underline min-h-[44px]"
                                    >
                                        {showAllFeatures ? 'Hide Labs' : 'Labs'}
                                    </button>
                                    {showAllFeatures && (
                                        <p className="text-center text-[11px] text-white/35">
                                            Local preview — not the core game.
                                        </p>
                                    )}
                                </div>
                            </details>
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
                                    {mpLoading && mpLoadingAction === 'create' ? 'Creating...' : 'Create room'}
                                </button>

                                <div className="flex items-center gap-3 py-1" aria-hidden="true">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">or</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="room-code-input" className="game-section-label block">
                                        I have a code
                                    </label>
                                    <input
                                        id="room-code-input"
                                        type="text"
                                        inputMode="text"
                                        autoComplete="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(extractRoomCode(e.target.value))}
                                        onPaste={(e) => {
                                            const pasted = e.clipboardData?.getData('text') || '';
                                            const extracted = extractRoomCode(pasted);
                                            if (extracted) {
                                                e.preventDefault();
                                                setJoinCode(extracted);
                                            }
                                        }}
                                        placeholder="Paste room code"
                                        maxLength={6}
                                        className="game-input w-full min-h-[56px] text-xl text-center tracking-[0.35em] font-bold uppercase"
                                        aria-label="Room code"
                                    />
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={mpLoading || !backendReady || joinCode.trim().length < 4}
                                        className="wordle-button w-full min-h-[49px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-busy={mpLoading && mpLoadingAction === 'join'}
                                        aria-label={mpLoading && mpLoadingAction === 'join' ? 'Joining room...' : 'Join room'}
                                    >
                                        {mpLoading && mpLoadingAction === 'join' ? 'Joining...' : 'Join room'}
                                    </button>
                                </div>
                                {joinCode.trim().length >= 4 && (
                                    <button
                                        type="button"
                                        onClick={handleJoinAsSpectator}
                                        disabled={mpLoading || !backendReady}
                                        className="w-full py-2 bg-amber-500/10 text-amber-300 text-sm font-semibold rounded-xl hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-50 min-h-[44px]"
                                        aria-busy={mpLoading && mpLoadingAction === 'spectate'}
                                    >
                                        {mpLoading && mpLoadingAction === 'spectate' ? 'Joining...' : 'Watch the Game'}
                                    </button>
                                )}

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
        <div className="lobby-gate-split animate-spring-in">
            <div className="lobby-gate-copy">
                <h2 className="text-[40px] font-display font-bold leading-[1.18] tracking-tight text-white">
                    Two prompts. One line. The overlap is the joke.
                </h2>
                <p className="mt-4 max-w-[480px] text-base leading-relaxed text-white/55">
                    Start with a name and avatar, then play today&apos;s pair.
                </p>
            </div>
        <div className="w-full max-w-md lg:max-w-none wordle-card lobby-gate-card p-5 pt-[22px] sm:p-6">
            {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            <h2 className="text-[28px] font-display font-bold tracking-tight text-white">Create Profile</h2>
            <p className="text-white/55 text-sm mt-2 mb-3.5">Type a name. Then write one line.</p>
            {(dailyChallenge.weekTitle || dailyChallenge.pair) && (
                <DailyPairCard dailyChallenge={dailyChallenge} variant="gate" />
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <section aria-labelledby="profile-username">
                    <label id="profile-username" className="game-section-label mb-2 block">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            className="game-input game-input--accent game-input--username text-base"
                            placeholder="Enter your name..."
                            maxLength={12}
                            aria-describedby="name-char-count"
                            aria-invalid={!name.trim()}
                            autoFocus
                        />
                        <span
                            id="name-char-count"
                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-[13px] tabular-nums ${name.length >= 10 ? 'text-amber-400' : 'text-white/35'}`}
                            aria-live="polite"
                        >
                            {name.length}/12
                        </span>
                    </div>
                </section>

                <section aria-labelledby="profile-avatar">
                    <label id="profile-avatar" className="game-section-label mb-2 block">Avatar</label>
                    <div className="flex items-center justify-between gap-1.5" role="group">
                        {AVATARS.slice(0, 6).map((a) => (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setAvatar(a)}
                                aria-pressed={avatar === a}
                                aria-label={`Select avatar ${a}`}
                                className={`game-avatar-choice ${avatar === a ? 'game-avatar-choice--selected' : ''}`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="wordle-button wordle-primary w-full min-h-[52px] text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Play today&apos;s pair
                </button>
                <button
                    type="button"
                    disabled={!name.trim()}
                    onClick={handleJoinFriends}
                    className="w-full min-h-[44px] text-sm text-white/55 hover:text-white underline disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Playing with friends? — Join Lobby"
                >
                    Playing with friends?
                </button>

                <details
                    className="text-left"
                    onToggle={(event) => setMoreOptionsOpen(event.currentTarget.open)}
                >
                    <summary className="cursor-pointer list-none px-0.5 py-2 text-[13px] text-white/55 font-semibold min-h-[44px] flex items-center justify-between gap-3">
                        <span>More options</span>
                        <span className="text-white/35 text-xs font-normal">Theme, scoring, media</span>
                    </summary>
                    {moreOptionsOpen && (
                    <div className="px-0 pb-2 space-y-4 border-t border-white/10 pt-3">
                {!backendReady && <ServiceStatusCard />}

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
                        {getAvailableThemes().map((t) => {
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
                    <label id="profile-scoring" className="block text-sm font-medium text-white/60 mb-2">Who scores solo rounds?</label>
                    <div className="grid grid-cols-2 gap-3" role="group">
                        <button
                            type="button"
                            onClick={() => setScoringMode('human')}
                            aria-pressed={scoringMode === 'human'}
                            aria-label="You score — enter the score yourself after each round"
                            className={`game-choice min-h-[44px] py-3 text-sm font-semibold transition-all ${scoringMode === 'human'
                                    ? 'game-choice-selected'
                                    : ''
                                }`}
                        >
                            You score
                        </button>
                        <button
                            type="button"
                            onClick={() => setScoringMode('ai')}
                            aria-pressed={scoringMode === 'ai'}
                            aria-label="AI scores — Gemini scores your connections automatically"
                            className={`game-choice min-h-[44px] py-3 text-sm font-semibold transition-all ${scoringMode === 'ai'
                                    ? 'game-choice-selected'
                                    : ''
                                }`}
                        >
                            AI scores
                        </button>
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {scoringMode === 'human'
                            ? 'You score the reveal. Friend Judge is a separate share link. Live rooms use room vote when Manual.'
                            : 'AI scores solo rounds when configured. Friend Judge links still work after reveal.'
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
                    </div>
                    )}
                </details>
            </form>
        </div>
        </div>
    );
}


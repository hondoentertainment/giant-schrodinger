import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useRoom } from '../../context/RoomContext';
import { THEMES, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getStats, getMilestones } from '../../services/stats';
import { getDailyChallenge, hasDailyChallengeBeenPlayed } from '../../services/dailyChallenge';
import { getTimeUntilNextChallenge, formatCountdown } from '../../services/countdown';
import { getStreakBonus } from '../../services/challenges';
import { parseReferralFromUrl, trackReferral, generateReferralCode } from '../../services/referrals';
import { trackEvent, trackFunnel } from '../../services/analytics';
import { isMuted } from '../../services/sounds';
import { getCurrentWeeklyEvent } from '../../services/weeklyEvents';
import { validatePlayerName } from '../../lib/validation';
import { isBackendEnabled } from '../../lib/supabase';
import { haptic } from '../../lib/haptics';
import { TIMINGS } from '../../lib/timings';
import { getCustomImages } from '../../services/customImages';
import { scheduleStreakReminder } from '../../services/notifications';

import { CreateProfileView } from './sections/CreateProfileView';
import { LoggedInLobbyView } from './sections/LoggedInLobbyView';

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
    const { hostRoom, joinRoomByCode, joinAsSpectator } = useRoom();

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
    const [showTour, setShowTour] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [showAll, setShowAll] = useState(() => localStorage.getItem('vwf_show_all_features') === 'true');
    const [showJourney, setShowJourney] = useState(false);
    const [welcomeMsg, setWelcomeMsg] = useState(null);

    // Multiplayer state
    const [showMultiplayer, setShowMultiplayer] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [mpLoading, setMpLoading] = useState(false);
    const [mpLoadingAction, setMpLoadingAction] = useState(null); // 'create' | 'join'
    const [soundMuted, setSoundMuted] = useState(isMuted());
    const [colorblindMode, setColorblindMode] = useState(() => localStorage.getItem('venn_colorblind') === 'true');
    const [countdown, setCountdown] = useState(() => formatCountdown(getTimeUntilNextChallenge()));

    const theme = getThemeById(themeId);
    const stats = useMemo(() => getStats(), [sessionId, roundNumber]);
    const milestones = useMemo(() => getMilestones(), [sessionId, roundNumber]);
    const backendReady = isBackendEnabled();
    const streakBonus = useMemo(() => getStreakBonus(stats), [stats]);
    const lobbyTier = stats.totalRounds >= 15 ? 3 : stats.totalRounds >= 9 ? 2 : stats.totalRounds >= 3 ? 1 : 0;

    // Welcome-back message
    useEffect(() => {
        const lastSeen = localStorage.getItem('venn_last_seen');
        const now = Date.now();
        if (lastSeen) {
            const daysSince = Math.floor((now - parseInt(lastSeen)) / (1000 * 60 * 60 * 24));
            if (daysSince >= 7) setWelcomeMsg("It's been a while! Jump back in with today's daily challenge");
            else if (daysSince >= 3) setWelcomeMsg("We missed you! Your streak awaits");
            else if (daysSince >= 1) setWelcomeMsg("Welcome back! Keep your streak alive");
        }
        localStorage.setItem('venn_last_seen', now.toString());
        if (welcomeMsg) {
            const t = setTimeout(() => setWelcomeMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, []);

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

    // Schedule streak reminder on mount when streak > 0
    useEffect(() => {
        if (stats.currentStreak > 0) {
            scheduleStreakReminder(stats.currentStreak);
        }
    }, [stats.currentStreak]);

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
            setTimeout(() => setInviteCopied(false), TIMINGS.TOAST_DISMISS);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = validatePlayerName(name);
        if (!result.valid) return;
        login({ name: result.value, avatar, themeId, gradient: theme.gradient, scoringMode, mediaType, useCustomImages });
    };

    const weeklyEvent = useMemo(() => getCurrentWeeklyEvent(), []);

    const handleJoinAsSpectator = async () => {
        if (!joinCode.trim()) return;
        setMpLoading(true);
        setMpLoadingAction('spectate');
        await joinAsSpectator(joinCode.trim());
        setMpLoading(false);
        setMpLoadingAction(null);
    };

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const dailyPlayed = useMemo(() => hasDailyChallengeBeenPlayed(), []);

    const needsOnboarding = !localStorage.getItem('venn_onboarding_complete');

    const startGame = () => {
        trackFunnel('first_play_started');
        if (!sessionId && stats.totalRounds === 0 && needsOnboarding) {
            setShowTour(true);
            return;
        }

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
        if (!sessionId && stats.totalRounds === 0 && needsOnboarding) {
            setShowTour(true);
            return;
        }
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

    const handleTourComplete = () => {
        setShowTour(false);
        startSession(sessionLength);
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

    if (user) {
        return (
            <LoggedInLobbyView
                user={user}
                login={login}
                setGameState={setGameState}
                sessionId={sessionId}
                roundNumber={roundNumber}
                totalRounds={totalRounds}
                sessionScore={sessionScore}
                roundComplete={roundComplete}
                sessionResults={sessionResults}
                startSession={startSession}
                beginRound={beginRound}
                endSession={endSession}
                stats={stats}
                streakBonus={streakBonus}
                lobbyTier={lobbyTier}
                backendReady={backendReady}
                scoringMode={scoringMode}
                setScoringMode={setScoringMode}
                customImages={customImages}
                useCustomImages={useCustomImages}
                handleUseCustomImagesChange={handleUseCustomImagesChange}
                refreshCustomImages={refreshCustomImages}
                sessionLength={sessionLength}
                setSessionLength={setSessionLength}
                inviteCopied={inviteCopied}
                handleInvite={handleInvite}
                showOnboarding={showOnboarding}
                setShowOnboarding={setShowOnboarding}
                onboardingDismissCallback={onboardingDismissCallback}
                setOnboardingDismissCallback={setOnboardingDismissCallback}
                showTour={showTour}
                handleTourComplete={handleTourComplete}
                showUnlockModal={showUnlockModal}
                setShowUnlockModal={setShowUnlockModal}
                selectedFriend={selectedFriend}
                setSelectedFriend={setSelectedFriend}
                showAll={showAll}
                setShowAll={setShowAll}
                showJourney={showJourney}
                setShowJourney={setShowJourney}
                welcomeMsg={welcomeMsg}
                setWelcomeMsg={setWelcomeMsg}
                showMultiplayer={showMultiplayer}
                setShowMultiplayer={setShowMultiplayer}
                joinCode={joinCode}
                setJoinCode={setJoinCode}
                mpLoading={mpLoading}
                mpLoadingAction={mpLoadingAction}
                soundMuted={soundMuted}
                setSoundMuted={setSoundMuted}
                colorblindMode={colorblindMode}
                setColorblindMode={setColorblindMode}
                countdown={countdown}
                weeklyEvent={weeklyEvent}
                dailyChallenge={dailyChallenge}
                dailyPlayed={dailyPlayed}
                startGame={startGame}
                startDailyChallenge={startDailyChallenge}
                handleCreateRoom={handleCreateRoom}
                handleJoinRoom={handleJoinRoom}
                handleJoinAsSpectator={handleJoinAsSpectator}
            />
        );
    }

    return (
        <CreateProfileView
            AVATARS={AVATARS}
            name={name}
            setName={setName}
            avatar={avatar}
            setAvatar={setAvatar}
            themeId={themeId}
            setThemeId={setThemeId}
            scoringMode={scoringMode}
            setScoringMode={setScoringMode}
            mediaType={mediaType}
            setMediaType={setMediaType}
            useCustomImages={useCustomImages}
            setUseCustomImages={setUseCustomImages}
            customImages={customImages}
            refreshCustomImages={refreshCustomImages}
            sessionLength={sessionLength}
            setSessionLength={setSessionLength}
            stats={stats}
            milestones={milestones}
            showUnlockModal={showUnlockModal}
            setShowUnlockModal={setShowUnlockModal}
            handleSubmit={handleSubmit}
        />
    );
}

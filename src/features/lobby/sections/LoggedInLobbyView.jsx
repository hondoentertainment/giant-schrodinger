import React from 'react';
import { MEDIA_TYPES } from '../../../data/themes';
import { NotificationBanner } from '../../../components/NotificationBanner';
import { CustomImagesManager } from '../../../components/CustomImagesManager';
import { PWAInstallBanner } from '../../../components/PWAInstallBanner';
import { SeasonalChallengeBattlePass } from '../../challenge/SeasonalChallengeBattlePass';

import { LobbyTopBar } from './LobbyTopBar';
import { StreakHeroDisplay } from './StreakHeroDisplay';
import { ScoringModeToggle } from './ScoringModeToggle';
import { DailyChallengePanel } from './DailyChallengePanel';
import { WeeklyEventBanner } from './WeeklyEventBanner';
import { FriendsList } from './FriendsList';
import { SoloPlayPanel } from './SoloPlayPanel';
import { LobbyMultiplayerPanel } from './LobbyMultiplayerPanel';
import { JourneyCollapsible } from './JourneyCollapsible';
import { LobbyHeader } from './LobbyHeader';
import { LobbyActionLinks } from './LobbyActionLinks';
import { SessionProgressIndicator, OfflineModeIndicator, SessionResumeBanner, StreakCounter } from './SessionStatusBanners';
import { MediaStatsLine } from './MediaStatsLine';
import { LobbyModals } from './LobbyModals';
import { WelcomeBackBanner } from './WelcomeBackBanner';
import { SessionCompleteMessage, ScoreHistoryPanel, LobbyFooterActions } from './LobbyFooter';

export function LoggedInLobbyView(props) {
    const {
        user, login, setGameState,
        sessionId, roundNumber, totalRounds, sessionScore, roundComplete, sessionResults,
        startSession, beginRound, endSession,
        stats, streakBonus, lobbyTier, backendReady,
        scoringMode, setScoringMode,
        customImages, useCustomImages, handleUseCustomImagesChange, refreshCustomImages,
        sessionLength, setSessionLength,
        inviteCopied, handleInvite,
        showOnboarding, setShowOnboarding, onboardingDismissCallback, setOnboardingDismissCallback,
        showTour, handleTourComplete,
        showUnlockModal, setShowUnlockModal,
        selectedFriend, setSelectedFriend,
        showAll, setShowAll,
        showJourney, setShowJourney,
        welcomeMsg, setWelcomeMsg,
        showMultiplayer, setShowMultiplayer,
        joinCode, setJoinCode,
        mpLoading, mpLoadingAction,
        soundMuted, setSoundMuted,
        colorblindMode, setColorblindMode,
        countdown,
        weeklyEvent, dailyChallenge, dailyPlayed,
        startGame, startDailyChallenge,
        handleCreateRoom, handleJoinRoom, handleJoinAsSpectator,
    } = props;

    return (
        <>
            <LobbyModals
                showOnboarding={showOnboarding}
                onboardingDismissCallback={onboardingDismissCallback}
                showTour={showTour}
                handleTourComplete={handleTourComplete}
                showUnlockModal={showUnlockModal}
                setShowUnlockModal={setShowUnlockModal}
                selectedFriend={selectedFriend}
                setSelectedFriend={setSelectedFriend}
            />
            <PWAInstallBanner />
            <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <WelcomeBackBanner welcomeMsg={welcomeMsg} setWelcomeMsg={setWelcomeMsg} />
                    <LobbyTopBar
                        login={login}
                        soundMuted={soundMuted}
                        setSoundMuted={setSoundMuted}
                        colorblindMode={colorblindMode}
                        setColorblindMode={setColorblindMode}
                    />

                    <LobbyHeader user={user} />

                    <StreakHeroDisplay stats={stats} streakBonus={streakBonus} />

                    <MediaStatsLine user={user} stats={stats} />
                    <ScoringModeToggle
                        show={showAll || lobbyTier >= 1}
                        scoringMode={scoringMode}
                        setScoringMode={setScoringMode}
                        user={user}
                        login={login}
                    />
                    {(showAll || lobbyTier >= 1) && (user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE && (
                        <div className="mb-4">
                            <CustomImagesManager
                                customImages={customImages}
                                onRefresh={refreshCustomImages}
                                useCustomImages={useCustomImages}
                                onUseCustomImagesChange={handleUseCustomImagesChange}
                            />
                        </div>
                    )}
                    <LobbyActionLinks
                        inviteCopied={inviteCopied}
                        handleInvite={handleInvite}
                        setOnboardingDismissCallback={setOnboardingDismissCallback}
                        setShowOnboarding={setShowOnboarding}
                        setShowUnlockModal={setShowUnlockModal}
                    />

                    <SessionProgressIndicator
                        sessionId={sessionId}
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                        sessionScore={sessionScore}
                    />

                    <OfflineModeIndicator />

                    {/* Notification opt-in banner */}
                    <NotificationBanner />

                    <SessionResumeBanner
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                        beginRound={beginRound}
                    />

                    <StreakCounter stats={stats} />

                    <DailyChallengePanel
                        show={(showAll || lobbyTier >= 2) && !showMultiplayer}
                        dailyPlayed={dailyPlayed}
                        dailyChallenge={dailyChallenge}
                        countdown={countdown}
                        sessionId={sessionId}
                        onStart={startDailyChallenge}
                    />

                    <WeeklyEventBanner
                        show={showAll || lobbyTier >= 2}
                        weeklyEvent={weeklyEvent}
                    />

                    <FriendsList
                        show={showAll || lobbyTier >= 2}
                        onSelectFriend={setSelectedFriend}
                    />

                    {/* Weekly Challenge Pass */}
                    {!showMultiplayer && (
                        <div className="w-full mb-4">
                            <SeasonalChallengeBattlePass />
                        </div>
                    )}

                    {/* Solo play */}
                    {!showMultiplayer && (
                        <SoloPlayPanel
                            showAll={showAll}
                            lobbyTier={lobbyTier}
                            user={user}
                            login={login}
                            sessionId={sessionId}
                            roundComplete={roundComplete}
                            roundNumber={roundNumber}
                            totalRounds={totalRounds}
                            sessionLength={sessionLength}
                            setSessionLength={setSessionLength}
                            startGame={startGame}
                            setGameState={setGameState}
                            startSession={startSession}
                            setShowMultiplayer={setShowMultiplayer}
                            backendReady={backendReady}
                        />
                    )}

                    {/* Multiplayer panel */}
                    {showMultiplayer && (
                        <LobbyMultiplayerPanel
                            backendReady={backendReady}
                            joinCode={joinCode}
                            setJoinCode={setJoinCode}
                            mpLoading={mpLoading}
                            mpLoadingAction={mpLoadingAction}
                            handleCreateRoom={handleCreateRoom}
                            handleJoinRoom={handleJoinRoom}
                            handleJoinAsSpectator={handleJoinAsSpectator}
                            onBack={() => setShowMultiplayer(false)}
                        />
                    )}

                    <SessionCompleteMessage
                        sessionId={sessionId}
                        roundComplete={roundComplete}
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                        sessionScore={sessionScore}
                        sessionResults={sessionResults}
                    />

                    <ScoreHistoryPanel stats={stats} />

                    <JourneyCollapsible
                        show={stats.totalRounds >= 3}
                        showJourney={showJourney}
                        setShowJourney={setShowJourney}
                    />

                    <LobbyFooterActions
                        sessionId={sessionId}
                        roundComplete={roundComplete}
                        roundNumber={roundNumber}
                        totalRounds={totalRounds}
                        endSession={endSession}
                        showAll={showAll}
                        setShowAll={setShowAll}
                    />
                </div>
            </div>
        </>
    );
}

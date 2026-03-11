import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/Toast'
import { GameProvider, useGame } from './context/GameContext'
import { RoomProvider, useRoom } from './context/RoomContext'
import { Lobby } from './features/lobby/Lobby'
import { Round } from './features/round/Round'
import { Reveal } from './features/reveal/Reveal'
import { Gallery } from './features/gallery/Gallery'
import { Leaderboard } from './features/leaderboard/Leaderboard'
import { Achievements } from './features/achievements/Achievements'
import { ThemeBuilder } from './features/creator/ThemeBuilder'
import { Shop } from './features/shop/Shop'
import { AISettings } from './features/ai/AISettings'
import { AIBattle } from './features/ai/AIBattle'
import { SessionSummary } from './features/summary/SessionSummary'
import { JudgeRound } from './features/judge/JudgeRound'
import { ChallengeRound } from './features/challenge/ChallengeRound'
import { TournamentLobby } from './features/tournament/TournamentLobby'
import { AsyncChains } from './features/challenge/AsyncChains'
import { RoomLobby } from './features/room/RoomLobby'
import { MultiplayerRound } from './features/room/MultiplayerRound'
import { MultiplayerReveal } from './features/room/MultiplayerReveal'
import { parseJudgeShareUrl } from './services/share'
import { parseChallengeUrl, clearChallengeFromUrl } from './services/challenges'
import { parseThemeFromUrl, clearThemeFromUrl } from './services/themeBuilder'
import { initAudio } from './services/sounds'
import { trackEvent } from './services/analytics'
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard'
import { ErrorReport } from './components/ErrorReport'
import { initErrorMonitoring } from './services/errorMonitoring'
import { isNotificationEnabled, scheduleStreakReminder, scheduleDailyChallengeReminder } from './services/notifications'

initErrorMonitoring();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

function GameContent() {
    const { gameState, setGameState } = useGame();
    const { isMultiplayer, roomPhase } = useRoom();
    const [roundData, setRoundData] = useState(null);
    const [judgePayload, setJudgePayload] = useState(() => parseJudgeShareUrl());
    const [challengePayload, setChallengePayload] = useState(() => parseChallengeUrl());

    useEffect(() => {
        const onHashChange = () => {
            setJudgePayload(parseJudgeShareUrl());
            setChallengePayload(parseChallengeUrl());
            // Handle shared theme links
            const themeCode = parseThemeFromUrl();
            if (themeCode) {
                clearThemeFromUrl();
                setGameState('THEME_BUILDER');
            }
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    // Initialize audio on first user interaction
    useEffect(() => {
        const handler = () => {
            initAudio();
            trackEvent('game_start');
            document.removeEventListener('click', handler);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Initialize notification scheduling if permission was already granted
    useEffect(() => {
        if (isNotificationEnabled()) {
            try {
                const stats = JSON.parse(localStorage.getItem('vwf_stats') || '{}');
                if (stats.currentStreak > 0) {
                    scheduleStreakReminder(stats.currentStreak);
                }
                scheduleDailyChallengeReminder();
            } catch {
                // Ignore storage errors
            }
        }
    }, []);

    const handleRoundSubmit = (data) => {
        setRoundData(data);
    };

    const handleJudgeDone = () => {
        setJudgePayload(null);
    };

    const handleChallengeDone = () => {
        clearChallengeFromUrl();
        setChallengePayload(null);
    };

    const headerEl = (
        <div className="mb-8 text-center">
            <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight"><span className="text-gradient-vibrant">VENN</span> <span className="text-xl font-light tracking-widest text-white/60 uppercase">with Friends</span></h1>
        </div>
    );

    // Challenge mode (external link)
    if (challengePayload) {
        return (
            <Layout>
                {headerEl}
                <ChallengeRound payload={challengePayload} onDone={handleChallengeDone} />
            </Layout>
        );
    }

    // Judge mode (external link)
    if (judgePayload) {
        return (
            <Layout>
                {headerEl}
                <JudgeRound payload={judgePayload} onDone={handleJudgeDone} />
            </Layout>
        );
    }

    // Multiplayer mode
    if (isMultiplayer) {
        return (
            <Layout>
                {headerEl}
                {roomPhase === 'lobby' && <RoomLobby />}
                {roomPhase === 'playing' && <MultiplayerRound />}
                {roomPhase === 'revealing' && <MultiplayerReveal />}
                {roomPhase === 'finished' && <MultiplayerReveal />}
            </Layout>
        );
    }

    // Solo mode
    return (
        <Layout>
            {headerEl}

            {gameState === 'LOBBY' && <Lobby />}
            {gameState === 'GALLERY' && <Gallery />}
            {gameState === 'LEADERBOARD' && <Leaderboard onBack={() => setGameState('LOBBY')} />}
            {gameState === 'ACHIEVEMENTS' && <Achievements onBack={() => setGameState('LOBBY')} />}
            {gameState === 'THEME_BUILDER' && <ThemeBuilder onBack={() => setGameState('LOBBY')} />}
            {gameState === 'SHOP' && <Shop onBack={() => setGameState('LOBBY')} />}
            {gameState === 'AI_SETTINGS' && <AISettings onBack={() => setGameState('LOBBY')} />}
            {gameState === 'AI_BATTLE' && <AIBattle onDone={() => setGameState('LOBBY')} />}
            {gameState === 'ROUND' && <Round onSubmit={handleRoundSubmit} />}
            {gameState === 'REVEAL' && roundData && (
                <Reveal submission={roundData.submission} assets={roundData.assets} />
            )}
            {gameState === 'TOURNAMENT' && <TournamentLobby onBack={() => setGameState('LOBBY')} />}
            {gameState === 'ASYNC_CHAINS' && <AsyncChains onBack={() => setGameState('LOBBY')} />}
            {gameState === 'ANALYTICS' && <AnalyticsDashboard onBack={() => setGameState('LOBBY')} />}
            {gameState === 'ERROR_REPORT' && <ErrorReport onBack={() => setGameState('LOBBY')} />}
            {gameState === 'SESSION_SUMMARY' && <SessionSummary />}
        </Layout>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <GameProvider>
                    <RoomProvider>
                        <GameContent />
                        <ToastContainer />
                    </RoomProvider>
                </GameProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App

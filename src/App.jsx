import React, { useState, useEffect, lazy, Suspense } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/Toast'
import { GameProvider, useGame } from './context/GameContext'
import { RoomProvider, useRoom } from './context/RoomContext'
// Core flow - eagerly loaded
import { Lobby } from './features/lobby/Lobby'
import { Round } from './features/round/Round'
import { Reveal } from './features/reveal/Reveal'
import { Gallery } from './features/gallery/Gallery'
import { JudgeRound } from './features/judge/JudgeRound'
// Lazy-loaded features
const Leaderboard = lazy(() => import('./features/leaderboard/Leaderboard').then(m => ({ default: m.Leaderboard })))
const Achievements = lazy(() => import('./features/achievements/Achievements').then(m => ({ default: m.Achievements })))
const ThemeBuilder = lazy(() => import('./features/creator/ThemeBuilder').then(m => ({ default: m.ThemeBuilder })))
const Shop = lazy(() => import('./features/shop/Shop').then(m => ({ default: m.Shop })))
const AISettings = lazy(() => import('./features/ai/AISettings').then(m => ({ default: m.AISettings })))
const AIBattle = lazy(() => import('./features/ai/AIBattle').then(m => ({ default: m.AIBattle })))
const SessionSummary = lazy(() => import('./features/summary/SessionSummary').then(m => ({ default: m.SessionSummary })))
const ChallengeRound = lazy(() => import('./features/challenge/ChallengeRound').then(m => ({ default: m.ChallengeRound })))
const TournamentLobby = lazy(() => import('./features/tournament/TournamentLobby').then(m => ({ default: m.TournamentLobby })))
const AsyncChains = lazy(() => import('./features/challenge/AsyncChains').then(m => ({ default: m.AsyncChains })))
const AnalyticsDashboard = lazy(() => import('./features/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })))
const RankedPanel = lazy(() => import('./features/ranked/RankedPanel'))
import { RoomLobby } from './features/room/RoomLobby'
import { MultiplayerRound } from './features/room/MultiplayerRound'
import { MultiplayerReveal } from './features/room/MultiplayerReveal'
import { parseJudgeShareUrl } from './services/share'
import { parseChallengeUrl, clearChallengeFromUrl } from './services/challenges'
import { parseThemeFromUrl, clearThemeFromUrl } from './services/themeBuilder'
import { initAudio } from './services/sounds'
import { trackEvent, trackRetention, registerAnalyticsProvider, ConsoleAnalyticsProvider } from './services/analytics'
import { initErrorMonitoring } from './services/errorMonitoring'
import { processOfflineQueue, getQueueCount } from './services/offlineQueue'
import { scoreSubmission } from './services/gemini'

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-purple-400 text-lg animate-pulse">Loading...</div>
        </div>
    );
}

initErrorMonitoring();

// Initialize analytics providers
registerAnalyticsProvider(ConsoleAnalyticsProvider);

// Track DAU on app load
trackRetention();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.error('Service worker registration failed:', err);
        });
    });
}

function OfflineQueueHandler() {
    useEffect(() => {
        const handleOnline = async () => {
            const count = getQueueCount();
            if (count > 0) {
                await processOfflineQueue(scoreSubmission);
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);
    return null;
}

function PhaseTransition({ children, phase }) {
    const [currentChildren, setCurrentChildren] = useState(children);
    const [animClass, setAnimClass] = useState('phase-enter-active');

    useEffect(() => {
        // Fade out
        setAnimClass('phase-exit-active');
        const timer = setTimeout(() => {
            setCurrentChildren(children);
            setAnimClass('phase-enter');
            // Force reflow then fade in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimClass('phase-enter-active');
                });
            });
        }, 150);
        return () => clearTimeout(timer);
    }, [phase]); // Only transition when phase changes

    return (
        <div className={animClass}>
            {currentChildren}
        </div>
    );
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
                <Suspense fallback={<LoadingFallback />}>
                    <ChallengeRound payload={challengePayload} onDone={handleChallengeDone} />
                </Suspense>
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
            <Suspense fallback={<LoadingFallback />}>
            <PhaseTransition phase={gameState}>
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
                {gameState === 'RANKED' && <RankedPanel onBack={() => setGameState('LOBBY')} />}
                {gameState === 'SESSION_SUMMARY' && <SessionSummary />}
            </PhaseTransition>
            </Suspense>
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
                        <OfflineQueueHandler />
                        <ToastContainer />
                    </RoomProvider>
                </GameProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App

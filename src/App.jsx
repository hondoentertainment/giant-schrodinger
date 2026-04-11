import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import { GameProvider, useGame } from './context/GameContext';
import { RoomProvider, useRoom } from './context/RoomContext';
// AuthProvider scaffolds Supabase Auth (Wave 3 - growth features). It is a
// noop when Supabase isn't configured, so anonymous / offline play is the
// default and unaffected. Sits inside the Sentry.ErrorBoundary (mounted in
// main.jsx) so any auth-layer crashes are still reported, but outside the
// lazy/routed game content so the auth session is stable across navigation.
import { AuthProvider } from './features/auth/AuthContext';
// Core flow - Lobby is eager (initial landing); everything else is lazy
// so they stay out of the initial bundle.
import { Lobby } from './features/lobby/Lobby';
const Round = lazy(() => import('./features/round/Round').then((m) => ({ default: m.Round })));
const Reveal = lazy(() => import('./features/reveal/Reveal').then((m) => ({ default: m.Reveal })));
const Gallery = lazy(() =>
  import('./features/gallery/Gallery').then((m) => ({ default: m.Gallery }))
);
const JudgeRound = lazy(() =>
  import('./features/judge/JudgeRound').then((m) => ({ default: m.JudgeRound }))
);
// Lazy-loaded features
const Leaderboard = lazy(() =>
  import('./features/leaderboard/Leaderboard').then((m) => ({ default: m.Leaderboard }))
);
const Achievements = lazy(() =>
  import('./features/achievements/Achievements').then((m) => ({ default: m.Achievements }))
);
const ThemeBuilder = lazy(() =>
  import('./features/creator/ThemeBuilder').then((m) => ({ default: m.ThemeBuilder }))
);
const Shop = lazy(() => import('./features/shop/Shop').then((m) => ({ default: m.Shop })));
const AISettings = lazy(() =>
  import('./features/ai/AISettings').then((m) => ({ default: m.AISettings }))
);
const AIBattle = lazy(() =>
  import('./features/ai/AIBattle').then((m) => ({ default: m.AIBattle }))
);
const SessionSummary = lazy(() =>
  import('./features/summary/SessionSummary').then((m) => ({ default: m.SessionSummary }))
);
const ChallengeRound = lazy(() =>
  import('./features/challenge/ChallengeRound').then((m) => ({ default: m.ChallengeRound }))
);
const TournamentLobby = lazy(() =>
  import('./features/tournament/TournamentLobby').then((m) => ({ default: m.TournamentLobby }))
);
const AsyncChains = lazy(() =>
  import('./features/challenge/AsyncChains').then((m) => ({ default: m.AsyncChains }))
);
const AnalyticsDashboard = lazy(() =>
  import('./features/analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);
const AnalyticsView = lazy(() =>
  import('./features/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const ModerationDashboard = lazy(() =>
  import('./features/analytics/ModerationDashboard').then((m) => ({
    default: m.ModerationDashboard,
  }))
);
const RankedPanel = lazy(() => import('./features/ranked/RankedPanel'));
const RoomLobby = lazy(() =>
  import('./features/room/RoomLobby').then((m) => ({ default: m.RoomLobby }))
);
const MultiplayerRound = lazy(() =>
  import('./features/room/MultiplayerRound').then((m) => ({ default: m.MultiplayerRound }))
);
const MultiplayerReveal = lazy(() =>
  import('./features/room/MultiplayerReveal').then((m) => ({ default: m.MultiplayerReveal }))
);
import { parseJudgeShareUrl } from './services/share';
import { parseChallengeUrl, clearChallengeFromUrl } from './services/challenges';
import {
  parseThemeFromUrl,
  clearThemeFromUrl,
  importThemeFromLink,
  saveSharedTheme,
} from './services/themeBuilder';
import { initAudio } from './services/sounds';
import {
  trackEvent,
  trackRetention,
  registerAnalyticsProvider,
  ConsoleAnalyticsProvider,
} from './services/analytics';
import { initErrorMonitoring } from './services/errorMonitoring';
import { processOfflineQueue, getQueueCount } from './services/offlineQueue';
import { scoreSubmission } from './services/gemini';
import { initPWAInstall } from './lib/pwaInstall';

// Single proof-of-life conversion to react-i18next. Every other hardcoded
// string in the app still uses the legacy src/lib/i18n.js helper — those
// will migrate component-by-component in a follow-up.
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-purple-400 text-lg animate-pulse">{t('app.loading')}</div>
    </div>
  );
}

// Module-level analytics init (safe to run once)
registerAnalyticsProvider(ConsoleAnalyticsProvider);
trackRetention();
initPWAInstall();

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

  return <div className={animClass}>{currentChildren}</div>;
}

function GameContent() {
  const { gameState, setGameState } = useGame();
  const { isMultiplayer, roomPhase } = useRoom();
  const [roundData, setRoundData] = useState(null);
  const [judgePayload, setJudgePayload] = useState(() => parseJudgeShareUrl());
  const [challengePayload, setChallengePayload] = useState(() => parseChallengeUrl());

  // Handle incoming encoded theme links on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('theme_')) {
      const theme = importThemeFromLink(hash);
      if (theme) {
        saveSharedTheme(theme);
        window.location.hash = '';
      }
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      // Handle encoded theme links
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('theme_')) {
        const theme = importThemeFromLink(hash);
        if (theme) {
          saveSharedTheme(theme);
          window.location.hash = '';
        }
        return;
      }

      setJudgePayload(parseJudgeShareUrl());
      setChallengePayload(parseChallengeUrl());
      // Handle shared theme links (code-based)
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

  const handleRoundSubmit = useCallback((data) => {
    setRoundData(data);
  }, []);

  const handleJudgeDone = useCallback(() => {
    setJudgePayload(null);
  }, []);

  const handleChallengeDone = useCallback(() => {
    clearChallengeFromUrl();
    setChallengePayload(null);
  }, []);

  const headerEl = (
    <div className="mb-8 text-center">
      <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight">
        <span className="text-gradient-vibrant">VENN</span>{' '}
        <span className="text-xl font-light tracking-widest text-white/60 uppercase">
          with Friends
        </span>
      </h1>
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
        <Suspense fallback={<LoadingFallback />}>
          <JudgeRound payload={judgePayload} onDone={handleJudgeDone} />
        </Suspense>
      </Layout>
    );
  }

  // Multiplayer mode
  if (isMultiplayer) {
    return (
      <Layout>
        {headerEl}
        <Suspense fallback={<LoadingFallback />}>
          {roomPhase === 'lobby' && <RoomLobby />}
          {roomPhase === 'playing' && <MultiplayerRound />}
          {roomPhase === 'revealing' && <MultiplayerReveal />}
          {roomPhase === 'finished' && <MultiplayerReveal />}
        </Suspense>
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
          {gameState === 'REVEAL' && !roundData && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-white/60 mb-4">Session data was lost.</p>
              <button
                onClick={() => setGameState('LOBBY')}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold"
              >
                Back to Lobby
              </button>
            </div>
          )}
          {gameState === 'TOURNAMENT' && <TournamentLobby onBack={() => setGameState('LOBBY')} />}
          {gameState === 'ASYNC_CHAINS' && <AsyncChains onBack={() => setGameState('LOBBY')} />}
          {gameState === 'ANALYTICS' && <AnalyticsView onBack={() => setGameState('LOBBY')} />}
          {gameState === 'MODERATION' && (
            <ModerationDashboard onBack={() => setGameState('LOBBY')} />
          )}
          {gameState === 'RANKED' && <RankedPanel onBack={() => setGameState('LOBBY')} />}
          {gameState === 'SESSION_SUMMARY' && (
            <SessionSummary onBack={() => setGameState('LOBBY')} />
          )}
        </PhaseTransition>
      </Suspense>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    const cleanup = initErrorMonitoring();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <GameProvider>
            <RoomProvider>
              <GameContent />
              <OfflineQueueHandler />
              <ToastContainer />
            </RoomProvider>
          </GameProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

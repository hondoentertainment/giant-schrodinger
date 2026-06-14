import React from 'react';
import { Users, WifiOff, Trophy, Award, Palette, ShoppingBag, Brain, Link, BarChart3, Shield } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { getBuiltInPacks, getCustomPacks } from '../../../services/promptPacks';
import { getCurrentSeason } from '../../../services/leaderboard';
import { playClick } from '../../../services/sounds';
import { haptic } from '../../../lib/haptics';
import { trackEvent } from '../../../services/analytics';

export function SoloPlayPanel({
    showAll,
    lobbyTier,
    user,
    login,
    sessionId,
    roundComplete,
    roundNumber,
    totalRounds,
    sessionLength,
    setSessionLength,
    startGame,
    setGameState,
    startSession,
    setShowMultiplayer,
    backendReady,
}) {
    const { t } = useTranslation();
    return (
        <>
            {/* Prompt Pack Selector (Tier 1+) */}
            {(showAll || lobbyTier >= 1) && <div className="w-full max-w-md mb-4">
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">{t('lobby.conceptPack')}</label>
                <select
                    value={user?.promptPack || ''}
                    onChange={(e) => login({ ...user, promptPack: e.target.value || null })}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="">{t('lobby.randomDefault')}</option>
                    {getBuiltInPacks().map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.name} — {pack.description}</option>
                    ))}
                    {getCustomPacks().map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.name} (Custom)</option>
                    ))}
                </select>
            </div>}

            {/* Session length (Tier 1+, only when not in active session) */}
            {(showAll || lobbyTier >= 1) && !sessionId && (
                <div className="mb-4">
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">{t('lobby.sessionLength')}</label>
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
                    <p className="text-center text-white/40 text-xs mt-1">{t('lobby.nRoundsAvg', { rounds: sessionLength })}</p>
                </div>
            )}
            <div className="flex gap-3 w-full">
                <button
                    onClick={() => { playClick(); startGame(); }}
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
                            ? t('lobby.sessionComplete')
                            : t('lobby.startRound', { round: roundComplete ? roundNumber + 1 : roundNumber })
                        : t('lobby.soloSession', { rounds: sessionLength })}
                </button>
                {(showAll || lobbyTier >= 2) && <button
                    onClick={() => setGameState('GALLERY')}
                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex items-center justify-center"
                    aria-label="View connection gallery"
                    title={t('lobby.gallery')}
                >
                    🖼️
                </button>}
                {(showAll || lobbyTier >= 2) && <button
                    onClick={() => setGameState('LEADERBOARD')}
                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex flex-col items-center justify-center"
                    aria-label="View leaderboard"
                    title={t('lobby.leaderboard')}
                >
                    <Trophy className="w-5 h-5" />
                    <span className="text-xs text-purple-300">{getCurrentSeason().name}</span>
                </button>}
            </div>

            {/* AI Battle button (Tier 3+) */}
            {(showAll || lobbyTier >= 3) && <button
                onClick={() => {
                    if (!sessionId) startSession(sessionLength);
                    setGameState('AI_BATTLE');
                }}
                className="w-full py-4 bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg border border-red-500/30"
            >
                {`🤖 ${t('lobby.aiBattle')}`}
            </button>}

            {/* Quick nav row (Tier 2+: achievements, leaderboard, gallery) */}
            {(showAll || lobbyTier >= 2) && <div className="flex gap-2 mt-3">
                <button
                    onClick={() => setGameState('ACHIEVEMENTS')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.achievements')}
                >
                    <Award className="w-4 h-4" /> {t('lobby.achievements')}
                </button>
                <button
                    onClick={() => setGameState('THEME_BUILDER')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.creator')}
                >
                    <Palette className="w-4 h-4" /> {t('lobby.creator')}
                </button>
                <button
                    onClick={() => setGameState('SHOP')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.shop')}
                >
                    <ShoppingBag className="w-4 h-4" /> {t('lobby.shop')}
                </button>
                <button
                    onClick={() => setGameState('AI_SETTINGS')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.aiSettings')}
                >
                    <Brain className="w-4 h-4" /> {t('lobby.aiSettings')}
                </button>
            </div>}

            {/* Tournament & Challenge Chains (Tier 3+) */}
            {(showAll || lobbyTier >= 3) && <div className="flex gap-2 mt-3">
                <button
                    onClick={() => { playClick(); haptic('light'); trackEvent('nav_tournament'); setGameState('TOURNAMENT'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.tournaments')}
                >
                    <Trophy className="w-4 h-4" /> {t('lobby.tournaments')}
                </button>
                <button
                    onClick={() => { playClick(); haptic('light'); trackEvent('nav_async_chains'); setGameState('ASYNC_CHAINS'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.challengeChains')}
                >
                    <Link className="w-4 h-4" /> {t('lobby.challengeChains')}
                </button>
                <button
                    onClick={() => { playClick(); haptic('light'); trackEvent('nav_analytics'); setGameState('ANALYTICS'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title={t('lobby.analytics')}
                >
                    <BarChart3 className="w-4 h-4" /> {t('lobby.analytics')}
                </button>
            </div>}

            {/* Ranked button (Tier 3+) */}
            {(showAll || lobbyTier >= 3) && <button
                onClick={() => { playClick(); haptic('light'); trackEvent('nav_ranked'); setGameState('RANKED'); }}
                className="mt-3 w-full py-3 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
            >
                <Shield className="w-5 h-5" />
                Ranked Mode
            </button>}

            {/* Multiplayer button (Tier 3+) */}
            {(showAll || lobbyTier >= 3) && <button
                onClick={() => setShowMultiplayer(true)}
                className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
                <Users className="w-5 h-5" />
                {t('lobby.multiplayer')}
                {!backendReady && <WifiOff className="w-4 h-4 opacity-50" />}
            </button>}
        </>
    );
}

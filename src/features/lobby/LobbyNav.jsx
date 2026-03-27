import React from 'react';
import { Users, WifiOff, Trophy, Award, Palette, ShoppingBag, Brain, Link, BarChart3 } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { trackEvent } from '../../services/analytics';

export function LobbyNav({
    onNavigate,
    onStartGame,
    onStartAIBattle,
    onShowMultiplayer,
    sessionId,
    roundComplete,
    roundNumber,
    totalRounds,
    sessionLength,
    backendReady,
}) {
    return (
        <>
            <div className="flex gap-3 w-full">
                <button
                    onClick={onStartGame}
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
                    onClick={() => onNavigate('GALLERY')}
                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex items-center justify-center"
                    aria-label="View connection gallery"
                    title="Gallery"
                >
                    🖼️
                </button>
                <button
                    onClick={() => onNavigate('LEADERBOARD')}
                    className="px-4 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors min-w-[48px] min-h-[52px] flex items-center justify-center"
                    aria-label="View leaderboard"
                    title="Leaderboard"
                >
                    <Trophy className="w-5 h-5" />
                </button>
            </div>

            {/* AI Battle button */}
            <button
                onClick={onStartAIBattle}
                className="w-full py-4 bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg border border-red-500/30"
            >
                🤖 vs AI Battle
            </button>

            {/* Quick nav row */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => onNavigate('ACHIEVEMENTS')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Achievements"
                >
                    <Award className="w-4 h-4" /> Achievements
                </button>
                <button
                    onClick={() => onNavigate('THEME_BUILDER')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Theme Builder"
                >
                    <Palette className="w-4 h-4" /> Creator
                </button>
                <button
                    onClick={() => onNavigate('SHOP')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Shop"
                >
                    <ShoppingBag className="w-4 h-4" /> Shop
                </button>
                <button
                    onClick={() => onNavigate('AI_SETTINGS')}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="AI Settings"
                >
                    <Brain className="w-4 h-4" /> AI
                </button>
            </div>

            {/* Tournament & Challenge Chains */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => { haptic('light'); trackEvent('nav_tournament'); onNavigate('TOURNAMENT'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Tournaments"
                >
                    <Trophy className="w-4 h-4" /> Tournaments
                </button>
                <button
                    onClick={() => { haptic('light'); trackEvent('nav_async_chains'); onNavigate('ASYNC_CHAINS'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Challenge Chains"
                >
                    <Link className="w-4 h-4" /> Challenge Chains
                </button>
                <button
                    onClick={() => { haptic('light'); trackEvent('nav_analytics'); onNavigate('ANALYTICS'); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Analytics"
                >
                    <BarChart3 className="w-4 h-4" /> Analytics
                </button>
            </div>

            {/* Multiplayer button */}
            <button
                onClick={onShowMultiplayer}
                className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
                <Users className="w-5 h-5" />
                Play with Friends
                {!backendReady && <WifiOff className="w-4 h-4 opacity-50" />}
            </button>
        </>
    );
}

import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getStats } from '../../services/stats';
import { getOwnedItems, getEquippedItems } from '../../services/shop';
import { getPlayerBest } from '../../services/leaderboard';
import { ArrowLeft, Share2, Trophy, Flame, Star, Award } from 'lucide-react';
import { haptic } from '../../lib/haptics';

export function PlayerProfile({ onBack }) {
    const { user } = useGame();
    const [shareStatus, setShareStatus] = useState(null);
    const stats = useMemo(() => getStats(), []);
    const owned = useMemo(() => getOwnedItems(), []);
    const equipped = useMemo(() => getEquippedItems(), []);
    const best = useMemo(() => user?.name ? getPlayerBest(user.name) : {}, [user?.name]);

    // Load achievements from localStorage directly
    const achievements = useMemo(() => {
        try {
            const state = JSON.parse(localStorage.getItem('vwf_achievements') || '{}');
            return Object.keys(state.unlocked || {});
        } catch { return []; }
    }, []);

    const handleShare = async () => {
        const profileText = [
            `${user?.name}'s Venn with Friends Profile`,
            `Rounds: ${stats.totalRounds || 0}`,
            `Best Streak: ${stats.maxStreak || 0} days`,
            `Achievements: ${achievements.length}`,
            `Cosmetics: ${owned.length}`,
            '',
            `Play now: ${window.location.origin}${window.location.pathname}`,
        ].join('\n');

        try {
            await navigator.clipboard.writeText(profileText);
            haptic('success');
            setShareStatus('copied');
            setTimeout(() => setShareStatus(null), 2500);
        } catch {
            setShareStatus('failed');
        }
    };

    return (
        <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Back to lobby"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-white flex-1">Player Profile</h2>
                <button
                    onClick={handleShare}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Share profile"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {shareStatus === 'copied' && (
                <div className="text-center text-emerald-400 text-sm animate-in fade-in duration-300">Profile copied to clipboard!</div>
            )}

            {/* Profile header */}
            <div className="glass-panel rounded-3xl p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-3 ring-4 ring-white/10">
                    {user?.avatar || '🎯'}
                </div>
                <h3 className="text-2xl font-display font-bold text-white">{user?.name || 'Player'}</h3>
                {equipped?.TITLE_BADGES && (
                    <div className="mt-1 text-purple-300 text-sm font-semibold">{equipped.TITLE_BADGES}</div>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <div className="text-2xl font-black text-white">{stats.totalRounds || 0}</div>
                    <div className="text-white/40 text-xs">Rounds Played</div>
                </div>
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <div className="text-2xl font-black text-white">{stats.maxStreak || 0}</div>
                    <div className="text-white/40 text-xs">Best Streak</div>
                </div>
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <div className="text-2xl font-black text-white">{best?.bestScore ?? '-'}</div>
                    <div className="text-white/40 text-xs">Best Score</div>
                </div>
                <div className="glass-panel rounded-2xl p-4 text-center">
                    <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <div className="text-2xl font-black text-white">{achievements.length}</div>
                    <div className="text-white/40 text-xs">Achievements</div>
                </div>
            </div>

            {/* Current streak */}
            {(stats.currentStreak || 0) > 0 && (
                <div className="glass-panel rounded-2xl p-4 text-center bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                    <div className="text-3xl font-black text-amber-400">Day {stats.currentStreak}</div>
                    <div className="text-white/60 text-sm">Active Streak</div>
                </div>
            )}

            {/* Owned cosmetics */}
            <div className="glass-panel rounded-2xl p-4">
                <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3 font-semibold">Cosmetics Collection</h4>
                {owned.length === 0 ? (
                    <p className="text-white/30 text-sm text-center">No cosmetics yet — visit the shop!</p>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {owned.slice(0, 12).map((item, i) => (
                            <div
                                key={i}
                                className={`rounded-xl p-2 text-center text-xs ${
                                    Object.values(equipped || {}).includes(item.itemId)
                                        ? 'bg-purple-500/20 border border-purple-500/30'
                                        : 'bg-white/5 border border-white/10'
                                }`}
                            >
                                <div className="text-white/80 truncate">{item.itemId}</div>
                            </div>
                        ))}
                    </div>
                )}
                {owned.length > 12 && (
                    <p className="text-white/30 text-xs text-center mt-2">+{owned.length - 12} more</p>
                )}
            </div>
        </div>
    );
}

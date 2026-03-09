import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getDailyLeaderboard, getWeeklyLeaderboard, getPlayerRank } from '../../services/leaderboard';
import { getStats } from '../../services/stats';
import { Trophy, Crown, Star, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { getScoreBand } from '../../lib/scoreBands';

const TABS = [
    { id: 'daily', label: 'Today', icon: Calendar },
    { id: 'weekly', label: 'This Week', icon: TrendingUp },
];

function getRankStyle(rank) {
    if (rank === 1) return { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', text: 'text-amber-300' };
    if (rank === 2) return { bg: 'from-slate-300/15 to-slate-400/15', border: 'border-slate-400/30', text: 'text-slate-300' };
    if (rank === 3) return { bg: 'from-orange-600/15 to-amber-700/15', border: 'border-orange-500/30', text: 'text-orange-300' };
    return { bg: 'from-white/5 to-white/5', border: 'border-white/10', text: 'text-white/60' };
}

function getRankIcon(rank) {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Star className="w-5 h-5 text-orange-400" />;
    return <span className="text-sm font-bold text-white/40">{rank}</span>;
}

function LeaderboardEntry({ entry, rank }) {
    const style = getRankStyle(rank);
    const band = getScoreBand(entry.score);
    const isTopThree = rank <= 3;

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${style.bg} border ${style.border} animate-in slide-in-from-bottom-4 duration-500`}
            style={{ animationDelay: `${rank * 60}ms` }}
        >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isTopThree ? 'bg-white/10' : 'bg-white/5'}`}>
                {getRankIcon(rank)}
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                {entry.avatar || '\uD83D\uDC7D'}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${isTopThree ? 'text-white' : 'text-white/80'}`}>
                    {entry.playerName}
                </div>
                <div className="text-white/30 text-xs">
                    {entry.roundCount || 0} {entry.roundCount === 1 ? 'game' : 'games'}
                </div>
            </div>
            <div className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${band?.color || 'from-slate-400 to-slate-500'}`}>
                {entry.score}
            </div>
        </div>
    );
}

export function Leaderboard({ onBack }) {
    const { user } = useGame();
    const [activeTab, setActiveTab] = useState('daily');

    const entries = useMemo(() => {
        return activeTab === 'daily' ? getDailyLeaderboard() : getWeeklyLeaderboard();
    }, [activeTab]);

    const playerRank = useMemo(() => {
        if (!user?.name) return null;
        return getPlayerRank(user.name);
    }, [user?.name]);

    const stats = useMemo(() => getStats(), []);

    const bestScore = useMemo(() => {
        if (!entries.length || !user?.name) return null;
        const playerEntries = entries.filter((e) => e.playerName === user.name);
        if (!playerEntries.length) return null;
        return Math.max(...playerEntries.map((e) => e.score));
    }, [entries, user?.name]);

    return (
        <div className="w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="bg-gradient-to-br from-purple-900/30 via-indigo-900/40 to-blue-900/30 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-amber-400" />
                                Leaderboard
                            </h2>
                        </div>
                    </div>

                    {/* Player rank highlight */}
                    {playerRank && playerRank.rank !== null && (
                        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/25 text-center animate-in fade-in duration-500">
                            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Your Rank</div>
                            <div className="text-4xl font-black text-purple-300 mb-1">
                                #{playerRank.rank}
                            </div>
                            <div className="text-white/50 text-sm">
                                Top {Math.max(1, Math.round(100 - playerRank.percentile))}% of {playerRank.total} {playerRank.total === 1 ? 'player' : 'players'}
                            </div>
                        </div>
                    )}

                    {/* Tab toggle */}
                    <div className="flex gap-2 mb-5">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                        isActive
                                            ? 'bg-white/15 text-white border border-white/20'
                                            : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Leaderboard entries */}
                    {entries.length > 0 ? (
                        <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-1">
                            {entries.map((entry, idx) => (
                                <LeaderboardEntry key={`${entry.playerName}-${entry.timestamp}`} entry={entry} rank={idx + 1} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 mb-6">
                            <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 text-sm">
                                No scores yet today. Play a round to get on the board!
                            </p>
                        </div>
                    )}

                    {/* Personal stats */}
                    <div className="border-t border-white/10 pt-5">
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Your Stats</div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                <div className="text-2xl font-bold text-amber-400">
                                    {stats.currentStreak > 0 ? `${stats.currentStreak}` : '0'}
                                </div>
                                <div className="text-white/40 text-xs uppercase tracking-wider">Streak</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                <div className="text-2xl font-bold text-white">{stats.totalRounds}</div>
                                <div className="text-white/40 text-xs uppercase tracking-wider">Rounds</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${bestScore ? getScoreBand(bestScore).color : 'from-slate-400 to-slate-500'}`}>
                                    {bestScore ?? '-'}
                                </div>
                                <div className="text-white/40 text-xs uppercase tracking-wider">Best</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getDailyLeaderboard, getWeeklyLeaderboard, getPlayerRank, getPlayerBest } from '../../services/leaderboard';
import { getStats } from '../../services/stats';
import { Trophy, Crown, Star, Calendar, TrendingUp } from 'lucide-react';
import { getScoreBand } from '../../lib/scoreBands';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';

const TABS = [
    { id: 'daily', label: 'Today', icon: Calendar },
    { id: 'weekly', label: 'This Week', icon: TrendingUp },
];

function getRankStyle(rank) {
    if (rank === 1) return { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-400/35', text: 'text-amber-200' };
    if (rank === 2) return { bg: 'from-slate-300/15 to-slate-400/15', border: 'border-slate-400/30', text: 'text-slate-200' };
    if (rank === 3) return { bg: 'from-orange-600/15 to-amber-700/15', border: 'border-orange-500/30', text: 'text-orange-200' };
    return { bg: 'from-white/5 to-white/5', border: 'border-white/10', text: 'text-white/60' };
}

function getRankIcon(rank) {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-300" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-200" />;
    if (rank === 3) return <Star className="w-5 h-5 text-orange-300" />;
    return <span className="text-sm font-bold text-white/40">{rank}</span>;
}

function LeaderboardEntry({ entry, rank }) {
    const style = getRankStyle(rank);
    const band = getScoreBand(entry.score);
    const isTopThree = rank <= 3;

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r ${style.bg} border ${style.border} animate-in slide-in-from-bottom-4 duration-500`}
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
                <div className="text-white/35 text-xs">
                    {entry.roundCount || 0} {entry.roundCount === 1 ? 'game' : 'games'}
                </div>
            </div>
            <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${band?.color || 'from-slate-400 to-slate-500'}`}>
                {entry.score}
            </div>
        </div>
    );
}

export function Leaderboard({ onBack }) {
    const { user } = useGame();
    const [activeTab, setActiveTab] = useState('daily');
    const [refreshKey] = useState(0);

    const entries = useMemo(() => {
        return activeTab === 'daily' ? getDailyLeaderboard() : getWeeklyLeaderboard();
    }, [activeTab, refreshKey]);

    const playerRank = useMemo(() => {
        if (!user?.name) return null;
        return getPlayerRank(user.name);
    }, [user?.name, refreshKey]);

    const stats = useMemo(() => getStats(), [refreshKey]);

    const bestScore = useMemo(() => {
        if (!user?.name) return null;
        const { bestScore: best } = getPlayerBest(user.name);
        return best;
    }, [user?.name, refreshKey]);

    return (
        <GameScreenShell onBack={onBack} title="Leaderboard" icon={Trophy} maxWidth="max-w-xl" backLabel="Back to lobby">
            {playerRank && playerRank.rank !== null && (
                <div className="game-highlight-banner mb-5 animate-in fade-in duration-500">
                    <div className="game-section-label mb-1">Your rank</div>
                    <div className="text-4xl font-bold text-blue-200 mb-1 tabular-nums">
                        #{playerRank.rank}
                    </div>
                    <div className="text-white/50 text-sm">
                        Top {Math.max(1, Math.round(100 - playerRank.percentile))}% of {playerRank.total} {playerRank.total === 1 ? 'player' : 'players'}
                    </div>
                </div>
            )}

            <div className="game-tab-row mb-5">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`game-tab ${isActive ? 'game-tab-active' : ''}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {entries.length > 0 ? (
                <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-1">
                    {entries.map((entry, idx) => (
                        <LeaderboardEntry key={`${entry.playerName}-${entry.timestamp}`} entry={entry} rank={idx + 1} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="🏆"
                    title="No scores yet"
                    description="Play a round today to land on the board."
                    className="mb-6"
                />
            )}

            <div className="border-t border-white/10 pt-5">
                <div className="game-section-label mb-3">Your stats</div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="game-stat-tile">
                        <div className="text-2xl font-bold text-amber-300 tabular-nums">
                            {stats.currentStreak > 0 ? `${stats.currentStreak}` : '0'}
                        </div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Streak</div>
                    </div>
                    <div className="game-stat-tile">
                        <div className="text-2xl font-bold text-white tabular-nums">{stats.totalRounds}</div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Rounds</div>
                    </div>
                    <div className="game-stat-tile">
                        <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${bestScore ? getScoreBand(bestScore).color : 'from-slate-400 to-slate-500'}`}>
                            {bestScore ?? '-'}
                        </div>
                        <div className="game-section-label mt-1 normal-case tracking-normal text-[10px]">Best</div>
                    </div>
                </div>
            </div>
        </GameScreenShell>
    );
}

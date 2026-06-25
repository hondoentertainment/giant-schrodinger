import React, { useState, useMemo } from 'react';
import { getAIDifficulty, setAIDifficulty, getDifficultyConfig, getGlobalCreativityIndex, getTrendingConnections, getPersonalInsights } from '../../services/aiFeatures';
import { getStats } from '../../services/stats';
import { Brain, Zap, TrendingUp, BarChart3, Globe } from 'lucide-react';
import { GameScreenShell } from '../../components/GameScreenShell';
import { haptic } from '../../lib/haptics';

const DIFFICULTY_LEVELS = ['easy', 'normal', 'hard'];

const DIFFICULTY_COLORS = {
    easy: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        ring: 'ring-emerald-400',
        text: 'text-emerald-400',
        icon: '🌱',
    },
    normal: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        ring: 'ring-blue-400',
        text: 'text-blue-400',
        icon: '⚡',
    },
    hard: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        ring: 'ring-red-400',
        text: 'text-red-400',
        icon: '🔥',
    },
};

export function AISettings({ onBack }) {
    const [difficulty, setDifficulty] = useState(() => getAIDifficulty());

    const stats = useMemo(() => getStats(), []);
    const creativityIndex = useMemo(() => getGlobalCreativityIndex(), []);
    const trending = useMemo(() => getTrendingConnections(), []);
    const insights = useMemo(() => getPersonalInsights(stats, null), [stats]);

    const handleDifficultyChange = (level) => {
        setAIDifficulty(level);
        setDifficulty(level);
        haptic('light');
    };

    return (
        <GameScreenShell onBack={onBack} title="AI Settings" icon={Brain} maxWidth="max-w-xl" backLabel="Back to lobby">
                <section className="wordle-card p-5 space-y-4 mb-6 !shadow-none">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Zap size={18} className="text-amber-300" />
                        AI Difficulty
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {DIFFICULTY_LEVELS.map((level) => {
                            const config = getDifficultyConfig(level);
                            const colors = DIFFICULTY_COLORS[level];
                            const isSelected = difficulty === level;

                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => handleDifficultyChange(level)}
                                    className={`
                                        relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 min-h-[44px]
                                        ${colors.bg} ${colors.border}
                                        ${isSelected
                                            ? `ring-2 ${colors.ring} shadow-lg`
                                            : 'hover:bg-white/10 opacity-70'
                                        }
                                    `}
                                >
                                    <span className="text-2xl">{colors.icon}</span>
                                    <span className={`font-bold text-sm ${colors.text}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-white/45 text-center leading-tight">
                                        {config.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="wordle-card p-5 space-y-3 mb-6 !shadow-none">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Globe size={18} className="text-blue-300" />
                        Global Creativity Index
                    </h2>
                    <div className="game-highlight-banner text-left">
                        <div className="text-3xl font-bold text-blue-200 tabular-nums">{creativityIndex.score}</div>
                        <p className="text-white/50 text-sm mt-1">{creativityIndex.label}</p>
                    </div>
                </section>

                {trending.length > 0 && (
                    <section className="wordle-card p-5 space-y-3 mb-6 !shadow-none">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-300" />
                            Trending Connections
                        </h2>
                        <div className="space-y-2">
                            {trending.slice(0, 5).map((item, i) => (
                                <div key={i} className="game-list-row justify-between">
                                    <span className="text-white/80 text-sm truncate flex-1">&ldquo;{item.submission}&rdquo;</span>
                                    <span className="text-amber-300 font-bold tabular-nums ml-2">{item.score}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {insights.length > 0 && (
                    <section className="wordle-card p-5 space-y-3 !shadow-none">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 size={18} className="text-purple-300" />
                            Personal Insights
                        </h2>
                        <ul className="space-y-2 text-sm text-white/65">
                            {insights.map((insight, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-game-accent">•</span>
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
        </GameScreenShell>
    );
}

import React, { useState, useMemo } from 'react';
import { getAIDifficulty, setAIDifficulty, getDifficultyConfig, getGlobalCreativityIndex, getTrendingConnections, getPersonalInsights } from '../../services/aiFeatures';
import { getStats } from '../../services/stats';
import { ArrowLeft, Brain, Zap, TrendingUp, BarChart3, Globe } from 'lucide-react';

const DIFFICULTY_LEVELS = ['easy', 'normal', 'hard'];

const DIFFICULTY_COLORS = {
    easy: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        ring: 'ring-emerald-400',
        glow: 'shadow-emerald-500/25',
        text: 'text-emerald-400',
        bar: 'bg-emerald-500',
        icon: '🌱',
    },
    normal: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        ring: 'ring-blue-400',
        glow: 'shadow-blue-500/25',
        text: 'text-blue-400',
        bar: 'bg-blue-500',
        icon: '⚡',
    },
    hard: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        ring: 'ring-red-400',
        glow: 'shadow-red-500/25',
        text: 'text-red-400',
        bar: 'bg-red-500',
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
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white p-4 flex flex-col items-center">
            <div className="w-full max-w-xl space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        aria-label="Back to lobby"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Brain size={24} className="text-purple-400" />
                        <h1 className="text-2xl font-bold">AI Settings & Insights</h1>
                    </div>
                </div>

                {/* AI Difficulty Selector */}
                <section className="glass-panel rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Zap size={18} className="text-yellow-400" />
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
                                    onClick={() => handleDifficultyChange(level)}
                                    className={`
                                        relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200
                                        ${colors.bg} ${colors.border}
                                        ${isSelected
                                            ? `ring-2 ${colors.ring} shadow-lg ${colors.glow}`
                                            : 'hover:bg-white/10 opacity-60'
                                        }
                                    `}
                                >
                                    <span className="text-2xl">{colors.icon}</span>
                                    <span className={`font-bold text-sm ${colors.text}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-gray-400 text-center leading-tight">
                                        {config.description}
                                    </span>
                                    {isSelected && (
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colors.bar} ring-2 ring-gray-900`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* AI Opponent */}
                <section className="glass-panel rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Brain size={18} className="text-purple-400" />
                        AI Opponent
                    </h2>
                    <p className="text-sm text-gray-400">
                        Test your creativity against an AI opponent. The AI will generate its own
                        connection and you will see how your score compares.
                    </p>
                    <button
                        onClick={onBack}
                        className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                        <Zap size={16} />
                        Play with AI Judge
                    </button>
                    <p className="text-xs text-gray-500 text-center">Set scoring to &quot;AI Judge&quot; in the lobby to play against the AI</p>
                </section>

                {/* Global Creativity Index */}
                <section className="glass-panel rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Globe size={18} className="text-cyan-400" />
                        Global Creativity Index
                    </h2>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-center">
                            <span className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                {creativityIndex.score}
                            </span>
                            <span className="text-lg text-gray-500 ml-1">/ 10</span>
                        </div>
                        <p className="text-xs text-gray-500">Today — {creativityIndex.date}</p>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${(creativityIndex.score / 10) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between w-full text-xs text-gray-600">
                            <span>0</span>
                            <span>5</span>
                            <span>10</span>
                        </div>
                    </div>
                </section>

                {/* Trending Connections */}
                <section className="glass-panel rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp size={18} className="text-orange-400" />
                        Trending Connections
                    </h2>
                    <ul className="space-y-3">
                        {trending.map((item, index) => (
                            <li key={index} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{item.style}</span>
                                    <span className="text-xs text-gray-400">{item.popularity}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                                        style={{ width: `${item.popularity}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 italic">{item.example}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Personal Insights */}
                <section className="glass-panel rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 size={18} className="text-green-400" />
                        Personal Insights
                    </h2>
                    <ul className="space-y-3">
                        {insights.map((insight, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                                <span className="text-green-400 mt-0.5 shrink-0">
                                    <BarChart3 size={14} />
                                </span>
                                <span className="text-sm text-gray-300">{insight}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Bottom spacer */}
                <div className="h-8" />
            </div>
        </div>
    );
}

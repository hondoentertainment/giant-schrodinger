import React, { useState, useEffect } from 'react';
import { getSessionMetrics, getEventCount, getEvents } from '../../services/analytics';
import { getHighlightStats } from '../../services/highlights';
import { BarChart3, TrendingUp, Share2, Target, Calendar, Users } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, subtext, color = 'purple' }) {
    const colorMap = {
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/20',
        green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/20',
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/20',
        amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/20',
        pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/20',
    };
    return (
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.purple} border`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-white/60" />
                <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtext && <div className="text-white/40 text-xs mt-1">{subtext}</div>}
        </div>
    );
}

export function AnalyticsDashboard({ onBack }) {
    const [metrics, setMetrics] = useState(null);
    const [highlightStats, setHighlightStats] = useState(null);
    const [eventCounts, setEventCounts] = useState({});

    useEffect(() => {
        setMetrics(getSessionMetrics());
        setHighlightStats(getHighlightStats());
        setEventCounts({
            gameStarts: getEventCount('game_start'),
            roundsCompleted: getEventCount('round_complete'),
            shares: getEventCount('share_click'),
            challenges: getEventCount('challenge_sent'),
            dailies: getEventCount('daily_complete'),
            aiBattles: getEventCount('ai_battle_complete'),
            tournamentJoins: getEventCount('tournament_join'),
        });
    }, []);

    if (!metrics) return null;

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">← Back</button>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><BarChart3 size={24} /> Analytics</h2>
                <div />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <MetricCard icon={Target} label="Sessions" value={metrics.totalSessions} subtext="Total game sessions" color="purple" />
                <MetricCard icon={TrendingUp} label="Avg Score" value={metrics.avgScore.toFixed(1)} subtext="Across all sessions" color="green" />
                <MetricCard icon={Share2} label="Share Rate" value={`${(metrics.shareRate * 100).toFixed(0)}%`} subtext="Sessions with a share" color="blue" />
                <MetricCard icon={Calendar} label="Daily Challenges" value={metrics.dailyChallengesCompleted} subtext="Challenges completed" color="amber" />
            </div>

            {/* Retention */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3">Retention</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-white/60 text-xs uppercase">D1 Retention</div>
                        <div className={`text-xl font-bold ${metrics.d1Retention ? 'text-emerald-400' : 'text-white/30'}`}>
                            {metrics.d1Retention ? 'Returned' : 'Not yet'}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/60 text-xs uppercase">D7 Retention</div>
                        <div className={`text-xl font-bold ${metrics.d7Retention ? 'text-emerald-400' : 'text-white/30'}`}>
                            {metrics.d7Retention ? 'Returned' : 'Not yet'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Viral Metrics */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3">Viral Loop</h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Shares</span>
                        <span className="text-white font-bold">{eventCounts.shares || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Challenges Sent</span>
                        <span className="text-white font-bold">{metrics.challengesSent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">K-Factor (shares/session)</span>
                        <span className="text-white font-bold">{metrics.totalSessions > 0 ? ((eventCounts.shares || 0) / metrics.totalSessions).toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </div>

            {/* Event Counts */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3">Activity</h3>
                <div className="space-y-2">
                    {Object.entries(eventCounts).map(([key, count]) => (
                        <div key={key} className="flex justify-between items-center">
                            <span className="text-white/60 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-white font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Highlight Stats */}
            {highlightStats && (
                <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-white font-bold mb-3">Highlights</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-white/60 text-xs uppercase">Total Highlights</div>
                            <div className="text-xl font-bold text-white">{highlightStats.total}</div>
                        </div>
                        <div>
                            <div className="text-white/60 text-xs uppercase">This Week</div>
                            <div className="text-xl font-bold text-white">{highlightStats.thisWeek}</div>
                        </div>
                        <div>
                            <div className="text-white/60 text-xs uppercase">Best Score</div>
                            <div className="text-xl font-bold text-amber-400">{highlightStats.bestScore}/10</div>
                        </div>
                        <div>
                            <div className="text-white/60 text-xs uppercase">Avg Score</div>
                            <div className="text-xl font-bold text-white">{highlightStats.avgScore}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

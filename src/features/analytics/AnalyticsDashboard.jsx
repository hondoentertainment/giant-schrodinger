import React, { useState, useEffect, useCallback } from 'react';
import { getSessionMetrics, getEventCount, getEvents, getAllEvents, getSessionDuration, exportAnalyticsData } from '../../services/analytics';
import { getHighlightStats } from '../../services/highlights';
import { BarChart3, TrendingUp, Share2, Target, Calendar, Users, Clock, Download, CheckCircle, Activity, Filter } from 'lucide-react';

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

function formatTimestamp(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
}

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min < 60) return `${min}m ${sec}s`;
    const hr = Math.floor(min / 60);
    const remainMin = min % 60;
    return `${hr}h ${remainMin}m`;
}

const EVENT_LABELS = {
    game_start: 'Game Started',
    round_complete: 'Round Completed',
    session_complete: 'Session Completed',
    share_click: 'Shared Result',
    challenge_sent: 'Challenge Sent',
    challenge_accepted: 'Challenge Accepted',
    daily_complete: 'Daily Completed',
    ai_battle_complete: 'AI Battle Done',
    tournament_join: 'Tournament Joined',
    tournament_create: 'Tournament Created',
    achievement_unlocked: 'Achievement Unlocked',
    pack_selected: 'Pack Selected',
    theme_changed: 'Theme Changed',
    notifications_enabled: 'Notifications Enabled',
    notifications_dismissed: 'Notifications Dismissed',
    settings_changed: 'Settings Changed',
    error_occurred: 'Error Occurred',
    error_boundary_caught: 'Error Boundary Caught',
    referral_click: 'Referral Click',
    chain_create: 'Chain Created',
    nav_tournament: 'Nav: Tournament',
    nav_async_chains: 'Nav: Async Chains',
    nav_analytics: 'Nav: Analytics',
};

function EventTimeline({ events }) {
    const recent = events.slice(-30).reverse();
    if (recent.length === 0) {
        return <div className="text-white/30 text-sm text-center py-4">No events recorded yet</div>;
    }
    return (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {recent.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                            {EVENT_LABELS[e.event] || e.event}
                        </div>
                        {e.properties && Object.keys(e.properties).length > 0 && (
                            <div className="text-white/30 text-xs truncate">
                                {Object.entries(e.properties).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </div>
                        )}
                    </div>
                    <div className="text-white/30 text-xs shrink-0">{formatTimestamp(e.timestamp)}</div>
                </div>
            ))}
        </div>
    );
}

function FunnelVisualization({ events }) {
    const stages = [
        { key: 'game_start', label: 'Game Start', color: 'bg-purple-500' },
        { key: 'round_complete', label: 'Round Complete', color: 'bg-blue-500' },
        { key: 'share_click', label: 'Share', color: 'bg-emerald-500' },
    ];

    const counts = {};
    for (const s of stages) {
        counts[s.key] = events.filter(e => e.event === s.key).length;
    }

    const maxCount = Math.max(1, ...Object.values(counts));

    return (
        <div className="space-y-3">
            {stages.map((stage, i) => {
                const count = counts[stage.key] || 0;
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const conversionFromPrev = i > 0 && counts[stages[i - 1].key] > 0
                    ? ((count / counts[stages[i - 1].key]) * 100).toFixed(0)
                    : null;

                return (
                    <div key={stage.key}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-white/70 text-sm">{stage.label}</span>
                            <div className="flex items-center gap-2">
                                {conversionFromPrev !== null && (
                                    <span className="text-white/30 text-xs">{conversionFromPrev}% conv.</span>
                                )}
                                <span className="text-white font-bold text-sm">{count}</span>
                            </div>
                        </div>
                        <div className="w-full h-6 bg-white/5 rounded-lg overflow-hidden">
                            <div
                                className={`h-full ${stage.color} rounded-lg transition-all duration-700`}
                                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                            />
                        </div>
                        {i < stages.length - 1 && (
                            <div className="flex justify-center my-1">
                                <div className="text-white/20 text-lg">|</div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function PopularModes({ events }) {
    const modeEvents = {
        'Solo': events.filter(e => e.event === 'game_start').length,
        'AI Battle': events.filter(e => e.event === 'ai_battle_complete').length,
        'Tournament': events.filter(e => e.event === 'tournament_join').length,
        'Daily Challenge': events.filter(e => e.event === 'daily_complete').length,
        'Async Chains': events.filter(e => e.event === 'chain_create').length,
        'Challenge': events.filter(e => e.event === 'challenge_sent').length,
    };

    const sorted = Object.entries(modeEvents)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    if (sorted.length === 0) {
        return <div className="text-white/30 text-sm text-center py-4">No game mode data yet</div>;
    }

    const modeColors = [
        'bg-purple-500', 'bg-blue-500', 'bg-emerald-500',
        'bg-amber-500', 'bg-pink-500', 'bg-cyan-500',
    ];

    return (
        <div className="space-y-3">
            {sorted.map(([mode, count], i) => (
                <div key={mode}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white/70 text-sm">{mode}</span>
                        <span className="text-white font-bold text-sm">{count}</span>
                    </div>
                    <div className="w-full h-4 bg-white/5 rounded-lg overflow-hidden">
                        <div
                            className={`h-full ${modeColors[i % modeColors.length]} rounded-lg transition-all duration-700`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AnalyticsDashboard({ onBack }) {
    const [metrics, setMetrics] = useState(null);
    const [highlightStats, setHighlightStats] = useState(null);
    const [eventCounts, setEventCounts] = useState({});
    const [allEvents, setAllEvents] = useState([]);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [exportStatus, setExportStatus] = useState(null); // null | 'copied' | 'error'

    useEffect(() => {
        setMetrics(getSessionMetrics());
        setHighlightStats(getHighlightStats());
        setAllEvents(getAllEvents());
        setSessionDuration(getSessionDuration());
        setEventCounts({
            gameStarts: getEventCount('game_start'),
            roundsCompleted: getEventCount('round_complete'),
            shares: getEventCount('share_click'),
            challenges: getEventCount('challenge_sent'),
            dailies: getEventCount('daily_complete'),
            aiBattles: getEventCount('ai_battle_complete'),
            tournamentJoins: getEventCount('tournament_join'),
            achievementsUnlocked: getEventCount('achievement_unlocked'),
            errors: getEventCount('error_occurred'),
            settingsChanges: getEventCount('settings_changed'),
            themeChanges: getEventCount('theme_changed'),
        });
    }, []);

    // Refresh session duration periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setSessionDuration(getSessionDuration());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = useCallback(async () => {
        try {
            const data = exportAnalyticsData();
            const json = JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(json);
            setExportStatus('copied');
            setTimeout(() => setExportStatus(null), 2500);
        } catch {
            // Fallback: try creating a text area
            try {
                const data = exportAnalyticsData();
                const json = JSON.stringify(data, null, 2);
                const textarea = document.createElement('textarea');
                textarea.value = json;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                setExportStatus('copied');
                setTimeout(() => setExportStatus(null), 2500);
            } catch {
                setExportStatus('error');
                setTimeout(() => setExportStatus(null), 2500);
            }
        }
    }, []);

    if (!metrics) return null;

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">&larr; Back</button>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><BarChart3 size={24} /> Analytics</h2>
                <button
                    onClick={handleExport}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all ${
                        exportStatus === 'copied'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : exportStatus === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20 border border-white/10'
                    }`}
                    title="Export all analytics data as JSON to clipboard"
                >
                    {exportStatus === 'copied' ? (
                        <><CheckCircle size={14} /> Copied</>
                    ) : exportStatus === 'error' ? (
                        <><Download size={14} /> Failed</>
                    ) : (
                        <><Download size={14} /> Export</>
                    )}
                </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <MetricCard icon={Target} label="Sessions" value={metrics.totalSessions} subtext="Total game sessions" color="purple" />
                <MetricCard icon={TrendingUp} label="Avg Score" value={metrics.avgScore.toFixed(1)} subtext="Across all sessions" color="green" />
                <MetricCard icon={Share2} label="Share Rate" value={`${(metrics.shareRate * 100).toFixed(0)}%`} subtext="Sessions with a share" color="blue" />
                <MetricCard icon={Clock} label="Session Time" value={formatDuration(sessionDuration)} subtext="Current session" color="amber" />
            </div>

            {/* Funnel Visualization */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Filter size={16} className="text-purple-400" />
                    Conversion Funnel
                </h3>
                <FunnelVisualization events={allEvents} />
            </div>

            {/* Popular Game Modes */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    Popular Game Modes
                </h3>
                <PopularModes events={allEvents} />
            </div>

            {/* Event Timeline */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" />
                    Recent Events
                    <span className="text-white/30 text-xs font-normal ml-auto">{allEvents.length} total</span>
                </h3>
                <EventTimeline events={allEvents} />
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
                <h3 className="text-white font-bold mb-3">Activity Breakdown</h3>
                <div className="space-y-2">
                    {Object.entries(eventCounts).map(([key, count]) => (
                        <div key={key} className="flex justify-between items-center">
                            <span className="text-white/60 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-white font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Duration */}
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    Session Duration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-white/60 text-xs uppercase">Current Session</div>
                        <div className="text-xl font-bold text-white">{formatDuration(sessionDuration)}</div>
                    </div>
                    <div>
                        <div className="text-white/60 text-xs uppercase">Daily Challenges</div>
                        <div className="text-xl font-bold text-white">{metrics.dailyChallengesCompleted}</div>
                    </div>
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

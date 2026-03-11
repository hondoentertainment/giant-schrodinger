import React, { useState, useEffect } from 'react';
import { getErrors, getErrorStats, clearErrors, reportBug, ErrorCategory } from '../services/errorMonitoring';
import { AlertTriangle, Trash2, Copy, Check, ChevronDown, ChevronUp, Bug } from 'lucide-react';

const CATEGORY_LABELS = {
    [ErrorCategory.SCORING]: 'AI Scoring',
    [ErrorCategory.NETWORK]: 'Network',
    [ErrorCategory.MULTIPLAYER]: 'Multiplayer',
    [ErrorCategory.SHARE]: 'Share',
    [ErrorCategory.RENDER]: 'Render',
    [ErrorCategory.UNHANDLED]: 'Unhandled',
    [ErrorCategory.UNKNOWN]: 'Unknown',
};

const CATEGORY_COLORS = {
    [ErrorCategory.SCORING]: 'bg-amber-500/20 text-amber-300',
    [ErrorCategory.NETWORK]: 'bg-red-500/20 text-red-300',
    [ErrorCategory.MULTIPLAYER]: 'bg-blue-500/20 text-blue-300',
    [ErrorCategory.SHARE]: 'bg-purple-500/20 text-purple-300',
    [ErrorCategory.RENDER]: 'bg-pink-500/20 text-pink-300',
    [ErrorCategory.UNHANDLED]: 'bg-orange-500/20 text-orange-300',
    [ErrorCategory.UNKNOWN]: 'bg-gray-500/20 text-gray-300',
};

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function StatBadge({ label, value, color = 'purple' }) {
    const colorMap = {
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/20',
        red: 'from-red-500/20 to-red-600/20 border-red-500/20',
        amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/20',
        green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/20',
    };
    return (
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.purple} border text-center`}>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-white/50 text-xs mt-0.5">{label}</div>
        </div>
    );
}

export function ErrorReport({ onBack }) {
    const [errors, setErrors] = useState([]);
    const [stats, setStats] = useState(null);
    const [copied, setCopied] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState(null);

    const refresh = () => {
        setErrors(getErrors().reverse());
        setStats(getErrorStats());
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleCopyReport = async () => {
        try {
            const report = reportBug();
            await navigator.clipboard.writeText(report);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for environments without clipboard API
            const report = reportBug();
            const textarea = document.createElement('textarea');
            textarea.value = report;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClear = () => {
        clearErrors();
        refresh();
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">&larr; Back</button>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Bug size={24} /> Error Log
                </h2>
                <div />
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <StatBadge label="Total" value={stats.total} color={stats.total > 0 ? 'red' : 'green'} />
                    <StatBadge label="Last 24h" value={stats.last24h} color={stats.last24h > 0 ? 'amber' : 'green'} />
                    <StatBadge label="Last 7d" value={stats.last7d} color="purple" />
                </div>
            )}

            {/* Category breakdown */}
            {stats && Object.keys(stats.byCategory).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                        <span
                            key={cat}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat] || CATEGORY_COLORS[ErrorCategory.UNKNOWN]}`}
                        >
                            {CATEGORY_LABELS[cat] || cat}: {count}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={handleCopyReport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Bug Report'}
                </button>
                {errors.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-300 font-semibold rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                    >
                        <Trash2 size={16} /> Clear
                    </button>
                )}
            </div>

            {/* Error list */}
            {errors.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3" role="img" aria-hidden="true">
                        <Check size={48} className="mx-auto text-emerald-400" />
                    </div>
                    <p className="text-white/60 text-sm">No errors logged. Everything is running smoothly.</p>
                </div>
            ) : (
                <div className="space-y-2 mb-8">
                    {errors.slice(0, 20).map((err, idx) => {
                        const isExpanded = expandedIdx === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-white text-sm truncate">{err.message || 'Unknown error'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-white/30 text-xs">{timeAgo(err.timestamp)}</span>
                                        {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 ml-5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[err.category] || CATEGORY_COLORS[ErrorCategory.UNKNOWN]}`}>
                                        {CATEGORY_LABELS[err.category] || err.category || 'Unknown'}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className="mt-3 ml-5 space-y-1.5 text-xs text-white/50">
                                        {err.context && <p><span className="text-white/30">Context:</span> {err.context}</p>}
                                        {err.url && <p><span className="text-white/30">URL:</span> {err.url}</p>}
                                        {err.stack && (
                                            <pre className="mt-1 p-2 bg-black/30 rounded-lg text-white/40 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap">
                                                {err.stack}
                                            </pre>
                                        )}
                                        {err.componentStack && (
                                            <pre className="mt-1 p-2 bg-black/30 rounded-lg text-white/40 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap">
                                                {err.componentStack}
                                            </pre>
                                        )}
                                        <p className="text-white/20">{new Date(err.timestamp).toLocaleString()}</p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                    {errors.length > 20 && (
                        <p className="text-center text-white/30 text-xs py-2">
                            Showing 20 of {errors.length} errors. Copy bug report for full details.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

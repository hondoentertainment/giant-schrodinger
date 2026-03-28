import React, { useState, useEffect } from 'react';
import { getFlags, removeFlag } from '../../services/moderation';

export function ModerationDashboard({ onBack }) {
    const [flags, setFlags] = useState([]);

    useEffect(() => {
        setFlags(getFlags());
    }, []);

    const totalFlags = flags.length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const flaggedToday = flags.filter(f => f.flaggedAt >= todayStart.getTime()).length;

    // Group flags by contentId
    const grouped = {};
    flags.forEach(f => {
        if (!grouped[f.contentId]) {
            grouped[f.contentId] = { contentId: f.contentId, reasons: [], count: 0, latestAt: 0 };
        }
        grouped[f.contentId].reasons.push(f.reason);
        grouped[f.contentId].count += 1;
        if (f.flaggedAt > grouped[f.contentId].latestAt) {
            grouped[f.contentId].latestAt = f.flaggedAt;
        }
    });
    const items = Object.values(grouped).sort((a, b) => b.latestAt - a.latestAt);

    const handleApprove = (contentId) => {
        removeFlag(contentId);
        setFlags(getFlags());
    };

    const handleRemove = (contentId) => {
        removeFlag(contentId);
        setFlags(getFlags());
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">{'\u2190'} Back</button>
                <h2 className="text-2xl font-display font-bold text-white">Content Moderation</h2>
                <div />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/20">
                    <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Total Flags</div>
                    <div className="text-2xl font-bold text-white">{totalFlags}</div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/20">
                    <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Flagged Today</div>
                    <div className="text-2xl font-bold text-white">{flaggedToday}</div>
                </div>
            </div>

            {/* Flagged Items */}
            {items.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl">
                    <p className="text-white/40 text-lg">No flagged content. All clear!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.contentId} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-bold text-sm truncate">
                                        Submission: {item.contentId}
                                    </div>
                                    <div className="text-white/50 text-xs mt-1">
                                        Reason: {[...new Set(item.reasons)].join(', ')}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-red-400 text-xs font-bold">
                                            {item.count} flag{item.count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-white/30 text-xs">
                                            {new Date(item.latestAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(item.contentId)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRemove(item.contentId)}
                                        className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-bold transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

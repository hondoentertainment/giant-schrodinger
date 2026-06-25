import React, { useState, useEffect } from 'react';
import { getFlags, removeFlag } from '../../services/moderation';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';
import { Shield } from 'lucide-react';

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
        <GameScreenShell onBack={onBack} title="Content Moderation" icon={Shield} backLabel="Back to lobby">
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="game-stat-tile border-red-500/20">
                    <div className="game-section-label">Total Flags</div>
                    <div className="text-2xl font-bold text-white mt-1 tabular-nums">{totalFlags}</div>
                </div>
                <div className="game-stat-tile border-amber-500/20">
                    <div className="game-section-label">Flagged Today</div>
                    <div className="text-2xl font-bold text-white mt-1 tabular-nums">{flaggedToday}</div>
                </div>
            </div>

            {items.length === 0 ? (
                <EmptyState icon="✅" title="All clear" description="No flagged content right now." />
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.contentId} className="game-list-row flex-col items-stretch !py-4">
                            <div className="flex items-start justify-between gap-3 w-full">
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
                                        type="button"
                                        onClick={() => handleApprove(item.contentId)}
                                        className="wordle-button text-xs text-emerald-300 border border-emerald-500/30 min-h-[36px] px-3"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(item.contentId)}
                                        className="wordle-button text-xs text-red-300 border border-red-500/30 min-h-[36px] px-3"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GameScreenShell>
    );
}

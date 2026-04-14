import React from 'react';
import { getTimeUntilNextWeek, formatWeeklyCountdown } from '../../../services/weeklyEvents';

export function WeeklyEventBanner({ show, weeklyEvent }) {
    if (!show || !weeklyEvent) return null;
    return (
        <div className="w-full max-w-md mb-4 p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
            <div className="flex items-center justify-between mb-1">
                <span className="text-purple-300 text-xs uppercase tracking-wider font-bold">This Week&apos;s Event</span>
                <span className="text-white/40 text-xs">Ends in {formatWeeklyCountdown(getTimeUntilNextWeek())}</span>
            </div>
            <div className="text-white font-bold text-lg">{weeklyEvent.name}</div>
            <div className="text-white/60 text-sm">{weeklyEvent.description}</div>
        </div>
    );
}

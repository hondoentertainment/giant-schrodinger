import React from 'react';
import { MilestoneTimeline } from '../../profile/MilestoneTimeline';

export function JourneyCollapsible({ show, showJourney, setShowJourney }) {
    if (!show) return null;
    return (
        <div className="mt-4">
            <button
                onClick={() => setShowJourney(!showJourney)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/60"
                aria-expanded={showJourney}
            >
                <span className="font-semibold">Your Journey</span>
                <span className="text-xs">{showJourney ? '\u25B2' : '\u25BC'}</span>
            </button>
            {showJourney && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <MilestoneTimeline />
                </div>
            )}
        </div>
    );
}

import React from 'react';

export function ScoreBreakdownGrid({ breakdown }) {
    if (!breakdown) return null;
    return (
        <>
            <p className="text-white/50 text-xs mb-2">Your connection was scored on:</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-white/70">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Wit: <span className="text-white">{breakdown.wit}/10</span></div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Logic: <span className="text-white">{breakdown.logic}/10</span></div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Originality: <span className="text-white">{breakdown.originality}/10</span></div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">Clarity: <span className="text-white">{breakdown.clarity}/10</span></div>
            </div>
        </>
    );
}

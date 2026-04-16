import React from 'react';

export function ScoringErrorBanner({ scoringError, retrying, onRetry }) {
    if (!scoringError) return null;
    return (
        <div className="w-full max-w-md p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <div className="text-red-300 font-semibold mb-1">{scoringError.message}</div>
            <div className="text-white/40 text-xs mb-3">Error ID: {scoringError.errorId}</div>
            <button
                onClick={onRetry}
                disabled={retrying}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition"
            >
                {retrying ? 'Retrying...' : 'Retry Scoring'}
            </button>
        </div>
    );
}

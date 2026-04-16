import React from 'react';

export function ProcessErrorView({ processError, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-4" role="img" aria-hidden="true">⚠️</div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-white/60 text-sm mb-6 max-w-sm">{processError}</p>
            <button
                onClick={onRetry}
                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
            >
                Try Again
            </button>
        </div>
    );
}

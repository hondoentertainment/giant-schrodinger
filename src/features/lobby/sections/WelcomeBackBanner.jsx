import React from 'react';

export function WelcomeBackBanner({ welcomeMsg, setWelcomeMsg }) {
    if (!welcomeMsg) return null;
    return (
        <div className="w-full max-w-md mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-emerald-300 text-sm">{welcomeMsg}</span>
            <button onClick={() => setWelcomeMsg(null)} className="text-white/40 hover:text-white ml-2">&times;</button>
        </div>
    );
}

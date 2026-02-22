import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';

export function ServiceStatus() {
    const [status, setStatus] = useState({
        firebase: 'checking',
        gemini: 'checking'
    });

    useEffect(() => {
        // Check Firebase
        if (db) {
            setStatus(s => ({ ...s, firebase: 'online' }));
        } else {
            setStatus(s => ({ ...s, firebase: 'offline' }));
        }

        // Check Gemini (simulated check for API key)
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (geminiKey && geminiKey.length > 10) {
            setStatus(s => ({ ...s, gemini: 'online' }));
        } else {
            setStatus(s => ({ ...s, gemini: 'offline' }));
        }
    }, []);

    const getColor = (s) => {
        if (s === 'online') return 'bg-emerald-500';
        if (s === 'offline') return 'bg-red-500';
        return 'bg-amber-500';
    };

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                <div className={`w-2 h-2 rounded-full ${getColor(status.firebase)} animate-pulse`} />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Cloud Sync</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                <div className={`w-2 h-2 rounded-full ${getColor(status.gemini)} animate-pulse`} />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">AI Intelligence</span>
            </div>
        </div>
    );
}

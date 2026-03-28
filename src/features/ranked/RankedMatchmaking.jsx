import React, { useState, useEffect, useRef } from 'react';
import { joinMatchmakingQueue, findMatch, leaveQueue } from '../../services/matchmaking';
import { getPlayerRating } from '../../services/ranked';

const RATING_RANGE = 150;
const QUEUE_TIMEOUT = 30000;

export function RankedMatchmaking({ onMatchFound, onCancel }) {
    const [searching, setSearching] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [dots, setDots] = useState('');
    const entryRef = useRef(null);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const dotsRef = useRef(null);

    const playerInfo = getPlayerRating();
    const rating = playerInfo.rating;
    const minRange = Math.max(0, rating - RATING_RANGE);
    const maxRange = rating + RATING_RANGE;

    const startSearch = () => {
        setSearching(true);
        setTimedOut(false);

        const entry = joinMatchmakingQueue(playerInfo.tierName || 'Player', rating);
        entryRef.current = entry;

        // Poll for match every 2 seconds
        intervalRef.current = setInterval(() => {
            const match = findMatch(rating);
            if (match && match.id !== entry.id) {
                cleanup();
                setSearching(false);
                if (onMatchFound) onMatchFound(match);
            }
        }, 2000);

        // Auto-timeout
        timeoutRef.current = setTimeout(() => {
            cleanup();
            setSearching(false);
            setTimedOut(true);
        }, QUEUE_TIMEOUT);

        // Animated dots
        dotsRef.current = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
    };

    const cleanup = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (dotsRef.current) clearInterval(dotsRef.current);
        if (entryRef.current) leaveQueue(entryRef.current.id);
        intervalRef.current = null;
        timeoutRef.current = null;
        dotsRef.current = null;
        entryRef.current = null;
    };

    const handleCancel = () => {
        cleanup();
        setSearching(false);
        setTimedOut(false);
        if (onCancel) onCancel();
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    return (
        <div className="w-full max-w-md mx-auto text-center">
            {!searching && !timedOut && (
                <button
                    onClick={startSearch}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                    Find Match
                </button>
            )}

            {searching && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-6 rounded-2xl bg-white/5 border border-purple-500/30">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <p className="text-white font-bold text-lg">
                            Searching for opponent{dots}
                        </p>
                        <p className="text-white/50 text-sm mt-2">
                            Looking for players rated {minRange}-{maxRange}
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {timedOut && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-white/70 text-lg mb-2">No match found.</p>
                        <p className="text-white/40 text-sm">Try again?</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={startSearch}
                            className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

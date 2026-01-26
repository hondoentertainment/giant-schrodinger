import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

export function AnimatedScore({ value, max, color, label, delay = 0 }) {
    const animatedValue = useCountUp(value, 800 + delay);

    return (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className={`text-2xl font-black ${color}`}>
                {animatedValue}/{max}
            </div>
            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">{label}</div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${color.replace('text-', 'bg-')}`}
                    style={{ width: `${(animatedValue / max) * 100}%` }}
                />
            </div>
        </div>
    );
}

export function AnimatedTotalScore({ value, delay = 0 }) {
    const animatedValue = useCountUp(value, 1000 + delay);

    return (
        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 text-center">
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                {animatedValue}/10
            </div>
            <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Total</div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(animatedValue / 10) * 100}%` }}
                />
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { haptic } from '../lib/haptics';

export function ScoreReveal({ score, max = 10, label, className = '' }) {
    const target = Math.round(Number(score) || 0);
    const [display, setDisplay] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (target <= 0) {
            setDisplay(0);
            return undefined;
        }

        const prefersReduced = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setDisplay(target);
            setDone(true);
            haptic('success');
            return undefined;
        }

        let frame = 0;
        const steps = Math.min(target, 12);
        const interval = setInterval(() => {
            frame += 1;
            const next = Math.min(target, Math.round((frame / steps) * target));
            setDisplay(next);
            if (next >= target) {
                clearInterval(interval);
                setDone(true);
                haptic('success');
            }
        }, 55);

        return () => clearInterval(interval);
    }, [target]);

    return (
        <div className={`score-reveal ${done ? 'score-reveal--done' : ''} ${className}`.trim()}>
            <div className="text-4xl font-bold tabular-nums text-white">
                {display}/{max}
            </div>
            {label && (
                <div className="text-white/55 text-xs font-semibold mt-1 uppercase tracking-wide">
                    {label}
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const EXAMPLES = [
    {
        left: 'COFFEE',
        right: 'ROBOT',
        good: 'My morning fuel before I boot up.',
        bad: 'They are both things.',
        goodScore: '9/10',
        badScore: '3/10',
    },
    {
        left: 'OCEAN',
        right: 'LIBRARY',
        good: 'Endless depth you could get lost in for hours.',
        bad: 'Both are big places.',
        goodScore: '8/10',
        badScore: '2/10',
    },
];

export function OnboardingModal({ onDismiss }) {
    const containerRef = useRef(null);
    useFocusTrap(true, containerRef);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onDismiss]);

    const ex = EXAMPLES[0];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-modal-title"
        >
            <div ref={containerRef} className="w-full max-w-lg glass-panel rounded-3xl p-8 animate-in zoom-in-95 duration-300 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 id="onboarding-modal-title" className="text-2xl font-display font-bold text-white mb-4 text-center">
                    How Venn Works
                </h2>
                <p className="text-white/80 mb-6 text-center">
                    You&apos;ll see two concepts. Write <span className="text-white font-semibold">one witty phrase</span> that connects them both.
                </p>

                {/* Good example */}
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-400 font-bold text-sm">GREAT CONNECTION</span>
                        <span className="text-emerald-400 font-bold">{ex.goodScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm font-semibold">{ex.left}</span>
                        <span className="text-white/40">+</span>
                        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 text-sm font-semibold">{ex.right}</span>
                    </div>
                    <p className="text-white/90 italic">&ldquo;{ex.good}&rdquo;</p>
                    <p className="text-emerald-400/60 text-xs mt-1">Witty, logical, and original</p>
                </div>

                {/* Bad example */}
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-400 font-bold text-sm">WEAK CONNECTION</span>
                        <span className="text-red-400 font-bold">{ex.badScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm font-semibold">{ex.left}</span>
                        <span className="text-white/40">+</span>
                        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 text-sm font-semibold">{ex.right}</span>
                    </div>
                    <p className="text-white/90 italic">&ldquo;{ex.bad}&rdquo;</p>
                    <p className="text-red-400/60 text-xs mt-1">Too generic, no wit or surprise</p>
                </div>

                <p className="text-white/60 text-sm mb-4 text-center">
                    Scored on <span className="text-white">Wit</span>, <span className="text-white">Logic</span>, <span className="text-white">Originality</span>, and <span className="text-white">Clarity</span>.
                </p>

                <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-6 text-center">
                    <p className="text-amber-400 text-sm font-semibold">Play daily to build a streak!</p>
                    <p className="text-white/40 text-xs">Streaks unlock bonus scoring multipliers and exclusive rewards.</p>
                </div>

                <button
                    onClick={onDismiss}
                    className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                    Got it, let&apos;s play!
                </button>
            </div>
        </div>
    );
}

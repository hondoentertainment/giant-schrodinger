import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const EXAMPLES = [
    {
        left: 'Coffee',
        right: 'Robot',
        good: 'My morning fuel before I boot up.',
        bad: 'They are both things.',
        goodScore: '9/10',
        badScore: '3/10',
    },
    {
        left: 'Ocean',
        right: 'Library',
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
            className="game-modal-overlay animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-modal-title"
        >
            <div ref={containerRef} className="game-modal-panel p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <h2 id="onboarding-modal-title" className="text-2xl font-display font-bold tracking-tight text-white mb-3 text-center">
                    How Venn Works
                </h2>
                <p className="text-white/70 mb-6 text-center text-[15px] leading-relaxed">
                    You&apos;ll see two concepts. Write <span className="text-white font-semibold">one witty phrase</span> that connects them both.
                </p>

                <div className="game-example-good">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-300 font-semibold text-sm">Great connection</span>
                        <span className="ml-auto text-emerald-300 font-bold tabular-nums">{ex.goodScore}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="game-concept-chip">{ex.left}</span>
                        <span className="text-white/35">+</span>
                        <span className="game-concept-chip game-concept-chip--alt">{ex.right}</span>
                    </div>
                    <p className="text-white/90 italic">&ldquo;{ex.good}&rdquo;</p>
                    <p className="text-emerald-300/60 text-xs mt-2">Witty, logical, and original</p>
                </div>

                <div className="game-example-bad">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-300 font-semibold text-sm">Weak connection</span>
                        <span className="ml-auto text-red-300 font-bold tabular-nums">{ex.badScore}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="game-concept-chip">{ex.left}</span>
                        <span className="text-white/35">+</span>
                        <span className="game-concept-chip game-concept-chip--alt">{ex.right}</span>
                    </div>
                    <p className="text-white/90 italic">&ldquo;{ex.bad}&rdquo;</p>
                    <p className="text-red-300/60 text-xs mt-2">Too generic, no wit or surprise</p>
                </div>

                <p className="text-white/55 text-sm mb-4 text-center">
                    Every score weighs <span className="text-white">Wit</span>, <span className="text-white">Logic</span>, <span className="text-white">Originality</span>, and <span className="text-white">Clarity</span> — clever, coherent, fresh, and clear.
                </p>

                <div className="rounded-[22px] bg-white/[0.05] border border-white/[0.08] p-4 mb-3">
                    <p className="text-white text-sm font-semibold mb-2">Three solo judging paths (plus live rooms)</p>
                    <ul className="space-y-1.5 text-white/55 text-xs leading-relaxed">
                        <li><span className="text-white">AI Judge:</span> Gemini scores automatically when configured; mock scoring keeps solo playable without a key.</li>
                        <li><span className="text-white">Manual Judge:</span> you enter the score yourself after the reveal — not the same as Friend Judge.</li>
                        <li><span className="text-white">Friend Judge:</span> after any round, copy a link so someone else scores asynchronously.</li>
                        <li><span className="text-white">Multiplayer:</span> live rooms vote together when set to Manual; AI rooms score on the server.</li>
                    </ul>
                </div>

                <div className="rounded-[22px] bg-amber-500/10 border border-amber-400/20 p-3 mb-6 text-center">
                    <p className="text-amber-200 text-sm font-semibold">Play daily to build a streak</p>
                    <p className="text-white/45 text-xs mt-1">Streaks unlock bonus scoring multipliers and exclusive rewards.</p>
                </div>

                <button
                    onClick={onDismiss}
                    className="wordle-button wordle-primary w-full text-lg"
                >
                    Got it, let&apos;s play
                </button>
            </div>
        </div>
    );
}

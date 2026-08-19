import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const EXAMPLE = {
    left: 'Coffee',
    right: 'Robot',
    phrase: 'My morning fuel before I boot up.',
};

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

    return (
        <div
            className="game-modal-overlay animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-modal-title"
        >
            <div ref={containerRef} className="game-modal-panel p-6 sm:p-8">
                <h2 id="onboarding-modal-title" className="text-2xl font-display font-bold tracking-tight text-white mb-3 text-center">
                    How Venn Works
                </h2>
                <p className="text-white/70 mb-6 text-center text-[15px] leading-relaxed">
                    You&apos;ll see two concepts. Write <span className="text-white font-semibold">one witty phrase</span> that connects them both.
                </p>

                <div className="game-example-good mb-6">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        <span className="game-concept-chip">{EXAMPLE.left}</span>
                        <span className="text-white/35">+</span>
                        <span className="game-concept-chip game-concept-chip--alt">{EXAMPLE.right}</span>
                    </div>
                    <p className="text-white/90 italic text-center">&ldquo;{EXAMPLE.phrase}&rdquo;</p>
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

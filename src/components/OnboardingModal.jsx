import React from 'react';

const EXAMPLE = {
    left: 'COFFEE',
    right: 'ROBOT',
    connection: 'My morning fuel before I boot up.',
};

export function OnboardingModal({ onDismiss }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg glass-panel rounded-3xl p-8 animate-in zoom-in-95 duration-300 border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-display font-bold text-white mb-4 text-center">
                    How Venn Works
                </h2>
                <p className="text-white/80 mb-4 text-center">
                    You&apos;ll see two concepts. Write <span className="text-white font-semibold">one witty phrase</span> that connects them both.
                </p>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-6">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Example</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm font-semibold">{EXAMPLE.left}</span>
                        <span className="text-white/40">+</span>
                        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 text-sm font-semibold">{EXAMPLE.right}</span>
                    </div>
                    <p className="text-white/90 italic">&ldquo;{EXAMPLE.connection}&rdquo;</p>
                </div>
                <p className="text-white/60 text-sm mb-6">
                    You&apos;re scored on <span className="text-white">Wit</span> (cleverness), <span className="text-white">Logic</span> (how well it connects), <span className="text-white">Originality</span> (surprise factor), and <span className="text-white">Clarity</span> (how clear it is).
                </p>
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

import React, { useEffect, useState } from 'react';
import { canInstallPWA, installPWA } from '../lib/pwaInstall';
import { haptic } from '../lib/haptics';
import { getStats } from '../services/stats';

const MIN_ROUNDS_BEFORE_PROMPT = 1;

export function PWAInstallBanner({ className = '' }) {
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        const check = () => {
            const dismissed = localStorage.getItem('vwf_pwa_dismissed') === 'true';
            const hasPlayed = getStats().totalRounds >= MIN_ROUNDS_BEFORE_PROMPT;
            setVisible(canInstallPWA() && !dismissed && hasPlayed);
        };
        check();
        window.addEventListener('pwa-installable', check);
        window.addEventListener('storage', check);
        return () => {
            window.removeEventListener('pwa-installable', check);
            window.removeEventListener('storage', check);
        };
    }, []);

    if (!visible) return null;

    const handleInstall = async () => {
        setInstalling(true);
        haptic('medium');
        const ok = await installPWA();
        setInstalling(false);
        if (ok) {
            haptic('success');
            setVisible(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('vwf_pwa_dismissed', 'true');
        setVisible(false);
    };

    return (
        <div className={`rounded-[22px] border border-game-accent/25 bg-game-accent/10 p-4 text-left ${className}`.trim()}>
            <div className="flex items-start gap-3">
                <div className="game-logo-mark shrink-0 scale-90" aria-hidden="true">
                    <span className="text-lg">📲</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">Add Venn to your home screen</p>
                    <p className="text-white/50 text-xs mt-1">Launch like a native game — faster loads and full-screen play.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <button
                            type="button"
                            onClick={handleInstall}
                            disabled={installing}
                            className="wordle-button wordle-primary text-sm min-h-[44px] px-4 py-2"
                        >
                            {installing ? 'Installing…' : 'Install'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="wordle-button text-sm min-h-[44px] px-4 py-2 text-white/60"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

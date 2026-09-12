import React, { useEffect, useState } from 'react';
import {
    canInstallPWA,
    dismissPwaTip,
    homeScreenTipCopy,
    installPWA,
    shouldOfferHomeScreenTip,
} from '../lib/pwaInstall';
import { haptic } from '../lib/haptics';
import { getStats } from '../services/stats';

const MIN_ROUNDS_BEFORE_PROMPT = 1;

export function PWAInstallBanner({ className = '', forceRounds } = {}) {
    const [visible, setVisible] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [copy, setCopy] = useState(() => homeScreenTipCopy());

    useEffect(() => {
        const check = () => {
            const roundsPlayed = forceRounds ?? getStats().totalRounds;
            const offer = shouldOfferHomeScreenTip({
                roundsPlayed,
                minRounds: MIN_ROUNDS_BEFORE_PROMPT,
            });
            setVisible(offer);
            if (offer) setCopy(homeScreenTipCopy());
        };
        check();
        window.addEventListener('pwa-installable', check);
        window.addEventListener('storage', check);
        return () => {
            window.removeEventListener('pwa-installable', check);
            window.removeEventListener('storage', check);
        };
    }, [forceRounds]);

    if (!visible) return null;

    const handleInstall = async () => {
        if (!canInstallPWA()) return;
        setInstalling(true);
        haptic('medium');
        const ok = await installPWA();
        setInstalling(false);
        if (ok) {
            haptic('success');
            dismissPwaTip();
            setVisible(false);
        }
    };

    const handleDismiss = () => {
        dismissPwaTip();
        setVisible(false);
    };

    return (
        <div className={`rounded-[22px] border border-game-accent/25 bg-game-accent/10 p-4 text-left ${className}`.trim()}>
            <div className="flex items-start gap-3">
                <div className="game-logo-mark shrink-0 scale-90" aria-hidden="true">
                    <span className="text-lg">📲</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{copy.title}</p>
                    <p className="text-white/50 text-xs mt-1">{copy.body}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {copy.action && (
                            <button
                                type="button"
                                onClick={handleInstall}
                                disabled={installing}
                                className="wordle-button wordle-primary text-sm min-h-[44px] px-4 py-2"
                            >
                                {installing ? 'Installing…' : copy.action}
                            </button>
                        )}
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

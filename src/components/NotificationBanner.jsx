import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, subscribeToPush, isPushSupported } from '../services/pushNotifications';

const DISMISSED_KEY = 'venn_notification_banner_dismissed';
const ROUNDS_KEY = 'venn_rounds_played';
const PUSH_PREF_KEY = 'venn_push_enabled';

export function NotificationBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed, already opted in, or push not supported
        if (localStorage.getItem(DISMISSED_KEY)) return;
        if (localStorage.getItem(PUSH_PREF_KEY)) return;
        if (!isPushSupported()) return;

        const roundsPlayed = parseInt(localStorage.getItem(ROUNDS_KEY) || '0', 10);
        if (roundsPlayed >= 3) {
            setVisible(true);
        }
    }, []);

    const handleEnable = async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            try {
                await subscribeToPush();
            } catch {
                // Subscription may fail without a valid VAPID key; that's okay
            }
            localStorage.setItem(PUSH_PREF_KEY, 'true');
        }
        localStorage.setItem(DISMISSED_KEY, 'true');
        setVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, 'true');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="w-full mb-4 p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-in slide-in-from-top-4 duration-300">
            <p className="text-white/90 text-sm font-semibold mb-3">
                Enable notifications to never miss a daily challenge or lose your streak!
            </p>
            <div className="flex gap-3">
                <button
                    onClick={handleEnable}
                    className="flex-1 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:scale-[1.02] transition-transform"
                >
                    Enable
                </button>
                <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 bg-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors"
                >
                    Not now
                </button>
            </div>
        </div>
    );
}

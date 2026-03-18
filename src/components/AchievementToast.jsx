import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { BADGES } from '../services/achievements';
import { useSound } from '../hooks/useSound';

export function AchievementToast() {
    const { currentAchievement, clearCurrentAchievement } = useGame();
    const { playSuccess } = useSound();
    const [visible, setVisible] = useState(false);
    const [badge, setBadge] = useState(null);

    useEffect(() => {
        if (currentAchievement) {
            const b = BADGES[currentAchievement];
            if (b) {
                setBadge(b);
                setVisible(true);
                playSuccess();
                const timer = setTimeout(() => {
                    setVisible(false);
                    setTimeout(clearCurrentAchievement, 500);
                }, 4000);
                return () => clearTimeout(timer);
            } else {
                clearCurrentAchievement();
            }
        }
    }, [currentAchievement, clearCurrentAchievement, playSuccess]);

    if (!badge || (!visible && !currentAchievement)) return null;

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-50 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="bg-gradient-to-r from-purple-900/90 to-pink-900/90 border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_40px_rgba(168,85,247,0.5)] backdrop-blur-xl flex items-center gap-4 group hover:scale-105 transition-transform">
                <div className="text-4xl drop-shadow-xl animate-[bounce_1s_infinite]">{badge.emoji}</div>
                <div>
                    <div className="text-[10px] font-black tracking-widest text-purple-300 uppercase mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                        Achievement Unlocked!
                    </div>
                    <div className="text-xl font-bold text-white leading-tight drop-shadow-md">{badge.name}</div>
                    <div className="text-sm text-white/80 mt-1 italic">"{badge.description}"</div>
                </div>
            </div>
        </div>
    );
}

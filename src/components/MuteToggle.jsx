import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, playClick, toggleMute } from '../services/sounds';
import { haptic } from '../lib/haptics';

export function MuteToggle({ compact = false, className = '' }) {
    const [soundMuted, setSoundMuted] = useState(() => isMuted());

    const handleToggle = () => {
        const next = toggleMute();
        setSoundMuted(next);
        haptic('light');
        if (!next) playClick();
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-pressed={!soundMuted}
            aria-label={soundMuted ? 'Sound muted' : 'Sound on'}
            title={soundMuted ? 'Sound muted' : 'Sound on'}
            className={`${compact
                ? 'shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 min-w-[40px] min-h-[40px] flex items-center justify-center'
                : `game-choice min-h-[40px] px-4 text-xs font-semibold inline-flex items-center gap-1.5 ${!soundMuted ? 'game-choice-selected' : ''}`
            } ${className}`.trim()}
        >
            {soundMuted ? <VolumeX className={compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} /> : <Volume2 className={compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />}
            {!compact && <span>{soundMuted ? 'Muted' : 'On'}</span>}
        </button>
    );
}

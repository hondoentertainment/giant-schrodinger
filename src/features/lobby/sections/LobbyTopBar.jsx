import React from 'react';
import { Pencil, Volume2, VolumeX } from 'lucide-react';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { useTranslation } from '../../../hooks/useTranslation';
import { toggleMute } from '../../../services/sounds';

export function LobbyTopBar({
    login,
    soundMuted,
    setSoundMuted,
    colorblindMode,
    setColorblindMode,
}) {
    const { t } = useTranslation();
    return (
        <div className="flex justify-between items-center mb-4">
            <button
                onClick={() => login(null)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={t('lobby.editProfile')}
                title={t('lobby.editProfile')}
            >
                <Pencil className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
                <LanguageSelector />
                <button
                    onClick={() => { const m = toggleMute(); setSoundMuted(m); }}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
                    title={soundMuted ? 'Unmute' : 'Mute'}
                >
                    {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => {
                        const next = !colorblindMode;
                        setColorblindMode(next);
                        localStorage.setItem('venn_colorblind', String(next));
                    }}
                    className={`p-2.5 rounded-full ${colorblindMode ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-white'} hover:bg-white/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center`}
                    aria-label={colorblindMode ? 'Disable colorblind mode' : 'Enable colorblind mode'}
                    title={colorblindMode ? 'Colorblind mode on' : 'Colorblind mode off'}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

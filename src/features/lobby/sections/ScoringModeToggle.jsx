import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

export function ScoringModeToggle({ show, scoringMode, setScoringMode, user, login }) {
    const { t } = useTranslation();
    if (!show) return null;
    return (
        <div className="mb-4">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">{t('lobby.scoring')}</label>
            <div className="flex gap-2 justify-center">
                <button
                    type="button"
                    onClick={() => {
                        setScoringMode('human');
                        login({ ...user, scoringMode: 'human' });
                    }}
                    aria-pressed={scoringMode === 'human'}
                    aria-label={t('lobby.manualJudgeDesc')}
                    className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'human'
                        ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {t('lobby.manualJudge')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setScoringMode('ai');
                        login({ ...user, scoringMode: 'ai' });
                    }}
                    aria-pressed={scoringMode === 'ai'}
                    aria-label={t('lobby.aiJudgeDesc')}
                    className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'ai'
                        ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {t('lobby.aiJudge')}
                </button>
            </div>
            <p className="text-center text-white/40 text-xs mt-1">
                {scoringMode === 'human'
                    ? t('lobby.manualJudgeDesc')
                    : t('lobby.aiJudgeDesc')
                }
            </p>
        </div>
    );
}

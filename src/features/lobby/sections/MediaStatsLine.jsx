import React from 'react';
import { MEDIA_TYPES } from '../../../data/themes';
import { useTranslation } from '../../../hooks/useTranslation';

export function MediaStatsLine({ user, stats }) {
    const { t } = useTranslation();
    return (
        <div className="mb-4 flex flex-wrap gap-3 justify-center text-sm text-white/60">
            <span>Media: <span className="text-white font-semibold">
                {(user?.mediaType || MEDIA_TYPES.IMAGE) === 'mixed' ? t('lobby.mixed') || 'Mixed' :
                 (user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE ? t('lobby.images') :
                 (user?.mediaType) === MEDIA_TYPES.VIDEO ? t('lobby.videos') : t('lobby.audio')}
            </span></span>
            <span>{stats.totalRounds} {t('lobby.roundsPlayed').toLowerCase()}</span>
            {stats.maxStreak > 0 && <span>{t('lobby.bestStreak')}: <span className="text-amber-400 font-semibold">{stats.maxStreak}d</span></span>}
        </div>
    );
}

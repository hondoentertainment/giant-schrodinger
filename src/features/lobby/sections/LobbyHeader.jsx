import React from 'react';
import { getThemeById } from '../../../data/themes';
import { getPlayerRating, getSubRank } from '../../../services/ranked';
import { DivisionBadge } from '../../ranked/DivisionBadge';

export function LobbyHeader({ user }) {
    const playerInfo = getPlayerRating();
    const sub = getSubRank(playerInfo.rating);
    return (
        <>
            <div className="relative inline-block mb-3">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getThemeById(user?.themeId).gradient} flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/5`}>
                    {user.avatar}
                </div>
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-1">
                Hi, {user.name}!
            </h2>
            <div className="flex items-center justify-center gap-2 mb-1">
                <DivisionBadge tier={sub.name} size="sm" />
                <span className="text-white/40 text-xs">{sub.display} &middot; {playerInfo.rating} SR</span>
            </div>
        </>
    );
}

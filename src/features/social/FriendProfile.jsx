import React, { useMemo } from 'react';

/**
 * FriendProfile modal — displays a friend's profile with stats,
 * a challenge button, and a close button.
 *
 * Props:
 *   friend  — { name: string, addedAt: number }
 *   onClose — () => void
 *   onChallenge — (friend) => void
 */
export function FriendProfile({ friend, onClose, onChallenge }) {
    // Generate deterministic mock stats from the friend's name
    const stats = useMemo(() => {
        if (!friend?.name) return null;
        let seed = 0;
        for (let i = 0; i < friend.name.length; i++) {
            seed = ((seed << 5) - seed + friend.name.charCodeAt(i)) | 0;
        }
        const abs = Math.abs(seed);
        const themes = ['Classic', 'Neon', 'Nature', 'Space', 'Retro'];
        return {
            bestScore: 6 + (abs % 5),
            currentStreak: abs % 12,
            totalRounds: 5 + (abs % 96),
            favoriteTheme: themes[abs % themes.length],
        };
    }, [friend?.name]);

    if (!friend) return null;

    const memberSince = friend.addedAt
        ? new Date(friend.addedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    // Derive a deterministic avatar from the friend's name
    const avatars = ['\uD83D\uDC7D', '\uD83C\uDFA8', '\uD83E\uDDE0', '\uD83D\uDC7E', '\uD83E\uDD16', '\uD83D\uDD2E', '\uD83C\uDFAA', '\uD83C\uDFAD'];
    const avatarIndex = friend.name.length % avatars.length;
    const avatar = avatars[avatarIndex];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${friend.name}'s profile`}
        >
            {/* Backdrop */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
            />

            {/* Modal content */}
            <div
                className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-purple-900/90 to-purple-800/90 border border-purple-500/30 shadow-2xl p-6 animate-in zoom-in-95 duration-300"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors text-lg"
                    aria-label="Close profile"
                >
                    &times;
                </button>

                {/* Avatar & Name */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-lg ring-4 ring-purple-500/20 mb-3">
                        {avatar}
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">{friend.name}</h2>
                    <p className="text-purple-300/70 text-sm mt-1">Member since {memberSince}</p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                            <div className="text-xl font-black text-purple-300">{stats.bestScore}/10</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Best Score</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                            <div className="text-xl font-black text-amber-400">{stats.currentStreak}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Day Streak</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                            <div className="text-xl font-black text-white">{stats.totalRounds}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Total Rounds</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                            <div className="text-sm font-bold text-pink-300 truncate">{stats.favoriteTheme}</div>
                            <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Fav Theme</div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => onChallenge(friend)}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                    >
                        Challenge
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

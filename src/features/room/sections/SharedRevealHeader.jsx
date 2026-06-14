import React from 'react';

export function SpectatorBanner() {
    return (
        <div className="w-full py-2 px-4 bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-sm font-semibold text-center mb-4">
            Spectating -- watch and react!
        </div>
    );
}

export function LeaveRoomBar({ onLeave }) {
    return (
        <div className="w-full flex justify-start px-4 mb-4">
            <button
                onClick={onLeave}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-sm font-semibold"
            >
                Leave Room
            </button>
        </div>
    );
}

const REACTION_EMOJIS = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDD25', '\uD83E\uDD2F'];

export function ReactionBar({ entryId, reactions, addReaction, paddingClass = 'pl-10' }) {
    return (
        <div className={`flex gap-2 mt-2 ${paddingClass}`}>
            {REACTION_EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => addReaction(entryId, emoji)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                >
                    {emoji} {reactions.get(entryId)?.filter(r => r === emoji).length || ''}
                </button>
            ))}
        </div>
    );
}

import React from 'react';
import { ConnectionBanner } from '../ConnectionBanner';
import { LeaveRoomBar, SpectatorBanner, ReactionBar } from './SharedRevealHeader';

export function RevealPhase({
    room,
    submissions,
    players,
    revealedCount,
    isSpectator,
    reactions,
    addReaction,
    onLeave,
}) {
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-500">
            <ConnectionBanner />
            {isSpectator && <SpectatorBanner />}
            <LeaveRoomBar onLeave={onLeave} />
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-8">
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-4 border border-white/10">
                            ROUND {room?.round_number} ANSWERS
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white">
                            And the connections are...
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {submissions.slice(0, revealedCount).map((entry) => {
                            const player = players.find((p) => p.player_name === entry.player_name);
                            return (
                                <div
                                    key={entry.id}
                                    className="rounded-2xl border bg-white/5 border-white/10 p-5 animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{player?.avatar || '👽'}</span>
                                        <span className="text-white font-bold text-lg">{entry.player_name}</span>
                                    </div>
                                    <div className="mt-3 pl-10">
                                        <p className="text-white/80 italic text-xl">&ldquo;{entry.submission}&rdquo;</p>
                                    </div>
                                    {isSpectator && (
                                        <ReactionBar
                                            entryId={entry.id}
                                            reactions={reactions}
                                            addReaction={addReaction}
                                            paddingClass="pl-10"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {revealedCount < submissions.length && (
                        <div className="text-center mt-6 text-white/30 animate-pulse">
                            Revealing answers...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

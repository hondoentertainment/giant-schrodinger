import React from 'react';
import { ConnectionBanner } from '../ConnectionBanner';
import { LeaveRoomBar } from './SharedRevealHeader';

export function CountdownPhase({ room, countdownValue, onLeave }) {
    return (
        <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[50vh]">
            <ConnectionBanner />
            <LeaveRoomBar onLeave={onLeave} />
            <div className="text-center animate-in zoom-in-95 duration-500">
                <div className="text-white/40 text-lg uppercase tracking-widest mb-4">
                    Round {room?.round_number} Answers
                </div>
                <div
                    className="text-[120px] font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-amber-400 animate-pulse leading-none"
                    role="status"
                    aria-live="polite"
                    aria-label={countdownValue > 0 ? `Get ready, ${countdownValue}` : 'Here they are'}
                >
                    {countdownValue || '!'}
                </div>
                <div className="text-white/60 text-lg mt-4">
                    {countdownValue > 0 ? 'Get ready...' : 'Here they are!'}
                </div>
            </div>
        </div>
    );
}

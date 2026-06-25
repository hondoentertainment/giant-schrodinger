import React from 'react';
import { useRoom } from '../../context/RoomContext';

export function ConnectionBanner() {
    const { connectionState, attemptReconnect, leaveCurrentRoom } = useRoom();

    if (connectionState === 'connected') return null;

    return (
        <div className={`w-full py-2.5 px-4 text-sm font-semibold text-center rounded-2xl mb-4 ${
            connectionState === 'reconnecting'
                ? 'bg-amber-500/12 border border-amber-400/25 text-amber-200'
                : 'bg-red-500/12 border border-red-400/25 text-red-200'
        }`}>
            {connectionState === 'reconnecting' ? (
                <span>Connection lost. Reconnecting... <span className="animate-pulse">&#9679;</span></span>
            ) : (
                <span>
                    Disconnected.{' '}
                    <button onClick={() => attemptReconnect()} className="underline underline-offset-2">Retry</button>
                    {' or '}
                    <button onClick={leaveCurrentRoom} className="underline underline-offset-2">Leave Room</button>
                </span>
            )}
        </div>
    );
}

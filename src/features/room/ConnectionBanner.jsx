import React from 'react';
import { useRoom } from '../../context/RoomContext';

export function ConnectionBanner() {
    const { connectionState, attemptReconnect, leaveCurrentRoom } = useRoom();

    if (connectionState === 'connected') return null;

    return (
        <div className={`w-full py-2 px-4 text-sm font-semibold text-center ${
            connectionState === 'reconnecting'
                ? 'bg-amber-500/20 border-b border-amber-500/30 text-amber-300'
                : 'bg-red-500/20 border-b border-red-500/30 text-red-300'
        }`}>
            {connectionState === 'reconnecting' ? (
                <span>Connection lost. Reconnecting... <span className="animate-pulse">&#9679;</span></span>
            ) : (
                <span>
                    Disconnected.{' '}
                    <button onClick={() => attemptReconnect()} className="underline">Retry</button>
                    {' or '}
                    <button onClick={leaveCurrentRoom} className="underline">Leave Room</button>
                </span>
            )}
        </div>
    );
}

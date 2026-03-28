import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function MultiplayerPanel({
    onCreateRoom,
    onJoinRoom,
    isBackendEnabled,
    joinCode,
    setJoinCode,
    mpLoading,
    mpLoadingAction,
    onBack,
}) {
    return (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center gap-1 mb-4 text-white/60 text-sm">
                {isBackendEnabled ? (
                    <><Wifi className="w-4 h-4 text-emerald-400" /> Connected</>
                ) : (
                    <>
                        <span className="flex items-center gap-2"><WifiOff className="w-4 h-4 text-amber-400" /> Multiplayer needs server</span>
                        <span className="text-white/40 text-xs">Play solo above — it works without setup</span>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <button
                    onClick={onCreateRoom}
                    disabled={mpLoading || !isBackendEnabled}
                    className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {mpLoading && mpLoadingAction === 'create' ? 'Creating...' : 'Create Room'}
                </button>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Room code"
                        maxLength={6}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg text-center tracking-widest font-bold uppercase"
                    />
                    <button
                        onClick={onJoinRoom}
                        disabled={mpLoading || !isBackendEnabled || joinCode.trim().length < 4}
                        className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        aria-busy={mpLoading && mpLoadingAction === 'join'}
                        aria-label={mpLoading && mpLoadingAction === 'join' ? 'Joining room...' : 'Join room'}
                    >
                        {mpLoading && mpLoadingAction === 'join' ? 'Joining...' : 'Join'}
                    </button>
                </div>

                <button
                    onClick={onBack}
                    className="w-full text-sm text-white/40 hover:text-white underline"
                >
                    Back to solo play
                </button>
            </div>
        </div>
    );
}

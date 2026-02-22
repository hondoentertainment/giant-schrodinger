import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';

export function Gallery() {
    const { setGameState } = useGame();
    const [collisions, setCollisions] = useState([]);

    useEffect(() => {
        setCollisions(getCollisions());
    }, []);

    return (
        <div className="w-full max-w-6xl animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-display font-bold text-white">Collision Gallery</h2>
                <button
                    onClick={() => setGameState('LOBBY')}
                    className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                    Back to Lobby
                </button>
            </div>

            {collisions.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl">
                    <p className="text-white/40 text-xl">No collisions yet. Play a game!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(collisions || []).map((c) => (
                        <div key={c?.id || Math.random()} className="group relative aspect-square rounded-2xl overflow-hidden glass-panel btn-kinetic">
                            <img src={c?.imageUrl || ''} alt={c?.submission || 'Collision'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <div className="text-2xl font-bold text-white mb-1">{c?.submission || 'Untitled'}</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-white/60 text-sm">{c?.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Unknown date'}</div>
                                    <div className="text-yellow-400 font-bold">{c?.score || 0}/10</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

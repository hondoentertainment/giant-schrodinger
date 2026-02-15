import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgement } from '../../services/judgements';

export function Gallery() {
    const { setGameState } = useGame();
    const [collisions, setCollisions] = useState([]);
    const [friendJudgements, setFriendJudgements] = useState({});

    useEffect(() => {
        const list = getCollisions();
        setCollisions(list);
        const ids = list.map((c) => c.id);
        if (ids.length > 0) {
            getJudgementsByCollisionIds(ids).then(setFriendJudgements);
        }
    }, []);

    const getDisplayJudgement = (collision) =>
        friendJudgements[collision.id] || getJudgement(collision.id);

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
                    {collisions.map((c) => (
                        <div key={c.id} className="group relative aspect-square rounded-2xl overflow-hidden glass-panel transition-transform hover:scale-[1.02]">
                            <img
                                src={c.imageUrl}
                                alt={c.submission}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                data-fallback={c.fallbackImageUrl || 'https://source.unsplash.com/featured/1200x1200?abstract art'}
                                onError={(event) => {
                                    const fallback = event.currentTarget.dataset.fallback;
                                    if (fallback && event.currentTarget.src !== fallback) {
                                        event.currentTarget.src = fallback;
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <div className="text-2xl font-bold text-white mb-1">{c.submission}</div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <div className="text-white/60 text-sm">{new Date(c.timestamp).toLocaleDateString()}</div>
                                        <div className="text-yellow-400 font-bold">{c.score}/10</div>
                                    </div>
                                    {(() => {
                                        const fj = getDisplayJudgement(c);
                                        return fj ? (
                                            <div className="text-white/70 text-sm border-t border-white/20 pt-2 mt-2">
                                                Judged by {fj.judgeName || fj.judge_name || 'a friend'}: {fj.score}/10
                                                {fj.commentary && <div className="text-white/50 italic mt-1 truncate">&ldquo;{fj.commentary}&rdquo;</div>}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

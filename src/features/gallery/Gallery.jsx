import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgement } from '../../services/judgements';
const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest', fn: (a, b) => new Date(b.timestamp) - new Date(a.timestamp) },
    { id: 'oldest', label: 'Oldest', fn: (a, b) => new Date(a.timestamp) - new Date(b.timestamp) },
    { id: 'score-high', label: 'Highest score', fn: (a, b) => (b.score ?? 0) - (a.score ?? 0) },
    { id: 'score-low', label: 'Lowest score', fn: (a, b) => (a.score ?? 0) - (b.score ?? 0) },
];

function LazyImage({ collision, displayJudgement }) {
    const [imageStatus, setImageStatus] = useState('loading');
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    const fallbackUrl = collision.fallbackImageUrl || 'https://picsum.photos/seed/venn-fallback/800/800';

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { rootMargin: '100px', threshold: 0.01 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleError = (event) => {
        const fallback = event.currentTarget.dataset.fallback;
        if (fallback && event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
            event.currentTarget.onerror = () => setImageStatus('error');
        } else {
            setImageStatus('error');
        }
    };

    const fj = displayJudgement;

    return (
        <article
            ref={ref}
            className="group relative aspect-square rounded-2xl overflow-hidden glass-panel transition-transform hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-purple-500 focus-within:outline-none"
            tabIndex={0}
            aria-label={`Connection: "${collision.submission}". Score ${collision.score} out of 10. ${new Date(collision.timestamp).toLocaleDateString()}.${fj ? ` Judged by ${fj.judgeName || fj.judge_name || 'a friend'}: ${fj.score}/10.` : ''}`}
        >
            {imageStatus === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin" aria-hidden="true" />
                </div>
            )}
            {imageStatus === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
                    <div className="text-center text-white/50 text-sm px-4">
                        Image unavailable
                    </div>
                </div>
            )}
            {isVisible && (
                <img
                    src={collision.imageUrl}
                    alt={collision.submission}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    referrerPolicy="no-referrer"
                    data-fallback={fallbackUrl}
                    onLoad={() => setImageStatus('loaded')}
                    onError={handleError}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="text-2xl font-bold text-white mb-1">{collision.submission}</div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <div className="text-white/60 text-sm">{new Date(collision.timestamp).toLocaleDateString()}</div>
                        <div className="text-yellow-400 font-bold">{collision.score}/10</div>
                    </div>
                    {fj && (
                        <div className="text-white/70 text-sm border-t border-white/20 pt-2 mt-2">
                            Judged by {fj.judgeName || fj.judge_name || 'a friend'}: {fj.score}/10
                            {fj.commentary && <div className="text-white/50 italic mt-1 truncate">&ldquo;{fj.commentary}&rdquo;</div>}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

export function Gallery() {
    const { setGameState } = useGame();
    const [collisions, setCollisions] = useState([]);
    const [friendJudgements, setFriendJudgements] = useState({});
    const [loadingJudgements, setLoadingJudgements] = useState(true);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const list = getCollisions();
        setCollisions(list);
        const ids = list.map((c) => c.id);
        if (ids.length === 0) {
            setLoadingJudgements(false);
        } else {
            setLoadingJudgements(true);
            getJudgementsByCollisionIds(ids)
                .then(setFriendJudgements)
                .finally(() => setLoadingJudgements(false));
        }
    }, []);

    const getDisplayJudgement = (collision) =>
        friendJudgements[collision.id] || getJudgement(collision.id);

    const sortOpt = SORT_OPTIONS.find((o) => o.id === sortBy) ?? SORT_OPTIONS[0];
    const sorted = [...collisions].sort(sortOpt.fn);

    return (
        <div className="w-full max-w-6xl animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-4xl font-display font-bold text-white">Connection Gallery</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="gallery-sort" className="text-white/50 text-sm sr-only">
                            Sort by
                        </label>
                        <select
                            id="gallery-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-black/30 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            aria-label="Sort gallery"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setGameState('LOBBY')}
                        className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-h-[44px]"
                        aria-label="Back to Lobby"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>

            {collisions.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl">
                    <p className="text-white/40 text-xl">No connections yet. Play a game!</p>
                </div>
            ) : (
                <>
                    {loadingJudgements && (
                        <p className="text-white/40 text-sm mb-4" role="status" aria-live="polite">
                            Loading friend feedback...
                        </p>
                    )}
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        role="list"
                        aria-label="Your connection gallery"
                    >
                        {sorted.map((c) => (
                            <LazyImage
                                key={c.id}
                                collision={c}
                                displayJudgement={getDisplayJudgement(c)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

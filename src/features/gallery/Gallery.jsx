import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgement } from '../../services/judgements';
import { getAllVotes } from '../../services/votes';
import { getHighlights } from '../../services/highlights';
import { LazyImage } from './sections/LazyImage';
import { CommunityTab } from './sections/CommunityTab';

function buildSortOptions(votesMap) {
    return [
        { id: 'newest', label: 'Newest', fn: (a, b) => new Date(b.timestamp) - new Date(a.timestamp) },
        { id: 'oldest', label: 'Oldest', fn: (a, b) => new Date(a.timestamp) - new Date(b.timestamp) },
        { id: 'score-high', label: 'Highest score', fn: (a, b) => (b.score ?? 0) - (a.score ?? 0) },
        { id: 'score-low', label: 'Lowest score', fn: (a, b) => (a.score ?? 0) - (b.score ?? 0) },
        { id: 'most-voted', label: 'Most voted', fn: (a, b) => {
            const va = votesMap[a.id] || { up: 0, down: 0 };
            const vb = votesMap[b.id] || { up: 0, down: 0 };
            return (vb.up - vb.down) - (va.up - va.down);
        }},
    ];
}

export function Gallery() {
    const { setGameState } = useGame();
    const [activeTab, setActiveTab] = useState('my');
    const [collisions, setCollisions] = useState([]);
    const [friendJudgements, setFriendJudgements] = useState({});
    const [loadingJudgements, setLoadingJudgements] = useState(true);
    const [sortBy, setSortBy] = useState('newest');
    const [todayHighlights, setTodayHighlights] = useState([]);
    const galleryGridRef = useRef(null);

    const handleGalleryKeyDown = (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const grid = galleryGridRef.current;
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll('[tabindex="0"]'));
        const currentIndex = items.indexOf(document.activeElement);
        if (currentIndex === -1) return;
        e.preventDefault();
        if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
            items[currentIndex + 1].focus();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            items[currentIndex - 1].focus();
        }
    };

    useEffect(() => {
        // Load today's best highlights (top-scoring from all highlights)
        const highlights = getHighlights();
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayItems = highlights
            .filter(h => h.timestamp >= startOfDay)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        setTodayHighlights(todayItems.length > 0 ? todayItems : highlights.slice(0, 3));
    }, []);

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

    const votesMap = useMemo(() => getAllVotes(), [collisions]);
    const sortOptions = useMemo(() => buildSortOptions(votesMap), [votesMap]);
    const sorted = useMemo(() => {
        const sortOpt = sortOptions.find((o) => o.id === sortBy) ?? sortOptions[0];
        return [...collisions].sort(sortOpt.fn);
    }, [collisions, sortBy, sortOptions]);

    return (
        <div className="w-full max-w-6xl animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-4xl font-display font-bold text-white">Connection Gallery</h2>
                <button
                    onClick={() => setGameState('LOBBY')}
                    className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-h-[44px]"
                    aria-label="Back to Lobby"
                >
                    Back to Lobby
                </button>
            </div>

            {/* Tab system */}
            <div className="flex items-center gap-1 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'my'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-white/40 hover:text-white/70'
                    }`}
                >
                    My Connections
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    className={`px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'community'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-white/40 hover:text-white/70'
                    }`}
                >
                    Community
                </button>
            </div>

            {activeTab === 'community' ? (
                <CommunityTab />
            ) : (
            <>
            {/* Sort controls for My Connections */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
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
                        {sortOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Best of Today */}
            {todayHighlights.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-yellow-400">&#9733;</span> Best of Today
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {todayHighlights.map((h, i) => (
                            <div
                                key={h.id}
                                className={`relative p-4 rounded-2xl border transition-all ${
                                    i === 0
                                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/30'
                                        : 'bg-white/5 border-white/10'
                                }`}
                            >
                                {i === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                        #1
                                    </div>
                                )}
                                <div className="text-lg font-bold text-white mb-1 truncate">{h.submission}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">
                                        {h.leftLabel && h.rightLabel ? `${h.leftLabel} + ${h.rightLabel}` : 'Connection'}
                                    </span>
                                    <span className="text-yellow-400 font-bold text-lg">{h.score}/10</span>
                                </div>
                                {h.playerName && (
                                    <div className="text-white/40 text-xs mt-1">by {h.playerName}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow-key navigation between listitems is a standard pattern; focus still lives on the listitem children */}
                    <div
                        ref={galleryGridRef}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        role="list"
                        aria-label="Your connection gallery"
                        onKeyDown={handleGalleryKeyDown}
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
            </>
            )}
        </div>
    );
}

import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgementForCollision } from '../../services/judgements';
import { getHighlights } from '../../services/highlights';
const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest', fn: (a, b) => new Date(b.timestamp) - new Date(a.timestamp) },
    { id: 'oldest', label: 'Oldest', fn: (a, b) => new Date(a.timestamp) - new Date(b.timestamp) },
    { id: 'score-high', label: 'Highest score', fn: (a, b) => (b.score ?? 0) - (a.score ?? 0) },
    { id: 'score-low', label: 'Lowest score', fn: (a, b) => (a.score ?? 0) - (b.score ?? 0) },
];

function formatCollisionDate(timestamp) {
    const date = timestamp ? new Date(timestamp) : null;
    if (!date || Number.isNaN(date.getTime())) return 'Date unknown';
    return date.toLocaleDateString();
}

function LazyImage({ collision, displayJudgement, isHighlight, onSelect, onCopyShare }) {
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
    const displayDate = formatCollisionDate(collision.timestamp);

    return (
        <div
            ref={ref}
            role="listitem"
            className="contents"
        >
        <article
            className="group relative aspect-square rounded-2xl overflow-hidden glass-panel transition-transform hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-purple-500 focus-within:outline-none"
            tabIndex={0}
            aria-label={`Connection: "${collision.submission}". Score ${collision.score} out of 10. ${displayDate}.${fj ? ` Judged by ${fj.judgeName || fj.judge_name || 'a friend'}: ${fj.score}/10.` : ''}`}
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
                        <div className="text-white/60 text-sm">{displayDate}</div>
                        <div className="text-yellow-400 font-bold">{collision.score}/10</div>
                    </div>
                    {fj && (
                        <div className="text-white/70 text-sm border-t border-white/20 pt-2 mt-2">
                            Judged by {fj.judgeName || fj.judge_name || 'a friend'}: {fj.score}/10
                            {fj.commentary && <div className="text-white/50 italic mt-1 truncate">&ldquo;{fj.commentary}&rdquo;</div>}
                        </div>
                    )}
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={() => onSelect(collision)}
                        className="flex-1 rounded-xl bg-white text-black px-3 py-2 text-sm font-bold"
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => onCopyShare(collision)}
                        className="flex-1 rounded-xl bg-white/10 text-white px-3 py-2 text-sm font-bold border border-white/20"
                    >
                        Copy share
                    </button>
                </div>
            </div>
            <div className="absolute left-3 right-3 bottom-3 rounded-xl bg-black/70 p-3 text-left opacity-100 group-hover:opacity-0 group-focus-within:opacity-0 transition-opacity md:hidden">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-white font-semibold truncate">{collision.submission}</span>
                    <span className="text-yellow-300 font-bold">{collision.score}/10</span>
                </div>
                {isHighlight && <div className="text-amber-300 text-xs mt-1">Highlight</div>}
            </div>
        </article>
        </div>
    );
}

export function Gallery() {
    const { setGameState } = useGame();
    const [collisions, setCollisions] = useState([]);
    const [friendJudgements, setFriendJudgements] = useState({});
    const [loadingJudgements, setLoadingJudgements] = useState(true);
    const [sortBy, setSortBy] = useState('newest');
    const [feedbackFilter, setFeedbackFilter] = useState('all');
    const [selectedCollision, setSelectedCollision] = useState(null);
    const [shareCopiedId, setShareCopiedId] = useState(null);

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
        friendJudgements[collision.id] || getJudgementForCollision(collision.id);

    const sortOpt = SORT_OPTIONS.find((o) => o.id === sortBy) ?? SORT_OPTIONS[0];
    const highlightIds = new Set(getHighlights().map((highlight) => highlight.id));
    const judgedCount = collisions.filter((collision) => getDisplayJudgement(collision)).length;
    const highlightCount = collisions.filter((collision) => highlightIds.has(collision.id) || (collision.score || 0) >= 8).length;
    const averageScore = collisions.length
        ? collisions.reduce((sum, collision) => sum + (collision.score || 0), 0) / collisions.length
        : 0;
    const filtered = collisions.filter((collision) => {
        if (feedbackFilter === 'judged') return Boolean(getDisplayJudgement(collision));
        if (feedbackFilter === 'highlights') return highlightIds.has(collision.id) || (collision.score || 0) >= 8;
        return true;
    });
    const sorted = [...filtered].sort(sortOpt.fn);

    const handleCopyShare = async (collision) => {
        const judgement = getDisplayJudgement(collision);
        const friendLine = judgement
            ? ` Friend Judge: ${judgement.judgeName || judgement.judge_name || 'A friend'} gave it ${judgement.score}/10${judgement.commentary ? ` — "${judgement.commentary}"` : ''}.`
            : '';
        const highlightLine = (collision.score || 0) >= 8 ? ' Highlight-worthy.' : '';
        const text = `My Venn connection: "${collision.submission}" scored ${collision.score}/10.${friendLine}${highlightLine} Play Venn with Friends: ${window.location.origin}${window.location.pathname}`;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            setShareCopiedId(collision.id);
            setTimeout(() => setShareCopiedId(null), 2000);
        }
    };

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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <div className="text-white/40 text-xs uppercase tracking-wider">Saved</div>
                            <div className="text-2xl font-black text-white">{collisions.length}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <div className="text-white/40 text-xs uppercase tracking-wider">Average</div>
                            <div className="text-2xl font-black text-white">{averageScore.toFixed(1)}/10</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <div className="text-white/40 text-xs uppercase tracking-wider">Friend Feedback</div>
                            <div className="text-2xl font-black text-white">{judgedCount}</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:col-span-3">
                            <div className="text-white/40 text-xs uppercase tracking-wider">Highlights</div>
                            <div className="text-2xl font-black text-white">{highlightCount}</div>
                            <div className="text-white/40 text-xs mt-1">Scores 8+ are treated as reshare-worthy highlights.</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { id: 'all', label: 'All saved' },
                            { id: 'judged', label: 'With friend feedback' },
                            { id: 'highlights', label: 'Highlights' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setFeedbackFilter(option.id)}
                                aria-pressed={feedbackFilter === option.id}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    feedbackFilter === option.id
                                        ? 'bg-white text-black'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    {loadingJudgements && (
                        <p className="text-white/40 text-sm mb-4" role="status" aria-live="polite">
                            Loading friend feedback...
                        </p>
                    )}
                    {!loadingJudgements && sorted.length === 0 && (
                        <p className="text-white/40 text-sm mb-4" role="status">
                            {feedbackFilter === 'judged'
                                ? 'No friend feedback yet. Share a round for judging to fill this view.'
                                : feedbackFilter === 'highlights'
                                ? 'No highlights yet. Score 8+ to build your best-of archive.'
                                : 'No saved connections match this filter yet.'}
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
                                isHighlight={highlightIds.has(c.id) || (c.score || 0) >= 8}
                                onSelect={setSelectedCollision}
                                onCopyShare={handleCopyShare}
                            />
                        ))}
                    </div>
                    {shareCopiedId && (
                        <p className="mt-4 text-center text-emerald-300 text-sm" role="status">
                            Share text copied.
                        </p>
                    )}
                    {selectedCollision && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="gallery-detail-title">
                            <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6">
                                <h3 id="gallery-detail-title" className="text-2xl font-display font-bold text-white mb-2">Saved Connection</h3>
                                <p className="text-white/80 text-xl italic mb-4">&ldquo;{selectedCollision.submission}&rdquo;</p>
                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="rounded-xl bg-white/5 p-3">
                                        <div className="text-white/40 uppercase tracking-wider text-xs">Score</div>
                                        <div className="text-white font-bold">{selectedCollision.score}/10</div>
                                    </div>
                                    <div className="rounded-xl bg-white/5 p-3">
                                        <div className="text-white/40 uppercase tracking-wider text-xs">Saved</div>
                                        <div className="text-white font-bold">{formatCollisionDate(selectedCollision.timestamp)}</div>
                                    </div>
                                </div>
                                {getDisplayJudgement(selectedCollision) && (
                                    <div className="rounded-xl bg-white/5 p-3 text-sm text-white/70 mb-4">
                                        <div className="text-white font-semibold">Friend Judge Result</div>
                                        <div className="mt-1">
                                            {getDisplayJudgement(selectedCollision).judgeName || 'A friend'} gave it {getDisplayJudgement(selectedCollision).score}/10.
                                        </div>
                                        {getDisplayJudgement(selectedCollision).commentary && (
                                            <div className="mt-2 text-white/50 italic">
                                                &ldquo;{getDisplayJudgement(selectedCollision).commentary}&rdquo;
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleCopyShare(selectedCollision)}
                                        className="flex-1 rounded-xl bg-white text-black py-3 font-bold"
                                    >
                                        Copy Share Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCollision(null)}
                                        className="flex-1 rounded-xl bg-white/10 text-white py-3 font-bold border border-white/20"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


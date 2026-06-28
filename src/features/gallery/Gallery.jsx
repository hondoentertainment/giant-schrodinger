import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useTranslation } from '../../hooks/useTranslation';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgementForCollision } from '../../services/judgements';
import { getCollisionMediaMode, getMediaModeLabel } from '../../lib/mediaType';
import { getHighlights } from '../../services/highlights';
import { downloadFusionImage } from '../../services/socialShare';
import { buildBlurPlaceholderUrl } from '../../lib/mediaLoad';
import { MEDIA_TYPES } from '../../data/themes';
import { getJudgeModeFromCollision } from '../../lib/judgeMode';
import { EmptyState } from '../../components/EmptyState';

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

function getPromptPairLabel(collision) {
    const left = collision.assets?.left?.label;
    const right = collision.assets?.right?.label;
    if (!left || !right) return null;
    return `${left} x ${right}`;
}

function getJudgeModeLabel(collision) {
    return getJudgeModeFromCollision(collision);
}

function isWithinLastWeek(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return false;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return date.getTime() >= weekAgo;
}

function LazyImage({ collision, displayJudgement, isHighlight, onSelect, onCopyShare }) {
    const [imageStatus, setImageStatus] = useState('loading');
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    const fallbackUrl = collision.fallbackImageUrl || 'https://picsum.photos/seed/venn-fallback/800/800';
    const blurUrl = buildBlurPlaceholderUrl(collision.imageUrl) || buildBlurPlaceholderUrl(fallbackUrl);

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
            className="group relative aspect-square rounded-[22px] overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-transform hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-game-accent focus-within:outline-none shadow-game-card"
            tabIndex={0}
            aria-label={`Connection: "${collision.submission}". Score ${collision.score} out of 10. ${displayDate}.${fj ? ` Judged by ${fj.judgeName || fj.judge_name || 'a friend'}: ${fj.score}/10.` : ''}`}
        >
            {imageStatus === 'loading' && (
                <div className="absolute inset-0 z-10">
                    {blurUrl && isVisible && (
                        <img
                            src={blurUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-game-accent animate-spin" aria-hidden="true" />
                    </div>
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
                        className="wordle-button wordle-primary flex-1 min-h-[44px] py-2 text-sm"
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => onCopyShare(collision)}
                        className="wordle-button flex-1 min-h-[44px] py-2 text-sm"
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
    const { t } = useTranslation();
    const [collisions, setCollisions] = useState([]);
    const [friendJudgements, setFriendJudgements] = useState({});
    const [loadingJudgements, setLoadingJudgements] = useState(true);
    const [sortBy, setSortBy] = useState('newest');
    const [feedbackFilter, setFeedbackFilter] = useState('all');
    const [mediaFilter, setMediaFilter] = useState('all');
    const [selectedCollision, setSelectedCollision] = useState(null);
    const [shareCopiedId, setShareCopiedId] = useState(null);
    const [shareCardLoadingId, setShareCardLoadingId] = useState(null);

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
        if (feedbackFilter === 'judged' && !getDisplayJudgement(collision)) return false;
        if (feedbackFilter === 'highlights' && !(highlightIds.has(collision.id) || (collision.score || 0) >= 8)) return false;
        if (feedbackFilter === 'week' && !isWithinLastWeek(collision.timestamp)) return false;
        if (mediaFilter !== 'all' && getCollisionMediaMode(collision) !== mediaFilter) return false;
        return true;
    });
    const sorted = [...filtered].sort(sortOpt.fn);

    const handleCopyShare = async (collision) => {
        const judgement = getDisplayJudgement(collision);
        const promptPair = getPromptPairLabel(collision);
        const promptLine = promptPair ? ` Prompt pair: ${promptPair}.` : '';
        const judgeLine = ` ${getJudgeModeLabel(collision)} result.`;
        const dailyLine = collision.isDailyChallenge ? ' Daily Venn.' : '';
        const friendLine = judgement
            ? ` Friend Judge: ${judgement.judgeName || judgement.judge_name || 'A friend'} gave it ${judgement.score}/10${judgement.commentary ? ` — "${judgement.commentary}"` : ''}.`
            : '';
        const highlightLine = (collision.score || 0) >= 8 ? ' Highlight-worthy.' : '';
        const mediaLine = ` ${getMediaModeLabel(getCollisionMediaMode(collision))} round.`;
        const text = `My Venn connection: "${collision.submission}" scored ${collision.score}/10.${promptLine}${mediaLine}${judgeLine}${dailyLine}${friendLine}${highlightLine} Play Venn with Friends: ${window.location.origin}${window.location.pathname}`;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            setShareCopiedId(collision.id);
            setTimeout(() => setShareCopiedId(null), 2000);
        }
    };

    const handleDownloadShareCard = async (collision) => {
        setShareCardLoadingId(collision.id);
        try {
            await downloadFusionImage(collision.imageUrl, {
                submission: collision.submission,
                score: collision.score,
                judgeMode: collision.judgeMode,
                assets: collision.assets,
            });
        } finally {
            setShareCardLoadingId(null);
        }
    };

    return (
        <div className="w-full max-w-6xl animate-spring-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <div className="game-section-label mb-1">Your archive</div>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">Connection Gallery</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="gallery-sort" className="text-white/50 text-sm sr-only">
                            Sort by
                        </label>
                        <select
                            id="gallery-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="game-input py-2.5 text-sm min-h-[44px]"
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
                        className="wordle-button min-h-[44px]"
                        aria-label="Back to Lobby"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>

            {collisions.length === 0 ? (
                <EmptyState
                    icon="🖼️"
                    title="No connections yet"
                    description="Play a round and your best fusions will show up here."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="game-stat-tile text-left sm:text-center">
                            <div className="game-section-label">Saved</div>
                            <div className="text-2xl font-bold text-white mt-1">{collisions.length}</div>
                        </div>
                        <div className="game-stat-tile text-left sm:text-center">
                            <div className="game-section-label">Average</div>
                            <div className="text-2xl font-bold text-white mt-1">{averageScore.toFixed(1)}/10</div>
                        </div>
                        <div className="game-stat-tile text-left sm:text-center">
                            <div className="game-section-label">Friend feedback</div>
                            <div className="text-2xl font-bold text-white mt-1">{judgedCount}</div>
                        </div>
                        <div className="game-stat-tile sm:col-span-3 text-left">
                            <div className="game-section-label">Highlights</div>
                            <div className="text-2xl font-bold text-white mt-1">{highlightCount}</div>
                            <div className="text-white/45 text-xs mt-1">Scores 8+ are treated as reshare-worthy highlights.</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { id: 'all', label: t('gallery.allSaved') },
                            { id: 'week', label: t('gallery.bestOfWeek') },
                            { id: 'judged', label: t('gallery.withFriendFeedback') },
                            { id: 'highlights', label: t('gallery.highlights') },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setFeedbackFilter(option.id)}
                                aria-pressed={feedbackFilter === option.id}
                                className={`game-segment ${feedbackFilter === option.id ? 'game-segment-selected' : ''}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { id: 'all', label: 'All media' },
                            { id: MEDIA_TYPES.IMAGE, label: 'Images' },
                            { id: MEDIA_TYPES.MEMES_VIDEOS, label: 'Memes & Videos' },
                            { id: MEDIA_TYPES.VIDEO, label: 'Videos' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setMediaFilter(option.id)}
                                aria-pressed={mediaFilter === option.id}
                                className={`game-segment ${
                                    mediaFilter === option.id
                                        ? 'game-segment-selected ring-1 ring-game-accent/40'
                                        : ''
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
                                : feedbackFilter === 'week'
                                ? t('gallery.emptyWeek')
                                : mediaFilter !== 'all'
                                ? `No ${getMediaModeLabel(mediaFilter).toLowerCase()} connections saved yet.`
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
                        <div className="game-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gallery-detail-title">
                            <div className="game-modal-panel p-6 sm:p-7">
                                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white/55 mb-4 border border-white/10 bg-white/[0.06]">
                                    Saved connection
                                </div>
                                <h3 id="gallery-detail-title" className="text-2xl font-display font-bold tracking-tight text-white mb-2">Connection details</h3>
                                <p className="text-white/80 text-xl italic mb-4">&ldquo;{selectedCollision.submission}&rdquo;</p>
                                {getPromptPairLabel(selectedCollision) && (
                                    <div className="mb-4 wordle-tile wordle-tile-filled min-h-[44px] px-3 text-sm justify-start">
                                        {getPromptPairLabel(selectedCollision)}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="game-stat-tile text-left">
                                        <div className="game-section-label">Score</div>
                                        <div className="text-white font-bold text-lg mt-1">{selectedCollision.score}/10</div>
                                    </div>
                                    <div className="game-stat-tile text-left">
                                        <div className="game-section-label">Judge</div>
                                        <div className="text-white font-bold text-lg mt-1">{getJudgeModeLabel(selectedCollision)}</div>
                                    </div>
                                    <div className="game-stat-tile text-left">
                                        <div className="game-section-label">Saved</div>
                                        <div className="text-white font-bold text-lg mt-1">{formatCollisionDate(selectedCollision.timestamp)}</div>
                                    </div>
                                    <div className="game-stat-tile text-left">
                                        <div className="game-section-label">Mode</div>
                                        <div className="text-white font-bold text-lg mt-1">{selectedCollision.isDailyChallenge ? 'Daily Venn' : 'Session'}</div>
                                    </div>
                                </div>
                                {getDisplayJudgement(selectedCollision) && (
                                    <div className="rounded-[22px] bg-white/[0.05] border border-white/[0.08] p-4 text-sm text-white/70 mb-4">
                                        <div className="text-white font-semibold">Friend judge result</div>
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
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleCopyShare(selectedCollision)}
                                        className="wordle-button wordle-primary flex-1 min-h-[44px]"
                                    >
                                        Copy Share Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadShareCard(selectedCollision)}
                                        disabled={shareCardLoadingId === selectedCollision.id}
                                        className="wordle-button flex-1 min-h-[44px] disabled:opacity-50"
                                    >
                                        {shareCardLoadingId === selectedCollision.id ? t('gallery.buildingCard') : t('gallery.downloadShareCard')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCollision(null)}
                                        className="wordle-button flex-1 min-h-[44px]"
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


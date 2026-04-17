import React, { useEffect, useState, useRef } from 'react';
import { flagContent } from '../../../services/moderation';
import { VoteButtons } from './VoteButtons';

function formatCollisionDate(timestamp) {
    if (!timestamp) return 'Recently';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString();
}

export function LazyImage({ collision, displayJudgement }) {
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
            role="listitem"
            className="group relative aspect-square rounded-2xl overflow-hidden glass-panel transition-transform hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-purple-500 focus-within:outline-none"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- listitem is focusable so users can arrow-navigate through the gallery
            tabIndex={0}
            aria-label={`Connection: "${collision.submission}". Score ${collision.score} out of 10. ${formatCollisionDate(collision.timestamp)}.${fj ? ` Judged by ${fj.judgeName || fj.judge_name || 'a friend'}: ${fj.score}/10.` : ''}`}
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
                        <div className="text-white/60 text-sm">{formatCollisionDate(collision.timestamp)}</div>
                        <div className="text-yellow-400 font-bold">{collision.score}/10</div>
                    </div>
                    {/* Voting & Report */}
                    <div className="flex items-center justify-between">
                        <VoteButtons collisionId={collision.id} />
                        <button
                            onClick={(e) => { e.stopPropagation(); flagContent(collision.id, 'inappropriate'); }}
                            className="text-white/30 hover:text-red-400 text-xs"
                            aria-label="Report this submission"
                        >
                            {'\u{1F6A9}'} Report
                        </button>
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

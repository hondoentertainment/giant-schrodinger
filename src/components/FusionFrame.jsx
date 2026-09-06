import React, { useEffect, useState } from 'react';
import { buildBlurPlaceholderUrl } from '../lib/mediaLoad';

const LEFT_COLOR = '#a855f7';
const RIGHT_COLOR = '#6366f1';
const LENS_COLOR = '#8b5cf6';

export function buildFusionAlt({ leftLabel, rightLabel, submission }) {
    const pair = leftLabel && rightLabel ? `${leftLabel} and ${rightLabel}` : 'the two prompts';
    const line = submission ? `: "${submission}"` : '';
    return `Fusion of ${pair}${line}`;
}

function PairStrip({ leftLabel, rightLabel }) {
    if (!leftLabel && !rightLabel) return null;
    return (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] pointer-events-none">
            <span className="flex items-center gap-1.5 min-w-0 max-w-[48%] px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white/80">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: LEFT_COLOR }} />
                <span className="truncate">{leftLabel}</span>
            </span>
            <span className="flex items-center gap-1.5 min-w-0 max-w-[48%] px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white/80">
                <span className="truncate">{rightLabel}</span>
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: RIGHT_COLOR }} />
            </span>
        </div>
    );
}

function ConceptCaption({ submission }) {
    if (!submission) return null;
    return (
        <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-5 left-5 right-5 pr-20 text-left">
                <div className="text-white/60 text-[11px] sm:text-sm uppercase tracking-wider">Concept</div>
                <div className="text-xl sm:text-2xl font-bold text-white leading-snug break-words">{submission}</div>
            </div>
        </>
    );
}

/**
 * Two ghost circles drift together while the fusion is being rendered, so the
 * reveal keeps the shape of the round instead of a bare spinner.
 */
function RenderingState({ leftLabel, rightLabel }) {
    return (
        <div className="absolute inset-0 fusion-shimmer" aria-hidden="true" data-testid="fusion-rendering">
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="fusion-ghost fusion-ghost-left absolute w-[58%] aspect-square rounded-full border"
                    style={{ borderColor: `${LEFT_COLOR}88`, background: `radial-gradient(circle at 40% 40%, ${LEFT_COLOR}33, transparent 70%)` }}
                />
                <div
                    className="fusion-ghost fusion-ghost-right absolute w-[58%] aspect-square rounded-full border"
                    style={{ borderColor: `${RIGHT_COLOR}88`, background: `radial-gradient(circle at 60% 60%, ${RIGHT_COLOR}33, transparent 70%)` }}
                />
                <div
                    className="fusion-lens absolute w-[26%] aspect-square rounded-full blur-2xl"
                    style={{ backgroundColor: `${LENS_COLOR}66` }}
                />
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="truncate max-w-[45%]">{leftLabel}</span>
                <span className="text-white/25">×</span>
                <span className="truncate max-w-[45%] text-right">{rightLabel}</span>
            </div>
        </div>
    );
}

function FailedState({ leftLabel, rightLabel, submission }) {
    return (
        <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900"
            data-testid="fusion-failed"
        >
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 mb-3">
                {leftLabel && rightLabel ? `${leftLabel} × ${rightLabel}` : 'The intersection'}
            </div>
            <div className="text-2xl font-bold text-white leading-snug">{submission || 'One connecting line'}</div>
            <div className="mt-4 text-xs text-white/50">Image unavailable — the line still counts.</div>
        </div>
    );
}

/**
 * Reveal hero: the rendered fusion of two prompts. Reserves its square before
 * the image exists, crossfades the render in, walks url → fallbackUrl → text
 * card on error, and labels AI renders vs curated art.
 */
export function FusionFrame({
    image,
    submission,
    leftLabel,
    rightLabel,
    showCaption = true,
    className = '',
    radiusClass = 'rounded-[28px]',
}) {
    const [level, setLevel] = useState(0); // 0 = url, 1 = fallbackUrl, 2 = text card
    const [loaded, setLoaded] = useState(false);

    const primaryUrl = image?.url || null;
    const fallbackUrl = image?.fallbackUrl && image.fallbackUrl !== primaryUrl ? image.fallbackUrl : null;

    useEffect(() => {
        setLevel(0);
        setLoaded(false);
    }, [primaryUrl]);

    const src = level === 0 ? primaryUrl : level === 1 ? fallbackUrl : null;
    const blurUrl = buildBlurPlaceholderUrl(fallbackUrl || primaryUrl);
    const alt = buildFusionAlt({ leftLabel, rightLabel, submission });
    const isRendering = !image;
    const isFailed = Boolean(image) && (level >= 2 || !src);
    const showingCurated = Boolean(image) && (level === 1 || image.isFallback);

    const handleError = () => {
        if (level === 0 && fallbackUrl) {
            setLevel(1);
            setLoaded(false);
            return;
        }
        setLevel(2);
    };

    return (
        <div
            className={`relative aspect-square w-full max-w-sm mx-auto ${radiusClass} overflow-hidden bg-[#120a24] shadow-2xl ring-1 ring-white/15 ${className}`}
            data-testid="fusion-frame"
            data-state={isRendering ? 'rendering' : isFailed ? 'failed' : loaded ? 'ready' : 'loading'}
        >
            {isRendering && <RenderingState leftLabel={leftLabel} rightLabel={rightLabel} />}

            {!isRendering && !isFailed && (
                <>
                    {blurUrl && !loaded && (
                        <img
                            src={blurUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-70"
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <img
                        key={src}
                        src={src}
                        alt={alt}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'
                        }`}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        draggable={false}
                        onLoad={() => setLoaded(true)}
                        onError={handleError}
                    />
                    {!loaded && <div className="absolute inset-0 fusion-shimmer pointer-events-none" aria-hidden="true" />}
                    <PairStrip leftLabel={leftLabel} rightLabel={rightLabel} />
                    <span
                        className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-white/65"
                        data-testid="fusion-source"
                    >
                        {showingCurated ? 'Curated art' : 'AI render'}
                    </span>
                    {showCaption && <ConceptCaption submission={submission} />}
                </>
            )}

            {isFailed && <FailedState leftLabel={leftLabel} rightLabel={rightLabel} submission={submission} />}
        </div>
    );
}

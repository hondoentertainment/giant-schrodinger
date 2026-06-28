import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MEDIA_TYPES } from '../../data/themes';
import { getAssetMediaLabel } from '../../services/assetSelection';
import { isGiphyUrl } from '../../services/memeResolve';
import { getYoutubeEmbedUrl, getYoutubeVideoIdFromAsset } from '../../lib/youtube';
import { buildResponsiveSrcSet, getGiphyPreviewUrl, buildBlurPlaceholderUrl } from '../../lib/mediaLoad';
import { MediaLoadingShell } from '../../components/MediaLoadingShell';
import { useTranslation } from '../../hooks/useTranslation';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// ── Meme circle (GIFs/images with letterboxing) ──
function VennMeme({ asset }) {
    const [loaded, setLoaded] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [useFullRes, setUseFullRes] = useState(!getGiphyPreviewUrl(asset.url));
    const previewUrl = asset.previewUrl || getGiphyPreviewUrl(asset.url);
    const primaryUrl = useFullRes ? asset.url : (previewUrl || asset.url);
    const src = useFallback && asset.fallbackUrl ? asset.fallbackUrl : primaryUrl;
    const blurUrl = asset.blurUrl || (useFallback ? null : buildBlurPlaceholderUrl(asset.fallbackUrl));
    const showGiphyAttribution = asset.memeSource === 'giphy' || isGiphyUrl(asset.url);

    const handleLoad = () => {
        setLoaded(true);
        if (!useFullRes && previewUrl && asset.url && previewUrl !== asset.url) {
            setUseFullRes(true);
            setLoaded(false);
        }
    };

    return (
        <div className="relative overflow-hidden w-full h-full bg-black">
            <MediaLoadingShell blurUrl={blurUrl} loaded={loaded} label={asset.label} />
            <img
                src={src}
                alt={asset.label}
                className={`w-full h-full object-contain transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                onLoad={handleLoad}
                onError={() => {
                    if (!useFallback && asset.fallbackUrl && src !== asset.fallbackUrl) {
                        setUseFallback(true);
                        setLoaded(false);
                        return;
                    }
                    setLoaded(true);
                }}
                loading="eager"
                decoding="async"
                draggable={false}
            />
            {showGiphyAttribution && (
                <a
                    href="https://giphy.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 z-20 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-medium text-white/70 hover:text-white border border-white/10"
                    aria-label="Meme via Giphy"
                >
                    via Giphy
                </a>
            )}
        </div>
    );
}

// ── Image circle ──
function VennImage({ asset }) {
    const [loaded, setLoaded] = useState(false);
    const [fallbackLevel, setFallbackLevel] = useState(0);
    // 0 = primary, 1 = fallback URL, 2 = gradient card

    const src = fallbackLevel === 0 ? asset.url : asset.fallbackUrl;
    const blurUrl = asset.blurUrl || buildBlurPlaceholderUrl(src);

    const handleError = () => {
        if (fallbackLevel === 0 && asset.fallbackUrl) {
            setFallbackLevel(1);
            setLoaded(false);
        } else {
            setFallbackLevel(2);
        }
    };

    if (fallbackLevel >= 2) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800 text-white text-2xl font-bold p-4 text-center">
                {asset.label || 'Mystery Concept'}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden w-full h-full">
            <MediaLoadingShell blurUrl={blurUrl} loaded={loaded} label={asset.label} />
            <img
                src={src}
                srcSet={buildResponsiveSrcSet(src)}
                sizes="(max-width: 640px) 400px, (max-width: 1024px) 640px, 1080px"
                alt={asset.label}
                className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
                    loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
                }`}
                referrerPolicy="no-referrer"
                onError={handleError}
                onLoad={() => setLoaded(true)}
                loading="eager"
                decoding="async"
                draggable={false}
            />
        </div>
    );
}

// ── YouTube embed circle ──
function VennYoutube({ asset, videoId }) {
    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [shouldLoadIframe, setShouldLoadIframe] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);

    const embedUrl = getYoutubeEmbedUrl(videoId, { autoplay: true, mute: true, loop: true });
    const posterUrl = asset.posterUrl || asset.blurUrl;

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return undefined;

        if (typeof IntersectionObserver === 'undefined') {
            setShouldLoadIframe(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoadIframe(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '80px', threshold: 0.01 },
        );
        observer.observe(node);

        // Eager load when already visible (e.g. round screen mounts in view).
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            setShouldLoadIframe(true);
            observer.disconnect();
        }

        return () => observer.disconnect();
    }, []);

    const postPlayerCommand = useCallback((func) => {
        const frame = iframeRef.current?.contentWindow;
        if (!frame) return;
        frame.postMessage(JSON.stringify({ event: 'command', func, args: '' }), '*');
    }, []);

    const togglePlay = useCallback((e) => {
        e.stopPropagation();
        if (playing) {
            postPlayerCommand('pauseVideo');
            setPlaying(false);
        } else {
            postPlayerCommand('playVideo');
            setPlaying(true);
        }
    }, [playing, postPlayerCommand]);

    const toggleMute = useCallback((e) => {
        e.stopPropagation();
        if (muted) {
            postPlayerCommand('unMute');
            setMuted(false);
        } else {
            postPlayerCommand('mute');
            setMuted(true);
        }
    }, [muted, postPlayerCommand]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <MediaLoadingShell blurUrl={posterUrl} loaded={loaded} label={asset.label} />
            {shouldLoadIframe && (
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={asset.label || 'YouTube video'}
                    className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                />
            )}
            {loaded && (
                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all min-w-[44px] min-h-[44px]"
                        aria-label={playing ? 'Pause video' : 'Play video'}
                        title={playing ? 'Pause' : 'Play'}
                    >
                        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all min-w-[44px] min-h-[44px]"
                        aria-label={muted ? 'Unmute video' : 'Mute video'}
                        title={muted ? 'Unmute' : 'Mute'}
                    >
                        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Native file video circle ──
function VennNativeVideo({ asset }) {
    const videoRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.play().catch(() => {});
    }, []);

    const togglePlay = useCallback((e) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play().catch(() => {});
            setPlaying(true);
        } else {
            v.pause();
            setPlaying(false);
        }
    }, []);

    const toggleMute = useCallback((e) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
    }, []);

    const handleError = () => {
        const v = videoRef.current;
        if (v && asset.fallbackUrl && v.src !== asset.fallbackUrl) {
            v.src = asset.fallbackUrl;
        }
    };

    return (
        <>
            <MediaLoadingShell
                blurUrl={asset.posterUrl || asset.blurUrl}
                loaded={loaded}
                label={asset.label}
            />
            <video
                ref={videoRef}
                src={asset.url}
                poster={asset.posterUrl || ''}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loop
                muted={muted}
                playsInline
                preload="metadata"
                onLoadedData={() => setLoaded(true)}
                onCanPlay={() => setLoaded(true)}
                onError={handleError}
            />
            {loaded && (
                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all min-w-[44px] min-h-[44px]"
                        aria-label={playing ? 'Pause video' : 'Play video'}
                        title={playing ? 'Pause' : 'Play'}
                    >
                        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all min-w-[44px] min-h-[44px]"
                        aria-label={muted ? 'Unmute video' : 'Mute video'}
                        title={muted ? 'Unmute' : 'Mute'}
                    >
                        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            )}
        </>
    );
}

function VennVideo({ asset }) {
    const youtubeId = getYoutubeVideoIdFromAsset(asset);
    if (youtubeId) return <VennYoutube asset={asset} videoId={youtubeId} />;
    return <VennNativeVideo asset={asset} />;
}

// ── Audio circle with waveform visualization ──
function VennAudio({ asset }) {
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [coverLoaded, setCoverLoaded] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            ctx.close().catch(() => {});
        };
    }, []);

    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const barWidth = (w / bufferLength) * 1.5;
            const centerY = h / 2;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * (h * 0.35);
                const x = i * (barWidth + 1);
                const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
                gradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
                gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)');
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0.9)');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
            }
        };

        draw();
    }, []);

    const togglePlay = useCallback((e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(() => {});
            setPlaying(true);
            drawWaveform();
        } else {
            audio.pause();
            setPlaying(false);
            cancelAnimationFrame(animFrameRef.current);
        }
    }, [drawWaveform]);

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio && audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
        }
    };

    const handleCoverError = (event) => {
        const fallback = asset.coverFallbackUrl;
        if (fallback && event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
            event.currentTarget.onerror = null;
        }
    };

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center">
            {asset.coverUrl && (
                <img
                    src={asset.coverUrl}
                    alt={asset.label}
                    className={`absolute inset-0 w-full h-full object-cover brightness-50 transition-opacity duration-300 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setCoverLoaded(true)}
                    onError={handleCoverError}
                    referrerPolicy="no-referrer"
                />
            )}
            {!asset.coverUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-pink-900/60" />
            )}

            <audio
                ref={audioRef}
                src={asset.url}
                loop
                crossOrigin="anonymous"
                preload="auto"
                onCanPlay={() => setLoaded(true)}
                onTimeUpdate={handleTimeUpdate}
            />

            <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="relative z-10 w-3/4 h-1/3 pointer-events-none"
            />

            <button
                onClick={togglePlay}
                className="relative z-20 mt-2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all shadow-lg border border-white/20 min-w-[56px] min-h-[56px]"
                aria-label={playing ? 'Pause audio' : 'Play audio'}
                title={playing ? 'Pause' : 'Play'}
            >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            {loaded && (
                <div className="relative z-10 w-3/4 mt-3">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse z-30">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
            )}
        </div>
    );
}

// ── Media dispatcher ──
function VennMedia({ asset }) {
    const type = asset?.type || MEDIA_TYPES.IMAGE;
    if (type === MEDIA_TYPES.VIDEO) return <VennVideo asset={asset} />;
    if (type === MEDIA_TYPES.AUDIO) return <VennAudio asset={asset} />;
    if (type === MEDIA_TYPES.MEME) return <VennMeme asset={asset} />;
    return <VennImage asset={asset} />;
}

// ── Concept title caption below each circle ──
function ConceptCaption({ label, align = 'left', accentColor, assetType }) {
    const conceptLabel = getAssetMediaLabel(assetType);
    return (
        <div
            className={`flex flex-col gap-1 min-w-0 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md ${
                align === 'right' ? 'items-end text-right' : 'items-start text-left'
            }`}
            style={{
                maxWidth: '46%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <span
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: accentColor ? `${accentColor}cc` : 'rgba(255,255,255,0.45)' }}
            >
                {conceptLabel}
            </span>
            <h3 className="font-display text-sm sm:text-base md:text-lg font-semibold text-white leading-snug line-clamp-3">
                {label}
            </h3>
        </div>
    );
}

// ── Single Venn circle ──
function VennCircle({ asset, side, colorblindMode, colors }) {
    const assetType = asset?.type || MEDIA_TYPES.IMAGE;
    const isAudio = assetType === MEDIA_TYPES.AUDIO;
    const isMeme = assetType === MEDIA_TYPES.MEME;
    const isLeft = side === 'left';
    const accentColor = isLeft ? colors.left : colors.right;
    const patternId = isLeft ? 'pattern-left' : 'pattern-right';

    const sideTint = colorblindMode
        ? `linear-gradient(to ${isLeft ? 'right' : 'left'}, ${accentColor}20, transparent 55%)`
        : isAudio
            ? `linear-gradient(to ${isLeft ? 'right' : 'left'}, ${isLeft ? 'rgba(168,85,247,0.12)' : 'rgba(236,72,153,0.12)'}, transparent 55%)`
            : 'none';

    return (
        <div
            className={`absolute ${isLeft ? 'left-0' : 'right-0'} w-[54%] aspect-square rounded-full overflow-hidden z-[1] transition-transform hover:scale-[1.015] duration-500 shadow-2xl group`}
            style={{
                border: `2px solid ${colorblindMode ? accentColor : 'rgba(255,255,255,0.18)'}`,
                boxShadow: `0 24px 56px -16px ${accentColor}44, 0 0 0 1px rgba(255,255,255,0.06) inset`,
            }}
        >
            <VennMedia asset={asset} />

            {/* Subtle edge vignette — keeps images visible in the center */}
            <div
                className={`absolute inset-0 pointer-events-none rounded-full ${
                    isAudio
                        ? isLeft
                            ? 'bg-gradient-to-t from-purple-900/50 via-transparent to-black/10'
                            : 'bg-gradient-to-t from-fuchsia-900/50 via-transparent to-black/10'
                        : isMeme
                            ? 'bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)]'
                        : 'bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]'
                }`}
            />

            {sideTint !== 'none' && (
                <div className="absolute inset-0 pointer-events-none rounded-full" style={{ background: sideTint }} />
            )}

            {colorblindMode && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden="true">
                    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                </svg>
            )}

            {/* Inner ring for polish */}
            <div
                className="absolute inset-[3px] rounded-full pointer-events-none z-[3]"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
            />

            {assetType !== MEDIA_TYPES.IMAGE && (
                <div className={`absolute top-2.5 ${isLeft ? 'left-2.5' : 'right-2.5'} z-20`}>
                    <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
                        {getAssetMediaLabel(assetType)}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Main Venn Diagram ──
export const VennDiagram = React.memo(function VennDiagram({ leftAsset, rightAsset, mediaLoading = false }) {
    const { t } = useTranslation();
    const colorblindMode = localStorage.getItem('venn_colorblind') === 'true';

    const COLORS = colorblindMode
        ? { left: '#0ea5e9', right: '#f97316', overlap: '#10b981' }
        : { left: '#a855f7', right: '#6366f1', overlap: '#8b5cf6' };

    return (
        <div className="relative w-full max-w-2xl mx-auto my-4 sm:my-8">
            {mediaLoading && (
                <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] font-semibold uppercase tracking-wider text-white/70"
                    role="status"
                    aria-live="polite"
                >
                    {t('round.sharpeningMedia')}
                </div>
            )}
            {colorblindMode && (
                <svg className="absolute w-0 h-0" aria-hidden="true">
                    <defs>
                        <pattern id="pattern-left" patternUnits="userSpaceOnUse" width="8" height="8">
                            <line x1="0" y1="0" x2="8" y2="8" stroke={COLORS.left} strokeWidth="1.5" strokeOpacity="0.3" />
                        </pattern>
                        <pattern id="pattern-right" patternUnits="userSpaceOnUse" width="6" height="6">
                            <circle cx="3" cy="3" r="1.5" fill={COLORS.right} fillOpacity="0.3" />
                        </pattern>
                    </defs>
                </svg>
            )}

            {/* Circles */}
            <div className="relative w-full aspect-[2/1.1] flex justify-center items-center">
                <VennCircle
                    asset={leftAsset}
                    side="left"
                    colorblindMode={colorblindMode}
                    colors={COLORS}
                />
                <VennCircle
                    asset={rightAsset}
                    side="right"
                    colorblindMode={colorblindMode}
                    colors={COLORS}
                />

                {/* Intersection highlight */}
                <div className="absolute z-10 text-center pointer-events-none flex flex-col items-center">
                    <div className="relative px-4 py-2 rounded-full backdrop-blur-xl border border-white/12"
                        style={{ background: 'rgba(0,0,0,0.35)' }}>
                        <span className="relative text-[10px] sm:text-xs font-semibold text-white/85 tracking-[0.08em]">
                            The Intersection
                        </span>
                    </div>
                    <div
                        className="w-5 h-5 sm:w-7 sm:h-7 mt-2 rounded-full blur-md"
                        style={{ backgroundColor: colorblindMode ? `${COLORS.overlap}66` : 'rgba(10,132,255,0.45)' }}
                    />
                </div>
            </div>

            {/* Concept titles below circles */}
            <div className="relative w-full flex justify-between items-start gap-4 mt-3 sm:mt-4 px-1">
                <ConceptCaption label={leftAsset.label} align="left" accentColor={COLORS.left} assetType={leftAsset?.type} />
                <ConceptCaption label={rightAsset.label} align="right" accentColor={COLORS.right} assetType={rightAsset?.type} />
            </div>
        </div>
    );
})

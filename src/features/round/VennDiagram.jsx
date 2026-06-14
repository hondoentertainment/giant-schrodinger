import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MEDIA_TYPES } from '../../data/themes';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// ── Responsive srcset helper ──
function buildSrcSet(baseUrl) {
    if (!baseUrl?.includes('unsplash.com')) return undefined;
    const id = baseUrl.match(/photo-([^?]+)/)?.[1];
    if (!id) return undefined;
    return [400, 640, 1080].map(w =>
        `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80 ${w}w`
    ).join(', ');
}

// ── Image circle ──
function VennImage({ asset }) {
    const [loaded, setLoaded] = useState(false);
    const [fallbackLevel, setFallbackLevel] = useState(0);
    // 0 = primary, 1 = fallback URL, 2 = gradient card

    const src = fallbackLevel === 0 ? asset.url : asset.fallbackUrl;

    const handleError = () => {
        if (fallbackLevel === 0 && asset.fallbackUrl) {
            setFallbackLevel(1);
        } else {
            setFallbackLevel(2);
        }
    };

    // Build tiny blur URL for Unsplash images
    const blurUrl = src?.includes('unsplash.com')
        ? src.replace(/w=\d+/, 'w=20') + '&blur=10'
        : null;

    if (fallbackLevel >= 2) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800 text-white text-2xl font-bold p-4 text-center">
                {asset.label || 'Mystery Concept'}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden w-full h-full">
            {/* Blur placeholder */}
            {blurUrl && !loaded && (
                <img src={blurUrl} alt="" aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm" />
            )}
            {/* Loading spinner when no blur available */}
            {!blurUrl && !loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
            )}
            {/* Full image */}
            <img
                src={src}
                srcSet={buildSrcSet(src)}
                sizes="(max-width: 640px) 400px, (max-width: 1024px) 640px, 1080px"
                alt={asset.label}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                onError={handleError}
                onLoad={() => setLoaded(true)}
                loading="eager"
                decoding="async"
            />
        </div>
    );
}

// ── Video circle ──
function VennVideo({ asset }) {
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
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse z-10">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                src={asset.url}
                poster={asset.posterUrl || ''}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loop
                muted={muted}
                playsInline
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
    return <VennImage asset={asset} />;
}

// ── Main Venn Diagram ──
export const VennDiagram = React.memo(function VennDiagram({ leftAsset, rightAsset }) {
    const mediaType = leftAsset?.type || MEDIA_TYPES.IMAGE;
    const isAudio = mediaType === MEDIA_TYPES.AUDIO;
    const colorblindMode = localStorage.getItem('venn_colorblind') === 'true';

    const COLORS = colorblindMode
        ? { left: '#0ea5e9', right: '#f97316', overlap: '#10b981' }  // Blue, Orange, Green
        : { left: '#a855f7', right: '#6366f1', overlap: '#8b5cf6' }; // Purple, Indigo, Violet

    return (
        <div className="relative w-full max-w-2xl mx-auto my-4 sm:my-8">
            {/* SVG pattern definitions for colorblind mode */}
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
            {/* Circles container */}
            <div className="relative w-full aspect-[2/1.1] flex justify-center items-center">
                {/* Left Circle */}
                <div className="absolute left-0 w-[54%] aspect-square rounded-full overflow-hidden z-[1] transition-transform hover:scale-105 duration-500 shadow-2xl shadow-blue-500/10"
                    style={{ border: `3px solid ${colorblindMode ? COLORS.left : 'rgba(255,255,255,0.15)'}` }}>
                    <VennMedia asset={leftAsset} />
                    {/* Gradient overlay for readability */}
                    <div className={`absolute inset-0 pointer-events-none ${isAudio ? 'bg-gradient-to-t from-purple-900/70 via-transparent to-transparent' : 'bg-gradient-to-t from-black/60 via-black/10 to-transparent'}`} />
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: colorblindMode
                            ? `linear-gradient(to right, ${COLORS.left}26, transparent)`
                            : isAudio ? 'linear-gradient(to right, rgba(168,85,247,0.15), transparent)' : 'linear-gradient(to right, rgba(59,130,246,0.15), transparent)'
                        }} />
                    {/* Colorblind pattern overlay */}
                    {colorblindMode && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden="true">
                            <rect width="100%" height="100%" fill="url(#pattern-left)" />
                        </svg>
                    )}
                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-10">
                        <span className="text-sm sm:text-lg md:text-xl font-black text-white uppercase tracking-wider drop-shadow-lg"
                            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0px 2px rgba(0,0,0,0.9)' }}>
                            {leftAsset.label}
                        </span>
                    </div>
                    {mediaType !== MEDIA_TYPES.IMAGE && (
                        <div className="absolute top-2.5 left-2.5 z-20">
                            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
                                {mediaType === MEDIA_TYPES.VIDEO ? 'Video' : 'Audio'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Circle */}
                <div className="absolute right-0 w-[54%] aspect-square rounded-full overflow-hidden z-[1] transition-transform hover:scale-105 duration-500 shadow-2xl shadow-pink-500/10"
                    style={{ border: `3px solid ${colorblindMode ? COLORS.right : 'rgba(255,255,255,0.15)'}` }}>
                    <VennMedia asset={rightAsset} />
                    {/* Gradient overlay for readability */}
                    <div className={`absolute inset-0 pointer-events-none ${isAudio ? 'bg-gradient-to-t from-fuchsia-900/70 via-transparent to-transparent' : 'bg-gradient-to-t from-black/60 via-black/10 to-transparent'}`} />
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: colorblindMode
                            ? `linear-gradient(to left, ${COLORS.right}26, transparent)`
                            : isAudio ? 'linear-gradient(to left, rgba(236,72,153,0.15), transparent)' : 'linear-gradient(to left, rgba(236,72,153,0.15), transparent)'
                        }} />
                    {/* Colorblind pattern overlay */}
                    {colorblindMode && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden="true">
                            <rect width="100%" height="100%" fill="url(#pattern-right)" />
                        </svg>
                    )}
                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-10 text-right">
                        <span className="text-sm sm:text-lg md:text-xl font-black text-white uppercase tracking-wider drop-shadow-lg"
                            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0px 2px rgba(0,0,0,0.9)' }}>
                            {rightAsset.label}
                        </span>
                    </div>
                    {mediaType !== MEDIA_TYPES.IMAGE && (
                        <div className="absolute top-2.5 right-2.5 z-20">
                            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
                                {mediaType === MEDIA_TYPES.VIDEO ? 'Video' : 'Audio'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Intersection Highlight - centered between circles */}
                <div className="absolute z-10 text-center pointer-events-none flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl animate-pulse" />
                        <span className="relative text-[10px] sm:text-xs font-medium text-white/70 tracking-[0.35em] uppercase"
                            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}>
                            The Intersection
                        </span>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 mt-1 rounded-full blur-xl animate-pulse"
                        style={{ backgroundColor: colorblindMode ? `${COLORS.overlap}33` : 'rgba(255,255,255,0.1)' }} />
                </div>
            </div>
        </div>
    );
})

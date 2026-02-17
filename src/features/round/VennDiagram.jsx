import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MEDIA_TYPES } from '../../data/themes';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// ── Image circle ──
function VennImage({ asset }) {
    const [loaded, setLoaded] = useState(false);

    const handleError = (event) => {
        const fallback = event.currentTarget.dataset.fallback;
        if (fallback && event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
            event.currentTarget.onerror = null;
        }
    };

    return (
        <>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
            )}
            <img
                src={asset.url}
                alt={asset.label}
                className={`w-full h-full object-cover brightness-110 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                data-fallback={asset.fallbackUrl}
                onError={handleError}
                onLoad={() => setLoaded(true)}
                loading="eager"
                decoding="async"
            />
        </>
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
                className={`w-full h-full object-cover brightness-110 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
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
export function VennDiagram({ leftAsset, rightAsset }) {
    const mediaType = leftAsset?.type || MEDIA_TYPES.IMAGE;
    const isAudio = mediaType === MEDIA_TYPES.AUDIO;

    return (
        <div className="relative w-full max-w-4xl aspect-[2/1] flex justify-center items-center my-8">
            {/* Left Circle */}
            <div className="absolute left-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <VennMedia asset={leftAsset} />
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-60 pointer-events-none ${isAudio ? 'from-purple-500/20' : ''}`} />
                <div className="absolute bottom-8 left-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md z-10">
                    {leftAsset.label}
                </div>
                {mediaType !== MEDIA_TYPES.IMAGE && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs font-bold text-white/70 uppercase tracking-wider border border-white/10">
                            {mediaType === MEDIA_TYPES.VIDEO ? 'Video' : 'Audio'}
                        </span>
                    </div>
                )}
            </div>

            {/* Right Circle */}
            <div className="absolute right-0 w-[55%] aspect-square rounded-full border-4 border-white/20 overflow-hidden z-0 transition-transform hover:scale-105 duration-500">
                <VennMedia asset={rightAsset} />
                <div className={`absolute inset-0 bg-gradient-to-l from-pink-500/20 to-transparent opacity-60 pointer-events-none ${isAudio ? 'from-fuchsia-500/20' : ''}`} />
                <div className="absolute bottom-8 right-8 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md z-10">
                    {rightAsset.label}
                </div>
                {mediaType !== MEDIA_TYPES.IMAGE && (
                    <div className="absolute top-3 right-3 z-20">
                        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs font-bold text-white/70 uppercase tracking-wider border border-white/10">
                            {mediaType === MEDIA_TYPES.VIDEO ? 'Video' : 'Audio'}
                        </span>
                    </div>
                )}
            </div>

            {/* Intersection Highlight */}
            <div className="absolute z-10 text-center pointer-events-none">
                <div className="text-xl font-light text-white/50 tracking-[0.5em] uppercase mb-2">
                    The Intersection
                </div>
                <div className="w-16 h-16 mx-auto rounded-full bg-white/20 blur-xl animate-pulse" />
            </div>
        </div>
    );
}

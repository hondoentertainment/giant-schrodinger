import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getCustomImages } from '../../services/customImages';
import { getStats, isThemeUnlocked } from '../../services/stats';
import { haptic } from '../../lib/haptics';

export function Round({ onSubmit }) {
    const { setGameState, user, roundNumber, totalRounds, currentModifier, isDailyChallenge } = useGame();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(60);
    const [showTimeUp, setShowTimeUp] = useState(false);
    const submittedRef = useRef(false);
    const stats = getStats();
    const rawTheme = getThemeById(user?.themeId);
    const theme = isThemeUnlocked(rawTheme?.id, stats)
        ? rawTheme
        : getThemeById(THEMES.find((t) => isThemeUnlocked(t.id, stats))?.id) || rawTheme;
    const baseTimeLimit = theme?.modifier?.timeLimit || 60;
    const timeLimit = Math.round(baseTimeLimit * (currentModifier?.timeFactor || 1));
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;
    const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
    const mod = currentModifier;

    useEffect(() => {
        submittedRef.current = false;
        let left, right;
        const customPool = getCustomImages();
        const useCustom = mediaType === MEDIA_TYPES.IMAGE && user?.useCustomImages && customPool.length >= 2;
        if (useCustom) {
            const shuffled = [...customPool].sort(() => Math.random() - 0.5);
            [left, right] = shuffled.slice(0, 2).map((img, i) => ({
                id: img.id,
                label: img.label,
                type: MEDIA_TYPES.IMAGE,
                url: img.url,
                fallbackUrl: img.url,
            }));
        } else {
            [left, right] = buildThemeAssets(theme, 2, mediaType);
        }
        [left, right].forEach((a) => {
            if (!a?.url) return;
            if (mediaType === MEDIA_TYPES.IMAGE) {
                const img = new Image();
                img.src = a.url;
            } else if (mediaType === MEDIA_TYPES.VIDEO) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = a.url;
                document.head.appendChild(link);
            } else if (mediaType === MEDIA_TYPES.AUDIO) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'audio';
                link.href = a.url;
                document.head.appendChild(link);
            }
        });
        setAssets({ left, right });
        setTimer(timeLimit);
    }, [user?.themeId, user?.useCustomImages, timeLimit, mediaType, roundNumber]);

    const handleSubmit = useCallback((e) => {
        if (e) e.preventDefault();
        if (submittedRef.current) return;
        submittedRef.current = true;
        haptic('success');

        if (onSubmit) {
            onSubmit({ submission, assets, modifier: mod });
            setGameState('REVEAL');
        }
    }, [submission, assets, mod, onSubmit, setGameState]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        } else if (!submittedRef.current && !showTimeUp) {
            setShowTimeUp(true);
        }
    }, [timer, showTimeUp]);

    useEffect(() => {
        if (!showTimeUp || submittedRef.current) return;
        const t = setTimeout(() => {
            handleSubmit();
            setShowTimeUp(false);
        }, 900);
        return () => clearTimeout(t);
    }, [showTimeUp, handleSubmit]);

    if (!assets.left || !assets.right) {
        return (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-500">
                <div className="w-full flex justify-between items-center px-8 mb-4">
                    <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                    <div className="h-12 w-16 bg-white/10 rounded-lg animate-pulse" />
                </div>
                <div className="w-full max-w-4xl aspect-[2/1] flex justify-center items-center my-8">
                    <div className="absolute left-0 w-[55%] aspect-square rounded-full border-4 border-white/20 bg-white/5 animate-pulse" />
                    <div className="absolute right-0 w-[55%] aspect-square rounded-full border-4 border-white/20 bg-white/5 animate-pulse" />
                </div>
                <div className="w-full max-w-xl mt-8 h-20 bg-white/10 rounded-full animate-pulse" />
            </div>
        );
    }

    const isSpecialRound = mod && mod.id !== 'normal';

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700">
            {/* Round modifier banner */}
            {isSpecialRound && (
                <div className={`w-full max-w-xl mb-4 animate-in slide-in-from-top-4 duration-500 ${
                    mod.id === 'showdown'
                        ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-500/30'
                        : mod.id === 'speed'
                        ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/30'
                        : 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30'
                } rounded-2xl border p-4 text-center`}>
                    <div className="text-3xl mb-1">{mod.icon}</div>
                    <div className="text-white font-bold text-lg">{mod.label}</div>
                    <div className="text-white/60 text-sm">{mod.description}</div>
                </div>
            )}

            <div className="w-full flex justify-between items-center px-8 mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-white/40">
                        {isDailyChallenge ? 'DAILY' : 'ROUND'} {roundNumber} / {totalRounds}
                    </div>
                </div>
                {showTimeUp ? (
                    <div className="text-4xl font-black font-display text-amber-400 animate-in zoom-in-95 duration-300" role="status" aria-live="polite">
                        Time&apos;s up!
                    </div>
                ) : (
                    <div className={`text-4xl font-black font-display ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timer}s
                    </div>
                )}
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
                <div className="rounded-full bg-white/10 px-3 py-1">
                    Time: <span className="text-white">{timeLimit}s</span>
                    {mod?.timeFactor !== 1 && <span className="text-cyan-400 ml-1">({mod.timeFactor}x)</span>}
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1">
                    Points: <span className="text-white">x{(scoreMultiplier * (mod?.scoreFactor || 1)).toFixed(1)}</span>
                    {mod?.scoreFactor > 1 && <span className="text-amber-400 ml-1">({mod.scoreFactor}x bonus)</span>}
                </div>
                {theme?.modifier?.hint && (
                    <div className="rounded-full bg-white/10 px-3 py-1">
                        {theme.modifier.hint}
                    </div>
                )}
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                <p className="text-center text-white/60 text-sm mb-3">
                    {mediaType === MEDIA_TYPES.AUDIO
                        ? 'One witty phrase that connects both sounds'
                        : mediaType === MEDIA_TYPES.VIDEO
                        ? 'One witty phrase that connects both clips'
                        : 'One witty phrase that connects both concepts'}
                </p>
                <input
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder={
                        mediaType === MEDIA_TYPES.AUDIO
                            ? 'What connects these two sounds?'
                            : mediaType === MEDIA_TYPES.VIDEO
                            ? 'What connects these two clips?'
                            : 'What connects these two?'
                    }
                    className="w-full bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-full px-8 py-6 text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-2xl"
                    autoFocus
                />
                <div className="mt-4 text-center text-white/40 text-sm space-y-1">
                    <div>Press <span className="font-bold text-white">Enter</span> to submit</div>
                    <div className="text-white/30 text-xs">
                        Scored on Wit · Logic · Originality · Clarity
                    </div>
                </div>
            </form>
        </div>
    );
}

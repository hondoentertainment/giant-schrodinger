import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getCustomImages } from '../../services/customImages';
import { getStats, isThemeUnlocked } from '../../services/stats';
import { getAIDifficulty, getDifficultyConfig } from '../../services/aiFeatures';
import { getRandomPairing } from '../../services/promptPacks';
import { haptic } from '../../lib/haptics';

export function Round({ onSubmit }) {
    const { setGameState, user, roundNumber, totalRounds, currentModifier, isDailyChallenge } = useGame();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(60);
    const [showTimeUp, setShowTimeUp] = useState(false);
    const [shakeInput, setShakeInput] = useState(false);
    const submittedRef = useRef(false);
    const stats = getStats();
    const rawTheme = getThemeById(user?.themeId);
    const theme = isThemeUnlocked(rawTheme?.id, stats)
        ? rawTheme
        : getThemeById(THEMES.find((t) => isThemeUnlocked(t.id, stats))?.id) || rawTheme;
    const baseTimeLimit = theme?.modifier?.timeLimit || 60;
    const difficultyConfig = getDifficultyConfig(getAIDifficulty());
    const timeLimit = Math.round(baseTimeLimit * (currentModifier?.timeFactor || 1)) + (difficultyConfig.timeBonus || 0);
    const scoreMultiplier = theme?.modifier?.scoreMultiplier || 1;
    const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
    const mod = currentModifier;

    useEffect(() => {
        submittedRef.current = false;
        let left, right;
        const selectedPackId = user?.promptPack || null;
        const packPairing = selectedPackId ? getRandomPairing(selectedPackId) : null;
        if (packPairing) {
            // Use concept pair from the selected prompt pack
            left = { id: `pack-left-${Date.now()}`, label: packPairing.left, type: 'text' };
            right = { id: `pack-right-${Date.now()}`, label: packPairing.right, type: 'text' };
        } else {
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

    const handleSubmit = useCallback((e, { forceEmpty = false } = {}) => {
        if (e) e.preventDefault();
        if (submittedRef.current) return;

        // Block empty submissions unless auto-submitted by timer
        if (!forceEmpty && !submission.trim()) {
            haptic('warning');
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), 600);
            return;
        }

        submittedRef.current = true;
        haptic('success');

        if (onSubmit) {
            onSubmit({ submission: submission.trim() || '(no answer)', assets, modifier: mod });
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
            if (!submittedRef.current) {
                handleSubmit(null, { forceEmpty: true });
            }
            setShowTimeUp(false);
        }, 900);
        return () => clearTimeout(t);
    }, [showTimeUp, handleSubmit]);

    if (!assets.left || !assets.right) {
        return (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-500 px-4">
                <div className="w-full flex justify-between items-center mb-3">
                    <div className="h-6 w-28 bg-white/10 rounded-lg animate-pulse" />
                    <div className="h-10 w-14 bg-white/10 rounded-lg animate-pulse" />
                </div>
                <div className="relative w-full max-w-2xl aspect-[2/1.1] flex justify-center items-center my-4">
                    <div className="absolute left-0 w-[54%] aspect-square rounded-full border-2 border-white/10 bg-white/5 animate-pulse" />
                    <div className="absolute right-0 w-[54%] aspect-square rounded-full border-2 border-white/10 bg-white/5 animate-pulse" />
                </div>
                <div className="w-full max-w-md mt-4 h-14 bg-white/10 rounded-full animate-pulse" />
            </div>
        );
    }

    const isSpecialRound = mod && mod.id !== 'normal';

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700 px-4">
            {/* Round modifier banner */}
            {isSpecialRound && (
                <div className={`w-full max-w-md mb-3 animate-in slide-in-from-top-4 duration-500 ${
                    mod.id === 'showdown'
                        ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-500/30'
                        : mod.id === 'speed'
                        ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/30'
                        : 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30'
                } rounded-2xl border p-3 text-center`}>
                    <div className="text-2xl mb-0.5">{mod.icon}</div>
                    <div className="text-white font-bold text-base">{mod.label}</div>
                    <div className="text-white/60 text-xs">{mod.description}</div>
                </div>
            )}

            {/* Header row - round info + timer */}
            <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.confirm('Quit this round? You\'ll return to the lobby.')) {
                                setGameState('LOBBY');
                            }
                        }}
                        className="text-white/30 hover:text-white/60 transition-colors text-xs"
                        aria-label="Quit round"
                    >
                        ← Quit
                    </button>
                    <div className="text-lg sm:text-xl font-bold text-white/40 tracking-wide">
                        {isDailyChallenge ? 'DAILY' : 'ROUND'} {roundNumber} / {totalRounds}
                    </div>
                </div>
                {showTimeUp ? (
                    <div className="text-2xl sm:text-3xl font-black font-display text-amber-400 animate-in zoom-in-95 duration-300" role="status" aria-live="polite">
                        Time&apos;s up!
                    </div>
                ) : (
                    <div className={`text-2xl sm:text-3xl font-black font-display tabular-nums ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timer}s
                    </div>
                )}
            </div>

            {/* Badges row */}
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
                <div className="rounded-full bg-white/10 px-2.5 py-0.5">
                    Time: <span className="text-white/80">{timeLimit}s</span>
                    {mod?.timeFactor !== 1 && <span className="text-cyan-400 ml-1">({mod.timeFactor}x)</span>}
                </div>
                <div className="rounded-full bg-white/10 px-2.5 py-0.5">
                    Points: <span className="text-white/80">x{(scoreMultiplier * (mod?.scoreFactor || 1)).toFixed(1)}</span>
                    {mod?.scoreFactor > 1 && <span className="text-amber-400 ml-1">({mod.scoreFactor}x)</span>}
                </div>
                {theme?.modifier?.hint && (
                    <div className="rounded-full bg-white/10 px-2.5 py-0.5 hidden sm:block">
                        {theme.modifier.hint}
                    </div>
                )}
            </div>

            {/* Venn Diagram */}
            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            {/* Input form */}
            <form onSubmit={handleSubmit} className="w-full max-w-md mt-2 sm:mt-4 relative z-20">
                <p className="text-center text-white/50 text-xs sm:text-sm mb-2">
                    {mediaType === MEDIA_TYPES.AUDIO
                        ? 'One witty phrase that connects both sounds'
                        : mediaType === MEDIA_TYPES.VIDEO
                        ? 'One witty phrase that connects both clips'
                        : 'One witty phrase that connects both concepts'}
                </p>
                <div className="relative">
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
                        className={`w-full bg-black/40 backdrop-blur-xl border-2 rounded-full px-5 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-2xl ${
                            shakeInput ? 'border-red-500/60 animate-[shake_0.5s_ease-in-out]' : 'border-white/20'
                        }`}
                        autoFocus
                        maxLength={200}
                    />
                </div>
                {submission.trim() && (
                    <button
                        type="submit"
                        className="mt-3 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition-all sm:hidden active:scale-95"
                    >
                        Submit
                    </button>
                )}
                <div className="mt-3 text-center text-white/35 text-xs space-y-0.5">
                    <div className="hidden sm:block">Press <span className="font-bold text-white/60">Enter</span> to submit</div>
                    <div className="text-white/25 text-[10px]">
                        Scored on Wit · Logic · Originality · Clarity
                    </div>
                </div>
            </form>
        </div>
    );
}

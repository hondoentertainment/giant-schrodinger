import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getCustomImages } from '../../services/customImages';
import { getStats, isThemeUnlocked } from '../../services/stats';
import { getAIDifficulty, getDifficultyConfig } from '../../services/aiFeatures';
import { haptic } from '../../lib/haptics';
import { TIMINGS } from '../../lib/timings';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { validateSubmission } from '../../lib/validation';

export function Round({ onSubmit }) {
    const {
        setGameState, user, roundNumber, totalRounds, currentModifier, isDailyChallenge,
        trackUsedAssets, getUsedAssetIds,
    } = useGame();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [showTimeUp, setShowTimeUp] = useState(false);
    const [shakeInput, setShakeInput] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
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
    const rawMediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
    const mod = currentModifier;

    const handleTimeUp = useCallback(() => {
        setShowTimeUp(true);
    }, []);

    const { displayTime, roundPhase, countdown, reset: resetTimer } = useRoundTimer({
        timeLimit,
        onTimeUp: handleTimeUp,
        enabled: true,
    });

    // Resolve 'mixed' to a concrete media type per round
    const [resolvedMediaType, setResolvedMediaType] = useState(rawMediaType);
    useEffect(() => {
        if (rawMediaType === 'mixed') {
            const types = [MEDIA_TYPES.IMAGE, MEDIA_TYPES.VIDEO, MEDIA_TYPES.AUDIO];
            setResolvedMediaType(types[Math.floor(Math.random() * types.length)]);
        } else {
            setResolvedMediaType(rawMediaType);
        }
    }, [rawMediaType, roundNumber]);

    const mediaType = resolvedMediaType;

    // Asset selection: build assets, filter out used ones, track new ones
    useEffect(() => {
        submittedRef.current = false;
        resetTimer();
        let left, right;
        const usedIds = getUsedAssetIds ? getUsedAssetIds() : [];
        const customPool = getCustomImages();
        const useCustom = mediaType === MEDIA_TYPES.IMAGE && user?.useCustomImages && customPool.length >= 2;
        if (useCustom) {
            const available = customPool.filter((img) => !usedIds.includes(img.id));
            const pool = available.length >= 2 ? available : customPool;
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            [left, right] = shuffled.slice(0, 2).map((img) => ({
                id: img.id,
                label: img.label,
                type: MEDIA_TYPES.IMAGE,
                url: img.url,
                fallbackUrl: img.url,
            }));
        } else {
            // Build more assets than needed so we can filter out used ones
            const candidates = buildThemeAssets(theme, Math.max(6, usedIds.length + 4), mediaType);
            const filtered = candidates.filter((a) => !usedIds.includes(a.id));
            // If filtering leaves fewer than 2, fall back to unfiltered
            const pool = filtered.length >= 2 ? filtered : candidates;
            [left, right] = pool.slice(0, 2);
        }
        // Track newly selected assets
        if (trackUsedAssets) {
            trackUsedAssets([left, right]);
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
    }, [user?.themeId, user?.useCustomImages, timeLimit, mediaType, roundNumber, resetTimer]);

    const handleSubmit = useCallback((e, { forceEmpty = false } = {}) => {
        if (e) e.preventDefault();
        if (submittedRef.current) return;

        // Block empty submissions unless auto-submitted by timer
        if (!forceEmpty && !submission.trim()) {
            haptic('warning');
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), TIMINGS.SHAKE_ANIMATION);
            return;
        }

        // Validate the submission text
        if (!forceEmpty) {
            const result = validateSubmission(submission);
            if (!result.valid) {
                haptic('warning');
                setShakeInput(true);
                setTimeout(() => setShakeInput(false), TIMINGS.SHAKE_ANIMATION);
                return;
            }
        }

        submittedRef.current = true;
        haptic('success');

        if (onSubmit) {
            onSubmit({ submission: submission.trim() || '(no answer)', assets, modifier: mod });
            setGameState('REVEAL');
        }
    }, [submission, assets, mod, onSubmit, setGameState]);

    // Task 3: Faster auto-submit (400ms instead of 900ms)
    useEffect(() => {
        if (!showTimeUp || submittedRef.current) return;
        const t = setTimeout(() => {
            if (!submittedRef.current) {
                handleSubmit(null, { forceEmpty: true });
            }
            setShowTimeUp(false);
        }, 400);
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
            {/* Task 5: Get Ready countdown overlay */}
            {roundPhase === 'ready' && (
                <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                    {/* Concept preview labels */}
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-white/80 text-lg">{assets?.left?.label}</span>
                        <span className="text-white/40">&times;</span>
                        <span className="text-white/80 text-lg">{assets?.right?.label}</span>
                    </div>
                    {/* Task 6: Modifier badge preview during countdown */}
                    {mod && mod.id !== 'normal' && (
                        <div className="mb-4 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-bold">
                            {mod.id === 'speed' && 'SPEED ROUND — Half time, 1.5x points!'}
                            {mod.id === 'doubleOrNothing' && 'DOUBLE OR NOTHING — Score 7+ to keep your points!'}
                            {mod.id === 'showdown' && 'FINAL SHOWDOWN — 2x points, reduced time!'}
                        </div>
                    )}
                    {/* Countdown number */}
                    <div className="text-8xl font-bold text-white animate-pulse">
                        {countdown > 0 ? countdown : 'GO!'}
                    </div>
                </div>
            )}

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
                    {/* Task 4: Quit confirmation */}
                    <button
                        onClick={() => setShowQuitConfirm(true)}
                        className="text-white/30 hover:text-white/60 transition-colors text-xs"
                        aria-label="Quit round"
                    >
                        &larr; Quit
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
                    <div className={`text-2xl sm:text-3xl font-black font-display tabular-nums ${displayTime < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`} aria-live="assertive" aria-atomic="true" role="timer">
                        {displayTime}s
                    </div>
                )}
            </div>

            {/* Badges row */}
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50" aria-live="polite">
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
                <label htmlFor="submission-input" className="sr-only">Your connection phrase</label>
                <p id="submission-help" className="text-center text-white/50 text-xs sm:text-sm mb-2">
                    {mediaType === MEDIA_TYPES.AUDIO
                        ? 'One witty phrase that connects both sounds'
                        : mediaType === MEDIA_TYPES.VIDEO
                        ? 'One witty phrase that connects both clips'
                        : 'One witty phrase that connects both concepts'}
                </p>
                <div className="relative">
                    <input
                        id="submission-input"
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        aria-describedby="submission-help"
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

            {/* Task 4: Quit confirmation modal */}
            {showQuitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm mx-4 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Quit Session?</h3>
                        <p className="text-white/60 mb-6">
                            You&apos;ll lose progress on rounds {roundNumber}&ndash;{totalRounds}.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
                            >
                                Keep Playing
                            </button>
                            <button
                                onClick={() => { setShowQuitConfirm(false); setGameState('LOBBY'); }}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            >
                                Quit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

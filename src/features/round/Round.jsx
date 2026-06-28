import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VennDiagram } from './VennDiagram';
import { useGame } from '../../context/GameContext';
import { THEMES, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { selectRoundAssets, loadSelectedAssets } from '../../services/assetSelection';
import { getDailyChallenge } from '../../services/dailyChallenge';
import { getEffectiveRoundMediaType, normalizeMediaType } from '../../lib/mediaType';
import { getStats, isThemeUnlocked } from '../../services/stats';
import { haptic } from '../../lib/haptics';
import { trackEvent } from '../../services/analytics';

export function Round({ onSubmit }) {
    const { setGameState, user, roundNumber, totalRounds, currentModifier, isDailyChallenge, trackUsedAssets, getUsedAssetIds } = useGame();
    const [assets, setAssets] = useState({ left: null, right: null });
    const [mediaLoading, setMediaLoading] = useState(true);
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
    const mediaType = normalizeMediaType(user?.mediaType);
    const mod = currentModifier;
    const showFirstRoundCoaching = stats.totalRounds === 0 && roundNumber === 1;
    const dailyChallenge = isDailyChallenge ? getDailyChallenge() : null;
    const roundMediaType = getEffectiveRoundMediaType({
        userMediaType: mediaType,
        isDailyChallenge,
        dailyChallenge,
    });

    useEffect(() => {
        submittedRef.current = false;
        let cancelled = false;

        async function loadAssets() {
            setMediaLoading(true);
            const daily = isDailyChallenge ? getDailyChallenge() : null;
            const effectiveMediaType = getEffectiveRoundMediaType({
                userMediaType: mediaType,
                isDailyChallenge,
                dailyChallenge: daily,
            });

            const [left, right] = selectRoundAssets({
                theme,
                mediaType: effectiveMediaType,
                excludeIds: getUsedAssetIds(),
                seed: daily?.seed,
                roundNumber,
                useCustomImages: user?.useCustomImages,
                isDailyChallenge,
            });

            trackUsedAssets([left, right]);
            if (!cancelled) {
                setAssets({ left, right });
                setTimer(timeLimit);
            }

            const resolved = await loadSelectedAssets([left, right]);
            if (cancelled) return;

            trackUsedAssets(resolved);
            setAssets({ left: resolved[0], right: resolved[1] });
            setMediaLoading(false);
        }

        loadAssets();

        return () => {
            cancelled = true;
        };
    }, [user?.themeId, user?.useCustomImages, timeLimit, mediaType, roundNumber, isDailyChallenge, theme?.id]);

    const handleSubmit = useCallback((e) => {
        if (e) e.preventDefault();
        if (submittedRef.current) return;
        submittedRef.current = true;
        haptic('success');
        if (stats.totalRounds === 0 && roundNumber === 1) {
            trackEvent('first_session_round_submitted', {
                hasSubmission: Boolean(submission.trim()),
                mediaType,
                themeId: theme?.id || null,
            });
        }

        if (onSubmit) {
            onSubmit({ submission, assets, modifier: mod });
            setGameState('REVEAL');
        }
    }, [submission, assets, mod, onSubmit, setGameState, stats.totalRounds, roundNumber, mediaType, theme?.id]);

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

            <div className="w-full max-w-2xl flex flex-col gap-4 px-2 mb-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="game-section-label">
                            {isDailyChallenge ? 'Daily puzzle' : 'Puzzle run'}
                        </div>
                        <div className="text-xl font-bold tracking-tight text-white">
                            Round {roundNumber} of {totalRounds}
                        </div>
                    </div>
                    {showTimeUp ? (
                        <div className="game-timer game-timer--urgent min-w-[92px] text-sm" role="status" aria-live="polite">
                            Time&apos;s up
                        </div>
                    ) : (
                        <div className={`game-timer ${timer < 10 ? 'game-timer--urgent' : ''}`}>
                            {timer}s
                        </div>
                    )}
                </div>
                <div className="flex gap-2" aria-label={`Round progress: ${roundNumber} of ${totalRounds}`}>
                    {Array.from({ length: totalRounds }).map((_, index) => (
                        <div
                            key={index}
                            className={`game-progress-dot ${
                                index + 1 < roundNumber
                                    ? 'game-progress-dot--done'
                                    : index + 1 === roundNumber
                                    ? 'game-progress-dot--current'
                                    : ''
                            }`}
                            aria-label={`Round ${index + 1}${index + 1 === roundNumber ? ', current' : index + 1 < roundNumber ? ', completed' : ''}`}
                        />
                    ))}
                </div>
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                <div className="game-hud-chip">
                    Time: <span className="text-white font-medium">{timeLimit}s</span>
                    {mod?.timeFactor !== 1 && <span className="text-cyan-300 ml-1">({mod.timeFactor}x)</span>}
                </div>
                <div className="game-hud-chip">
                    Points: <span className="text-white font-medium">x{(scoreMultiplier * (mod?.scoreFactor || 1)).toFixed(1)}</span>
                    {mod?.scoreFactor > 1 && <span className="text-amber-300 ml-1">({mod.scoreFactor}x bonus)</span>}
                </div>
                {theme?.modifier?.hint && (
                    <div className="game-hud-chip">
                        {theme.modifier.hint}
                    </div>
                )}
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} mediaLoading={mediaLoading} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                {showFirstRoundCoaching && (
                    <div className="mb-4 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-white font-semibold">First round tip</p>
                        <p className="text-white/55 text-sm mt-1">
                            {roundMediaType === MEDIA_TYPES.MEMES_VIDEOS
                                ? 'Connect the vibe, not just the visuals — a meme and a clip can share energy even when they look unrelated.'
                                : 'Aim for a phrase that works for both prompts and has a little surprise. Specific beats generic.'}
                        </p>
                    </div>
                )}
                <p className="text-center text-white/50 text-sm mb-3">
                    {roundMediaType === MEDIA_TYPES.AUDIO
                        ? 'One witty phrase that connects both sounds'
                        : roundMediaType === MEDIA_TYPES.VIDEO
                        ? 'One witty phrase that connects both clips'
                        : roundMediaType === MEDIA_TYPES.MEMES_VIDEOS
                        ? 'One witty phrase that connects the meme and the video'
                        : 'One witty phrase that connects both concepts'}
                </p>
                <input
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder={
                        roundMediaType === MEDIA_TYPES.AUDIO
                            ? 'What connects these two sounds?'
                            : roundMediaType === MEDIA_TYPES.VIDEO
                            ? 'What connects these two clips?'
                            : roundMediaType === MEDIA_TYPES.MEMES_VIDEOS
                            ? 'What connects this meme and video?'
                            : 'What connects these two?'
                    }
                    className="game-input-hero w-full"
                    autoFocus
                />
                <div className="mt-4 text-center text-white/40 text-sm space-y-3">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!submission.trim()}
                        className="wordle-button wordle-primary w-full min-h-[52px] text-lg disabled:opacity-50 sm:hidden"
                    >
                        Submit connection
                    </button>
                    <div>Press <span className="font-semibold text-white/80">Return</span> to submit</div>
                    <div className="text-white/30 text-xs">
                        Scored on Wit · Logic · Originality · Clarity
                    </div>
                </div>
            </form>
        </div>
    );
}

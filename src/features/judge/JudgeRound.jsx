import React, { useState, useEffect, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useToast } from '../../context/ToastContext';
import { saveJudgement } from '../../services/judgements';
import { saveJudgementToBackend, getSharedRound } from '../../services/backend';
import { clearJudgeFromUrl } from '../../services/share';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useResolvedRoundAssets } from '../../hooks/useResolvedRoundAssets';
import { haptic } from '../../lib/haptics';
import { playSubmitSound } from '../../services/sounds';
import { setForcedPair } from '../../lib/forcedPair';
import { trackEvent } from '../../services/analytics';

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function JudgeRound({ payload, onDone }) {
    const { toast } = useToast();
    const [score, setScore] = useState(null);
    const [commentary, setCommentary] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [resolvedPayload, setResolvedPayload] = useState(payload?.backendId ? null : payload);
    const [loading, setLoading] = useState(!!payload?.backendId);
    const [error, setError] = useState(null);
    const [errorType, setErrorType] = useState(null);
    const [judgeName, setJudgeName] = useState('');
    const formRef = useRef(null);
    const effectivePayload = resolvedPayload || payload;
    const hasValidPayload = effectivePayload?.assets?.left && effectivePayload?.assets?.right && effectivePayload?.submission;
    const { assets: displayAssets, mediaLoading } = useResolvedRoundAssets(
        hasValidPayload ? effectivePayload.assets : null,
    );
    useFocusTrap(!loading && !error && hasValidPayload && !submitted, formRef);

    useEffect(() => {
        if (!hasValidPayload) return;
        trackEvent('friend_judge_opened', {
            hasBackendId: Boolean(payload?.backendId),
        });
    }, [hasValidPayload, payload?.backendId]);

    useEffect(() => {
        if (!payload?.backendId) return;
        let cancelled = false;
        getSharedRound(payload.backendId)
            .then((data) => {
                if (!cancelled) {
                    setResolvedPayload(data);
                    if (!data) {
                        setError('Round not found');
                        setErrorType('not_found');
                        toast.error('Could not load this round - it may have expired');
                    }
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load round');
                    setErrorType('network');
                    toast.error('Failed to load round - check your connection');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [payload?.backendId, toast]);

    useEffect(() => {
        if (submitted) return undefined;
        const onKey = (event) => {
            if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.tagName === 'SELECT') {
                return;
            }
            const digit = Number(event.key);
            if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
                setScore(digit);
            } else if (event.key === '0') {
                setScore(10);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [submitted]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-game-accent border-white/10 animate-spin mb-4" />
                <p className="text-white/60">Loading round...</p>
            </div>
        );
    }

    if (error || !hasValidPayload) {
        const errorMessage =
            errorType === 'not_found'
                ? 'This judging link has expired or the round was removed. Ask your friend to share a fresh link.'
                : errorType === 'network'
                ? 'Couldn\'t load the round - check your internet connection and try again.'
                : 'This link is invalid or malformed. Make sure you copied the full URL from your friend.';
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md px-4">
                <div className="text-6xl mb-4" role="img" aria-hidden="true">🔗</div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Can&apos;t load this round</h2>
                <p className="text-white/60 mb-6">{errorMessage}</p>
                <button
                    onClick={() => { clearJudgeFromUrl(); onDone?.(); }}
                    className="wordle-button wordle-primary"
                >
                    Play Venn
                </button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const scoreValue = Number(score);
        if (!Number.isFinite(scoreValue) || scoreValue < 1 || scoreValue > 10) {
            toast.warn('Pick a score from 1 to 10');
            return;
        }

        const judgement = {
            score: scoreValue,
            relevance: 'Highly Logical',
            commentary: commentary.trim() || 'No comment provided.',
            judgeName: judgeName.trim() || 'A friend',
        };

        const roundId = effectivePayload.id || effectivePayload.roundId || effectivePayload.backendId || `judge-${Date.now()}`;
        const collisionId = effectivePayload.collisionId || null;
        const backendId = effectivePayload.backendId || effectivePayload.id || null;

        saveJudgement({
            roundId,
            collisionId,
            backendId,
            judgeMode: effectivePayload.judgeMode || 'friend',
            judgement,
        });

        if (backendId) {
            const saved = await saveJudgementToBackend(backendId, judgement);
            if (!saved) {
                toast.warn('Judgement saved locally - backend sync failed');
            }
        }

        haptic('success');
        playSubmitSound();
        toast.success('Judgement submitted!');
        trackEvent('friend_judge_scored', { score: scoreValue });
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500 px-4">
                <div className="text-6xl mb-4" role="img" aria-label="Success">✓</div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Thanks for judging!</h2>
                <p className="text-white/60 mb-4 max-w-sm">
                    Your friend will see your {score}/10. Here is the pair if you want a turn.
                </p>
                <div className="w-full max-w-xl mb-4">
                    <VennDiagram
                        leftAsset={displayAssets?.left || effectivePayload.assets.left}
                        rightAsset={displayAssets?.right || effectivePayload.assets.right}
                        mediaLoading={mediaLoading}
                    />
                </div>
                <p className="text-white/70 text-sm mb-6 max-w-md">
                    They wrote “{effectivePayload.submission}”. Your line can be better — or weirder.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <button
                        type="button"
                        className="wordle-button wordle-primary flex-1 min-h-[48px]"
                        onClick={() => {
                            setForcedPair(effectivePayload.assets);
                            trackEvent('friend_judge_played', { samePair: true });
                            clearJudgeFromUrl();
                            onDone?.({ playPair: true });
                        }}
                    >
                        Your turn — play this pair
                    </button>
                    <button
                        type="button"
                        className="wordle-button flex-1 min-h-[48px]"
                        onClick={() => {
                            clearJudgeFromUrl();
                            onDone?.();
                        }}
                    >
                        Play today&apos;s Venn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={formRef} className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
            <div className="wordle-card p-6 sm:p-8 w-full max-w-xl mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white mb-1">Judge a Friend&apos;s Connection</h2>
                <p className="text-white/60 text-sm">
                    {effectivePayload.shareFrom || 'A friend'} wrote one line. Give it a 1–10.
                </p>
            </div>

            <VennDiagram
                leftAsset={displayAssets?.left || effectivePayload.assets.left}
                rightAsset={displayAssets?.right || effectivePayload.assets.right}
                mediaLoading={mediaLoading}
            />

            {effectivePayload.imageUrl && (
                <div className="w-full max-w-xl mt-6 rounded-[22px] overflow-hidden border border-white/10 wordle-card !p-0 relative">
                    <img
                        src={effectivePayload.imageUrl}
                        alt="Fusion created from this connection"
                        className="w-full max-h-80 object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            )}

            <div className="w-full max-w-xl mt-8 mb-6 wordle-card p-6">
                <div className="game-section-label mb-2">Their answer</div>
                <p className="text-2xl font-bold text-white">&ldquo;{effectivePayload.submission}&rdquo;</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-xl wordle-card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Your name (optional)</label>
                    <input
                        type="text"
                        value={judgeName}
                        onChange={(e) => setJudgeName(e.target.value)}
                        className="game-input"
                        placeholder="A friend"
                        maxLength={20}
                    />
                </div>
                <div>
                    <div className="block text-sm font-medium text-white/60 mb-2" id="judge-score-label">
                        Score (1-10)
                    </div>
                    <div
                        className="grid grid-cols-5 gap-2"
                        role="group"
                        aria-labelledby="judge-score-label"
                    >
                        {SCORE_OPTIONS.map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setScore(value)}
                                aria-pressed={score === value}
                                className={`game-choice min-h-[44px] py-2 text-sm font-bold tabular-nums ${
                                    score === value ? 'game-choice-selected' : ''
                                }`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                    <p className="text-white/35 text-xs mt-2">Tip: press 1–9 or 0 for 10.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">One line (optional)</label>
                    <textarea
                        value={commentary}
                        onChange={(e) => setCommentary(e.target.value)}
                        rows="3"
                        className="game-input resize-none min-h-[96px]"
                        placeholder="Share your verdict, or skip and submit"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!score}
                    className="wordle-button wordle-primary w-full text-lg disabled:opacity-50"
                >
                    Submit Judgement
                </button>
            </form>
        </div>
    );
}

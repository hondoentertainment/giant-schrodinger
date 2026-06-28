import React, { useState, useEffect, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useToast } from '../../context/ToastContext';
import { saveJudgement } from '../../services/judgements';
import { saveJudgementToBackend, getSharedRound } from '../../services/backend';
import { clearJudgeFromUrl } from '../../services/share';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useResolvedRoundAssets } from '../../hooks/useResolvedRoundAssets';

export function JudgeRound({ payload, onDone }) {
    const { toast } = useToast();
    const [score, setScore] = useState('');
    const [relevance, setRelevance] = useState('Highly Logical');
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
                <div className="text-6xl mb-4" role="img" aria-hidden="true">??</div>
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
        if (!Number.isFinite(scoreValue) || scoreValue < 1 || scoreValue > 10) return;

        const judgement = {
            score: scoreValue,
            relevance,
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

        toast.success('Judgement submitted!');
        setSubmitted(true);
        setTimeout(() => {
            clearJudgeFromUrl();
            onDone?.();
        }, 2000);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500">
                <div className="text-6xl mb-4">?</div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Thanks for judging!</h2>
                <p className="text-white/60">Your friend will see your score. Redirecting...</p>
            </div>
        );
    }

    return (
        <div ref={formRef} className="w-full max-w-4xl flex flex-col items-center animate-spring-in">
            <div className="wordle-card p-6 sm:p-8 w-full max-w-xl mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white mb-1">Judge a Friend&apos;s Connection</h2>
                <p className="text-white/60 text-sm">
                    {effectivePayload.shareFrom || 'A friend'} made a Venn connection. Score the answer for wit, logic, originality, and clarity.
                </p>
                <p className="text-white/40 text-xs mt-2">
                    Be generous when it is clever, be honest when it is generic. Your feedback helps make the next round better.
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
                    <label className="block text-sm font-medium text-white/60 mb-2">Score (1-10)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="game-input"
                        placeholder="10"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Relevance</label>
                    <select
                        value={relevance}
                        onChange={(e) => setRelevance(e.target.value)}
                        className="game-input"
                    >
                        <option value="Highly Logical">Highly Logical</option>
                        <option value="Absurdly Creative">Absurdly Creative</option>
                        <option value="Wild Card">Wild Card</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Commentary</label>
                    <textarea
                        value={commentary}
                        onChange={(e) => setCommentary(e.target.value)}
                        rows="3"
                        className="game-input resize-none min-h-[96px]"
                        placeholder="Share your verdict..."
                    />
                </div>
                <button
                    type="submit"
                    className="wordle-button wordle-primary w-full text-lg"
                >
                    Submit Judgement
                </button>
            </form>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useToast } from '../../context/ToastContext';
import { saveJudgement } from '../../services/judgements';
import { saveJudgementToBackend, getSharedRound } from '../../services/backend';
import { clearJudgeFromUrl } from '../../services/share';

export function JudgeRound({ payload, onDone }) {
    const { toast } = useToast();
    const [score, setScore] = useState('');
    const [relevance, setRelevance] = useState('Highly Logical');
    const [commentary, setCommentary] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [resolvedPayload, setResolvedPayload] = useState(payload?.backendId ? null : payload);
    const [loading, setLoading] = useState(!!payload?.backendId);
    const [error, setError] = useState(null);
    const [judgeName, setJudgeName] = useState('');

    useEffect(() => {
        if (!payload?.backendId) return;
        let cancelled = false;
        getSharedRound(payload.backendId)
            .then((data) => {
                if (!cancelled) {
                    setResolvedPayload(data);
                    if (!data) {
                        setError('Round not found');
                        toast.error('Could not load this round — it may have expired');
                    }
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load round');
                    toast.error('Failed to load round — check your connection');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [payload?.backendId]);

    const effectivePayload = resolvedPayload || payload;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-4" />
                <p className="text-white/60">Loading round...</p>
            </div>
        );
    }

    if (error || !effectivePayload?.assets?.left || !effectivePayload?.assets?.right || !effectivePayload?.submission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-white/60 text-xl">Invalid or expired judge link.</p>
                <button
                    onClick={() => { clearJudgeFromUrl(); onDone?.(); }}
                    className="mt-6 px-8 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30"
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

        const roundId = effectivePayload.id || effectivePayload.backendId || effectivePayload.roundId || `judge-${Date.now()}`;
        saveJudgement(roundId, judgement);

        if (effectivePayload.id || effectivePayload.backendId) {
            const saved = await saveJudgementToBackend(roundId, judgement);
            if (!saved) {
                toast.warn('Judgement saved locally — backend sync failed');
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
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Thanks for judging!</h2>
                <p className="text-white/60">Your friend will see your score. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white mb-1">Judge a Friend&apos;s Connection</h2>
                <p className="text-white/60 text-sm">Score their connection — they&apos;ll see your feedback in their gallery.</p>
            </div>

            <VennDiagram leftAsset={effectivePayload.assets.left} rightAsset={effectivePayload.assets.right} />

            <div className="w-full max-w-xl mt-8 mb-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-white/50 text-sm uppercase tracking-wider mb-2">Their answer</div>
                <p className="text-2xl font-bold text-white">&ldquo;{effectivePayload.submission}&rdquo;</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Your name (optional)</label>
                    <input
                        type="text"
                        value={judgeName}
                        onChange={(e) => setJudgeName(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="A friend"
                        maxLength={20}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Score (1–10)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="10"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Relevance</label>
                    <select
                        value={relevance}
                        onChange={(e) => setRelevance(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Share your verdict..."
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-[1.01] transition-transform"
                >
                    Submit Judgement
                </button>
            </form>
        </div>
    );
}

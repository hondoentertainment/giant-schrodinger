import React, { useState, useEffect, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useToast } from '../../context/ToastContext';
import { saveJudgement } from '../../services/judgements';
import { saveJudgementToBackend, getSharedRound } from '../../services/backend';
import { clearJudgeFromUrl } from '../../services/share';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { JudgeCalibration } from './JudgeCalibration';

export function JudgeRound({ payload, onDone }) {
    const { toast } = useToast();
    const [score, setScore] = useState('');
    const [relevance, setRelevance] = useState('Highly Logical');
    const [commentary, setCommentary] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [resolvedPayload, setResolvedPayload] = useState(payload?.backendId ? null : payload);
    const [loading, setLoading] = useState(!!payload?.backendId);
    const [error, setError] = useState(null);
    const [errorType, setErrorType] = useState(null); // 'not_found' | 'network' | 'invalid'
    const [judgeName, setJudgeName] = useState('');
    const [showDetailedForm, setShowDetailedForm] = useState(false);
    const [isCalibrated, setIsCalibrated] = useState(
        () => localStorage.getItem('venn_judge_calibrated') === 'true'
    );
    const formRef = useRef(null);
    const effectivePayload = resolvedPayload || payload;
    const hasValidPayload = effectivePayload?.assets?.left && effectivePayload?.assets?.right && effectivePayload?.submission;
    useFocusTrap(!loading && !error && hasValidPayload && !submitted && isCalibrated, formRef);

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
                        toast.error('Could not load this round — it may have expired');
                    }
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load round');
                    setErrorType('network');
                    toast.error('Failed to load round — check your connection');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [payload?.backendId]);

    if (!isCalibrated) {
        return <JudgeCalibration onComplete={() => setIsCalibrated(true)} />;
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-4" />
                <p className="text-white/60">Loading round...</p>
            </div>
        );
    }

    if (error || !hasValidPayload) {
        const errorMessage =
            errorType === 'not_found'
                ? 'This judging link has expired or the round was removed. Ask your friend to share a fresh link.'
                : errorType === 'network'
                ? 'Couldn\'t load the round — check your internet connection and try again.'
                : 'This link is invalid or malformed. Make sure you copied the full URL from your friend.';
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md px-4">
                <div className="text-6xl mb-4" role="img" aria-hidden="true">🔗</div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Can&apos;t load this round</h2>
                <p className="text-white/60 mb-6">{errorMessage}</p>
                <button
                    onClick={() => { clearJudgeFromUrl(); onDone?.(); }}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
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

    const handleQuickScore = (quickScore) => {
        const judgement = {
            score: quickScore,
            relevance: quickScore >= 9 ? 'Absurdly Creative' : quickScore >= 7 ? 'Highly Logical' : 'Wild Card',
            commentary: quickScore >= 9 ? 'Absolutely fire!' : quickScore >= 7 ? 'Solid connection.' : 'Interesting take.',
            judgeName: judgeName.trim() || 'A friend',
        };
        const roundId = effectivePayload.id || effectivePayload.backendId || effectivePayload.roundId || `judge-${Date.now()}`;
        saveJudgement(roundId, judgement);
        if (effectivePayload.id || effectivePayload.backendId) {
            saveJudgementToBackend(roundId, judgement);
        }
        toast.success('Judgement submitted!');
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Thanks for judging!</h2>
                <p className="text-white/60 mb-6">Your friend will see your score.</p>
                <button
                    onClick={() => { clearJudgeFromUrl(); onDone?.(); }}
                    className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                    Play Venn with Friends!
                </button>
                <p className="text-white/40 text-sm mt-3">Try connecting concepts yourself</p>
            </div>
        );
    }

    return (
        <div ref={formRef} className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white mb-1">Judge a Friend&apos;s Connection</h2>
                <p className="text-white/60 text-sm">Score their connection — they&apos;ll see your feedback in their gallery.</p>
                {isCalibrated && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                        &#127891; Certified Judge
                    </span>
                )}
            </div>

            <VennDiagram leftAsset={effectivePayload.assets.left} rightAsset={effectivePayload.assets.right} />

            <div className="w-full max-w-xl mt-8 mb-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-white/50 text-sm uppercase tracking-wider mb-2">Their answer</div>
                <p className="text-2xl font-bold text-white">&ldquo;{effectivePayload.submission}&rdquo;</p>
            </div>

            {/* Quick Judge Buttons */}
            <div className="w-full max-w-xl mb-6">
                <div className="text-white/50 text-xs uppercase tracking-wider mb-3 text-center">Quick Score</div>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => handleQuickScore(10)}
                        className="py-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all hover:scale-105 active:scale-95 text-center"
                    >
                        <div className="text-3xl mb-1">🔥</div>
                        <div className="text-amber-300 font-bold">Fire</div>
                        <div className="text-white/40 text-xs">9-10</div>
                    </button>
                    <button
                        onClick={() => handleQuickScore(8)}
                        className="py-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all hover:scale-105 active:scale-95 text-center"
                    >
                        <div className="text-3xl mb-1">👍</div>
                        <div className="text-emerald-300 font-bold">Solid</div>
                        <div className="text-white/40 text-xs">7-8</div>
                    </button>
                    <button
                        onClick={() => handleQuickScore(5)}
                        className="py-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 hover:from-slate-500/30 hover:to-slate-600/30 transition-all hover:scale-105 active:scale-95 text-center"
                    >
                        <div className="text-3xl mb-1">😐</div>
                        <div className="text-slate-300 font-bold">Meh</div>
                        <div className="text-white/40 text-xs">4-6</div>
                    </button>
                </div>
                <button
                    onClick={() => setShowDetailedForm(!showDetailedForm)}
                    className="w-full mt-3 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                    {showDetailedForm ? 'Hide detailed form' : 'Want to give detailed feedback?'}
                </button>
            </div>

            {/* Detailed Form (collapsible) */}
            {showDetailedForm && (
                <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
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
                        <label className="block text-sm font-medium text-white/60 mb-2">Score (1-10)</label>
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
                        Submit Detailed Judgement
                    </button>
                </form>
            )}
        </div>
    );
}

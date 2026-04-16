import React, { useState, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useToast } from '../../context/ToastContext';
import { resolveChallenge } from '../../services/challenges';
import { scoreSubmission } from '../../services/gemini';
import { trackEvent } from '../../services/analytics';
import { playScoreReveal, playConfetti } from '../../services/sounds';
import Confetti from '../../components/Confetti';
import { getScoreBand } from '../../lib/scoreBands';

export function ChallengeRound({ payload, onDone }) {
    const { toast } = useToast();
    const [submission, setSubmission] = useState('');
    const [phase, setPhase] = useState('play'); // 'play' | 'scoring' | 'result'
    const [result, setResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRef = useRef(null);

    const challenger = payload;
    const hasValidPayload = challenger?.assets?.left && challenger?.assets?.right;

    if (!hasValidPayload) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md px-4">
                <div className="text-6xl mb-4">🔗</div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Invalid Challenge</h2>
                <p className="text-white/60 mb-6">This challenge link is broken or expired.</p>
                <button
                    onClick={onDone}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    Play Venn
                </button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!submission.trim()) return;
        setPhase('scoring');
        trackEvent('challenge_accepted', { challengerScore: challenger.score });

        try {
            const scoreResult = await scoreSubmission(
                submission.trim(),
                challenger.assets.left,
                challenger.assets.right,
                'IMAGE'
            );
            const myScore = scoreResult.score;
            const won = myScore > challenger.score;
            const tied = myScore === challenger.score;

            const challengeResult = {
                myScore,
                challengerScore: challenger.score,
                challengerName: challenger.playerName || 'A friend',
                won,
                tied,
                mySubmission: submission.trim(),
                theirSubmission: challenger.submission,
                breakdown: scoreResult.breakdown,
                commentary: scoreResult.commentary,
            };
            setResult(challengeResult);
            setPhase('result');
            playScoreReveal(myScore);

            if (won && myScore >= 9) {
                setShowConfetti(true);
                playConfetti();
            }

            if (challenger.id) {
                resolveChallenge(challenger.id, {
                    playerName: 'Challenger',
                    score: myScore,
                    submission: submission.trim(),
                });
            }
        } catch {
            toast.error('Scoring failed — try again');
            setPhase('play');
        }
    };

    if (phase === 'scoring') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-6" />
                <h2 className="text-2xl font-display font-bold text-white mb-2 animate-pulse">Scoring your connection...</h2>
                <p className="text-white/40 italic">&ldquo;{submission}&rdquo;</p>
            </div>
        );
    }

    if (phase === 'result' && result) {
        const myBand = getScoreBand(result.myScore);
        const theirBand = getScoreBand(result.challengerScore);
        return (
            <div className="w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-700">
                <Confetti active={showConfetti} duration={4000} particleCount={60} />
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                    <div className="glass-panel rounded-[22px] p-8 text-center">
                        <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold tracking-widest text-white/80 mb-6 border border-white/10">
                            CHALLENGE RESULT
                        </div>

                        <div className="text-5xl mb-4">
                            {result.won ? '🏆' : result.tied ? '🤝' : '😤'}
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-2">
                            {result.won ? 'You Win!' : result.tied ? 'It\'s a Tie!' : `${result.challengerName} Wins!`}
                        </h2>

                        {/* Score comparison */}
                        <div className="grid grid-cols-2 gap-4 my-6">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="text-white/50 text-xs uppercase tracking-wider mb-2">You</div>
                                <div className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${myBand?.color || 'from-slate-400 to-slate-500'}`}>
                                    {result.myScore}/10
                                </div>
                                <div className="text-white/40 text-xs mt-1">&ldquo;{result.mySubmission}&rdquo;</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="text-white/50 text-xs uppercase tracking-wider mb-2">{result.challengerName}</div>
                                <div className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${theirBand?.color || 'from-slate-400 to-slate-500'}`}>
                                    {result.challengerScore}/10
                                </div>
                                <div className="text-white/40 text-xs mt-1">&ldquo;{result.theirSubmission}&rdquo;</div>
                            </div>
                        </div>

                        {result.commentary && (
                            <blockquote className="text-lg italic text-white/80 font-serif mb-6 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
                                &ldquo;{result.commentary}&rdquo;
                            </blockquote>
                        )}

                        <button
                            onClick={onDone}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                        >
                            Play Venn with Friends!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Play phase
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
            <div className="mb-6 text-center">
                <div className="inline-block px-4 py-1 rounded-full bg-amber-500/10 text-sm font-bold tracking-widest text-amber-400 mb-3 border border-amber-500/20">
                    CHALLENGE
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-1">
                    {challenger.playerName || 'A friend'} scored {challenger.score}/10
                </h2>
                <p className="text-white/60 text-sm">Can you beat their connection?</p>
            </div>

            <VennDiagram leftAsset={challenger.assets.left} rightAsset={challenger.assets.right} />

            <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 space-y-4">
                <div>
                    <label htmlFor="challenge-round-connection" className="block text-sm font-medium text-white/60 mb-2">Your connection</label>
                    <input
                        id="challenge-round-connection"
                        ref={inputRef}
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Write one witty phrase that connects both concepts..."
                        maxLength={200}
                        // eslint-disable-next-line jsx-a11y/no-autofocus -- game-flow UX: player is expected to type immediately
                        autoFocus
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={!submission.trim()}
                    className="w-full py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit & Compare!
                </button>
            </form>
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { THEMES, buildThemeAssets, getThemeById, MEDIA_TYPES } from '../../data/themes';
import { getStats, isThemeUnlocked } from '../../services/stats';
import { scoreSubmission } from '../../services/gemini';
import { generateAIConnection, getAIOpponentResult, getAIDifficulty, getConnectionExplanation } from '../../services/aiFeatures';
import { addCoins, addBattlePassXp } from '../../services/shop';
import { recordPlay } from '../../services/stats';
import { trackEvent } from '../../services/analytics';
import { haptic } from '../../lib/haptics';
import { TIMINGS } from '../../lib/timings';
import { VennDiagram } from '../round/VennDiagram';
import { playScoreReveal, playConfetti as playConfettiSound } from '../../services/sounds';
import Confetti from '../../components/Confetti';

export function AIBattle({ onDone }) {
    const { user, currentModifier, roundNumber, totalRounds, isDailyChallenge, completeRound } = useGame();
    const [phase, setPhase] = useState('playing'); // playing | scoring | results
    const [assets, setAssets] = useState({ left: null, right: null });
    const [submission, setSubmission] = useState('');
    const [timer, setTimer] = useState(60);
    const [showTimeUp, setShowTimeUp] = useState(false);
    const [shakeInput, setShakeInput] = useState(false);
    const [playerResult, setPlayerResult] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [winner, setWinner] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const submittedRef = useRef(false);
    const stats = getStats();
    const rawTheme = getThemeById(user?.themeId);
    const theme = isThemeUnlocked(rawTheme?.id, stats)
        ? rawTheme
        : getThemeById(THEMES.find(t => isThemeUnlocked(t.id, stats))?.id) || rawTheme;
    const baseTimeLimit = theme?.modifier?.timeLimit || 60;
    const timeLimit = Math.round(baseTimeLimit * (currentModifier?.timeFactor || 1));
    const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
    const difficulty = getAIDifficulty();

    // Load assets
    useEffect(() => {
        submittedRef.current = false;
        const [left, right] = buildThemeAssets(theme, 2, mediaType);
        setAssets({ left, right });
        setTimer(timeLimit);
    }, [theme?.id, timeLimit, mediaType, roundNumber]);

    // Timer
    useEffect(() => {
        if (phase !== 'playing' || timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), TIMINGS.TIMER_TICK);
        return () => clearInterval(interval);
    }, [phase, timer]);

    useEffect(() => {
        if (timer === 0 && phase === 'playing' && !submittedRef.current) {
            setShowTimeUp(true);
            setTimeout(() => handleSubmit(null, { forceEmpty: true }), TIMINGS.TIME_UP_REVEAL);
        }
    }, [timer, phase]);

    const handleSubmit = useCallback(async (e, { forceEmpty = false } = {}) => {
        if (e) e.preventDefault();
        if (submittedRef.current) return;
        if (!forceEmpty && !submission.trim()) {
            haptic('warning');
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), TIMINGS.SHAKE_ANIMATION);
            return;
        }
        submittedRef.current = true;
        haptic('success');
        setPhase('scoring');

        const playerSubmission = submission.trim() || '(no answer)';

        // Generate AI's connection
        const aiConnection = generateAIConnection(
            assets.left?.label || 'Concept A',
            assets.right?.label || 'Concept B'
        );

        // Score player
        let playerScore;
        try {
            playerScore = await scoreSubmission(playerSubmission, assets.left, assets.right, mediaType);
        } catch {
            playerScore = { score: 5, breakdown: { wit: 5, logic: 5, originality: 5, clarity: 5 }, commentary: 'Could not score.' };
        }

        // Get AI score based on difficulty
        const aiOpponentResult = getAIOpponentResult(difficulty);

        setPlayerResult({
            submission: playerSubmission,
            score: playerScore.score,
            breakdown: playerScore.breakdown,
            commentary: playerScore.commentary,
        });

        setAiResult({
            submission: aiConnection.connection,
            score: aiOpponentResult.score,
            confidence: aiConnection.confidence,
        });

        // Determine winner
        const pScore = playerScore.score;
        const aScore = aiOpponentResult.score;
        if (pScore > aScore) {
            setWinner('player');
        } else if (aScore > pScore) {
            setWinner('ai');
        } else {
            setWinner('tie');
        }

        // Award coins (bonus for beating AI)
        const bonusCoins = pScore > aScore ? Math.round(pScore * 1.5) : pScore;
        addCoins(bonusCoins, 'ai_battle');
        addBattlePassXp(bonusCoins * 10);
        recordPlay();
        completeRound({ score: pScore });
        trackEvent('ai_battle_complete', { playerScore: pScore, aiScore: aScore, winner: pScore > aScore ? 'player' : aScore > pScore ? 'ai' : 'tie' });

        // Delay to show results
        setTimeout(() => {
            setPhase('results');
            playScoreReveal(pScore);
            if (pScore > aScore && pScore >= 8) {
                setShowConfetti(true);
                playConfettiSound();
            }
        }, TIMINGS.PHASE_TRANSITION);
    }, [submission, assets, mediaType, difficulty, completeRound]);

    if (!assets.left || !assets.right) {
        return (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-500 px-4">
                <div className="w-24 h-24 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin" />
            </div>
        );
    }

    // PLAYING PHASE
    if (phase === 'playing') {
        return (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700 px-4">
                {/* AI Battle Banner */}
                <div className="w-full max-w-md mb-3 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 border border-red-500/30 rounded-2xl p-3 text-center animate-in slide-in-from-top-4 duration-500">
                    <div className="text-2xl mb-0.5">🤖</div>
                    <div className="text-white font-bold text-base">vs AI Opponent</div>
                    <div className="text-white/60 text-xs">Beat the AI for bonus coins!</div>
                </div>

                <div className="w-full flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onDone?.()} className="text-white/30 hover:text-white/60 transition-colors text-xs">← Quit</button>
                        <div className="text-lg font-bold text-white/40">ROUND {roundNumber} / {totalRounds}</div>
                    </div>
                    {showTimeUp ? (
                        <div className="text-2xl font-black font-display text-amber-400 animate-in zoom-in-95 duration-300">Time's up!</div>
                    ) : (
                        <div className={`text-2xl font-black font-display tabular-nums ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</div>
                    )}
                </div>

                <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

                <form onSubmit={handleSubmit} className="w-full max-w-md mt-4 relative z-20">
                    <p className="text-center text-white/50 text-xs mb-2">One witty phrase that connects both concepts</p>
                    <input
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="What connects these two?"
                        className={`w-full bg-black/40 backdrop-blur-xl border-2 rounded-full px-8 py-5 text-xl text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-2xl ${shakeInput ? 'border-red-500/60 animate-[shake_0.5s_ease-in-out]' : 'border-white/20'}`}
                        autoFocus
                        maxLength={200}
                    />
                    {submission.trim() && (
                        <button type="submit" className="mt-3 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-full transition-all sm:hidden active:scale-95">
                            Submit
                        </button>
                    )}
                </form>
            </div>
        );
    }

    // SCORING PHASE
    if (phase === 'scoring') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-8" />
                <h2 className="text-3xl font-display font-bold text-white mb-2 animate-pulse">Scoring both players...</h2>
                <p className="text-white/40">You vs AI</p>
            </div>
        );
    }

    // RESULTS PHASE
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-700 px-4">
            <Confetti active={showConfetti} duration={4000} particleCount={60} />

            {/* Winner Banner */}
            <div className={`w-full max-w-md mb-6 p-4 rounded-2xl border text-center animate-in slide-in-from-top-4 duration-500 ${
                winner === 'player' ? 'bg-emerald-500/20 border-emerald-500/30' :
                winner === 'ai' ? 'bg-red-500/20 border-red-500/30' :
                'bg-yellow-500/20 border-yellow-500/30'
            }`}>
                <div className="text-3xl mb-1">
                    {winner === 'player' ? '🏆' : winner === 'ai' ? '🤖' : '🤝'}
                </div>
                <div className="text-xl font-bold text-white">
                    {winner === 'player' ? 'You Win!' : winner === 'ai' ? 'AI Wins!' : "It's a Tie!"}
                </div>
                {winner === 'player' && <div className="text-emerald-300 text-sm">+1.5x bonus coins earned!</div>}
            </div>

            {/* Side-by-side comparison */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Player Card */}
                <div className={`p-6 rounded-2xl border ${winner === 'player' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-center mb-4">
                        <div className="text-2xl mb-1">{user?.avatar || '👤'}</div>
                        <div className="text-white font-bold">{user?.name || 'You'}</div>
                    </div>
                    <div className="text-center mb-3">
                        <div className="text-4xl font-black text-white">{playerResult?.score}/10</div>
                    </div>
                    <p className="text-white/70 text-sm italic text-center mb-3">"{playerResult?.submission}"</p>
                    {playerResult?.breakdown && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                            <div className="bg-white/5 rounded-lg p-2">Wit: {playerResult.breakdown.wit}</div>
                            <div className="bg-white/5 rounded-lg p-2">Logic: {playerResult.breakdown.logic}</div>
                            <div className="bg-white/5 rounded-lg p-2">Originality: {playerResult.breakdown.originality}</div>
                            <div className="bg-white/5 rounded-lg p-2">Clarity: {playerResult.breakdown.clarity}</div>
                        </div>
                    )}
                </div>

                {/* AI Card */}
                <div className={`p-6 rounded-2xl border ${winner === 'ai' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-center mb-4">
                        <div className="text-2xl mb-1">🤖</div>
                        <div className="text-white font-bold">AI ({difficulty})</div>
                    </div>
                    <div className="text-center mb-3">
                        <div className="text-4xl font-black text-white">{aiResult?.score}/10</div>
                    </div>
                    <p className="text-white/70 text-sm italic text-center mb-3">"{aiResult?.submission}"</p>
                    <div className="text-center text-white/40 text-xs">
                        Confidence: {Math.round((aiResult?.confidence || 0) * 100)}%
                    </div>
                </div>
            </div>

            {/* Explanation */}
            {playerResult && assets?.left?.label && assets?.right?.label && (
                <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="text-blue-300 text-xs uppercase tracking-wider font-bold mb-2">Analysis</div>
                    <p className="text-white/70 text-sm leading-relaxed">
                        {getConnectionExplanation(playerResult.submission, playerResult.score, assets.left.label, assets.right.label)}
                    </p>
                </div>
            )}

            <button
                onClick={() => onDone?.()}
                className="px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
                {roundNumber >= totalRounds ? 'See Results' : 'Next Round →'}
            </button>
        </div>
    );
}

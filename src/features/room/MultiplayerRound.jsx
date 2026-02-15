import React, { useState, useEffect, useCallback } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { CheckCircle, Clock, Users } from 'lucide-react';

export function MultiplayerRound() {
    const {
        room,
        players,
        submissions,
        isHost,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
    } = useRoom();
    const { toast } = useToast();

    const [submission, setSubmission] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [scoring, setScoring] = useState(false);

    const theme = getThemeById(room?.theme_id);
    const timeLimit = theme?.modifier?.timeLimit || 60;
    const [timer, setTimer] = useState(timeLimit);
    const assets = room?.assets;

    // Timer
    useEffect(() => {
        setTimer(timeLimit);
        setSubmission('');
        setSubmitted(false);
    }, [room?.round_number, timeLimit]);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (submitted) return;

        const answer = submission.trim() || '(no answer)';
        setSubmitted(true);
        await submitMultiplayerAnswer(answer);
    }, [submission, submitted, submitMultiplayerAnswer]);

    useEffect(() => {
        if (submitted) return undefined;
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
        handleSubmit();
        return undefined;
    }, [timer, submitted, handleSubmit]);

    // Auto-trigger scoring when all submitted (host only)
    useEffect(() => {
        if (isHost && submissions.length >= players.length && players.length > 0 && !scoring) {
            setScoring(true);
            const message = room?.scoring_mode === 'ai'
                ? 'All players submitted — scoring...'
                : 'All players submitted — revealing answers...';
            toast.info(message);
            scoreAllSubmissions().finally(() => setScoring(false));
        }
    }, [isHost, players.length, room?.scoring_mode, scoreAllSubmissions, scoring, submissions.length, toast]);

    const submittedPlayers = submissions.map((s) => s.player_name);
    const waitingPlayers = players.filter((p) => !submittedPlayers.includes(p.player_name));

    if (!assets?.left || !assets?.right) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin mb-4" />
                <p className="text-white/60">Loading round...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700">
            {/* Header */}
            <div className="w-full flex justify-between items-center px-8 mb-4">
                <div className="text-2xl font-bold text-white/40">
                    ROUND {room.round_number} / {room.total_rounds}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{submissions.length}/{players.length} submitted</span>
                    </div>
                    <div className={`text-4xl font-black font-display ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timer}s
                    </div>
                </div>
            </div>

            {/* Theme info */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
                <div className="rounded-full bg-white/10 px-3 py-1">
                    Room: <span className="text-white font-semibold">{room.code}</span>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1">
                    x{(theme?.modifier?.scoreMultiplier || 1).toFixed(2)}
                </div>
            </div>

            {/* Venn Diagram */}
            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            {/* Input or waiting state */}
            {!submitted ? (
                <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                    <p className="text-center text-white/60 text-sm mb-3">
                        One witty phrase that connects both concepts
                    </p>
                    <input
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="What connects these two?"
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
            ) : (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="glass-panel rounded-2xl p-6 mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-white font-semibold text-lg mb-1">Answer submitted!</p>
                        <p className="text-white/50 italic">&ldquo;{submission || '(no answer)'}&rdquo;</p>
                    </div>

                    {/* Waiting status */}
                    {waitingPlayers.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-white/40 text-sm flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 animate-pulse" />
                                Waiting for {waitingPlayers.length} player{waitingPlayers.length !== 1 ? 's' : ''}...
                            </p>
                            <div className="flex gap-2 justify-center flex-wrap">
                                {waitingPlayers.map((p) => (
                                    <span
                                        key={p.id}
                                        className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-sm border border-white/10"
                                    >
                                        {p.avatar || '👽'} {p.player_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {scoring && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-purple-400">
                            <div className="w-5 h-5 rounded-full border-2 border-t-purple-500 border-white/10 animate-spin" />
                            <span className="text-sm font-medium">Scoring submissions...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

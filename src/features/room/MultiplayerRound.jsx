import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { CheckCircle, Clock, Users } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { ConnectionBanner } from './ConnectionBanner';

export function MultiplayerRound() {
    const {
        room,
        players,
        submissions,
        isHost,
        isSpectator,
        playerName,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
        leaveCurrentRoom,
    } = useRoom();
    const { toast } = useToast();

    const [submission, setSubmission] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [scoring, setScoring] = useState(false);
    const prevSubmissionCountRef = useRef(submissions.length);

    const theme = getThemeById(room?.theme_id);
    const timeLimit = theme?.modifier?.timeLimit || 60;
    const [timer, setTimer] = useState(timeLimit);
    const assets = room?.assets;

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
        haptic('success');
        await submitMultiplayerAnswer(answer);
    }, [submission, submitted, submitMultiplayerAnswer]);

    useEffect(() => {
        if (!submitted || scoring) return;
        const prev = prevSubmissionCountRef.current;
        if (submissions.length > prev && submissions.length < players.length) {
            const newSub = submissions[submissions.length - 1];
            if (newSub?.player_name !== playerName) {
                const name = newSub?.player_name || 'A player';
                toast.info(`${name} submitted!`);
            }
        }
        prevSubmissionCountRef.current = submissions.length;
    }, [submitted, submissions, submissions.length, players.length, scoring, playerName, toast]);

    useEffect(() => {
        if (submitted) return undefined;
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
        handleSubmit();
        return undefined;
    }, [timer, submitted, handleSubmit]);

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
                <div className="h-12 w-12 rounded-full border-2 border-white/15 border-t-game-accent animate-spin mb-4" />
                <p className="text-white/55">Loading round...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-spring-in">
            <ConnectionBanner />
            {isSpectator && (
                <div className="w-full py-2.5 px-4 bg-amber-500/15 border border-amber-400/25 text-amber-200 text-sm font-semibold text-center rounded-2xl mb-4">
                    Spectating — watch and react
                </div>
            )}

            <div className="w-full max-w-2xl flex flex-col gap-4 px-2 mb-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={leaveCurrentRoom}
                            className="shrink-0 px-3 py-2 rounded-full bg-white/[0.08] border border-white/10 text-white/70 hover:bg-white/[0.12] transition text-sm font-semibold"
                        >
                            Leave
                        </button>
                        <div>
                            <div className="game-section-label">Live room</div>
                            <div className="text-xl font-bold tracking-tight text-white">
                                Round {room.round_number} of {room.total_rounds}
                            </div>
                        </div>
                    </div>
                    <div className={`game-timer ${timer < 10 ? 'game-timer--urgent' : ''}`}>
                        {timer}s
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="game-hud-chip">
                        <Users className="w-3.5 h-3.5" />
                        <span>{submissions.length}/{players.length} submitted</span>
                    </div>
                    <div className="game-hud-chip">
                        Room: <span className="text-white font-medium">{room.code}</span>
                    </div>
                    <div className="game-hud-chip">
                        x{(theme?.modifier?.scoreMultiplier || 1).toFixed(2)}
                    </div>
                    <div className="game-hud-chip">
                        {room?.scoring_mode === 'human' ? 'Manual' : 'AI'} Judge
                    </div>
                </div>
                <div className="flex gap-2" aria-label={`Round progress: ${room.round_number} of ${room.total_rounds}`}>
                    {Array.from({ length: room.total_rounds }).map((_, index) => (
                        <div
                            key={index}
                            className={`game-progress-dot ${
                                index + 1 < room.round_number
                                    ? 'game-progress-dot--done'
                                    : index + 1 === room.round_number
                                    ? 'game-progress-dot--current'
                                    : ''
                            }`}
                        />
                    ))}
                </div>
            </div>

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} />

            {isSpectator ? (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-6 mb-4">
                        <Users className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                        <p className="text-white font-semibold text-lg mb-1">Watching the round...</p>
                        <p className="text-white/50 text-sm">{submissions.length}/{players.length} players have submitted</p>
                    </div>
                </div>
            ) : !submitted ? (
                <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                    <p className="text-center text-white/50 text-sm mb-3">
                        One witty phrase that connects both concepts
                    </p>
                    <input
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="What connects these two?"
                        className="game-input-hero w-full"
                        autoFocus
                    />
                    <div className="mt-4 text-center text-white/40 text-sm space-y-1">
                        <div>Press <span className="font-semibold text-white/80">Return</span> to submit</div>
                        <div className="text-white/30 text-xs">
                            {room?.scoring_mode === 'human'
                                ? 'Your friends will judge your connection'
                                : 'Scored on Wit · Logic · Originality · Clarity'
                            }
                        </div>
                    </div>
                </form>
            ) : (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-6 mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-white font-semibold text-lg mb-1">Answer submitted</p>
                        <p className="text-white/55 italic">&ldquo;{submission || '(no answer)'}&rdquo;</p>
                    </div>

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
                                        className="game-hud-chip"
                                    >
                                        {p.avatar || '👽'} {p.player_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {scoring && (
                        <div
                            className="mt-6 flex items-center justify-center gap-2 p-4 rounded-[22px] bg-game-accent/10 border border-game-accent/25 text-blue-200"
                            role="status"
                            aria-live="polite"
                            aria-label="Scoring submissions, please wait"
                        >
                            <div className="w-5 h-5 rounded-full border-2 border-t-game-accent border-white/10 animate-spin" aria-hidden="true" />
                            <span className="text-sm font-medium">Scoring submissions...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

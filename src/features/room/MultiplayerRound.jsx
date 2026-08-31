import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VennDiagram } from '../round/VennDiagram';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { CheckCircle, Clock, Users } from 'lucide-react';
import { haptic } from '../../lib/haptics';
import { playDrumroll, playSubmitSound, playTickSound, playUrgentTick } from '../../services/sounds';
import { ConnectionBanner } from './ConnectionBanner';
import { useResolvedRoundAssets } from '../../hooks/useResolvedRoundAssets';
import { useTranslation } from '../../hooks/useTranslation';
import { canWriteOnThisDevice, getCurrentWriter, PASS_PHONE_DRUMROLL_MS, PASS_PHONE_SECONDS, PASS_PHONE_STARE_MS } from '../../lib/passThePhone';

export function MultiplayerRound() {
    const { t } = useTranslation();
    const {
        room,
        players,
        activePlayers,
        submissions,
        isHost,
        isSpectator,
        playerName,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
        leaveCurrentRoom,
        passThePhone,
        couchSessions,
    } = useRoom();
    const { toast } = useToast();

    const [submission, setSubmission] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [scoring, setScoring] = useState(false);
    const [ritualPhase, setRitualPhase] = useState('write');
    const prevSubmissionCountRef = useRef(submissions.length);
    const drumrollStartedRef = useRef(false);

    const theme = getThemeById(room?.theme_id);
    const seatedPlayers = activePlayers || players.filter((player) => !player.is_spectator);
    const currentWriter = getCurrentWriter(seatedPlayers, submissions);
    const canWrite = !isSpectator && canWriteOnThisDevice({
        passThePhone,
        currentWriter,
        playerName,
        couchSessions,
    });
    const timeLimit = passThePhone ? PASS_PHONE_SECONDS : (theme?.modifier?.timeLimit || 60);
    const [timer, setTimer] = useState(timeLimit);
    const roomAssets = room?.assets;
    const { assets: displayAssets, mediaLoading } = useResolvedRoundAssets(roomAssets);
    const assets = displayAssets || roomAssets;

    useEffect(() => {
        setTimer(timeLimit);
        setSubmission('');
        setSubmitted(false);
        drumrollStartedRef.current = false;
        if (!passThePhone) setRitualPhase('write');
    }, [room?.round_number, timeLimit, passThePhone]);

    useEffect(() => {
        if (!passThePhone || !currentWriter) return;
        setTimer(timeLimit);
        setSubmission('');
        setSubmitted(false);
        setRitualPhase('stare');
        const stare = setTimeout(() => setRitualPhase('write'), PASS_PHONE_STARE_MS);
        return () => clearTimeout(stare);
    }, [passThePhone, currentWriter?.player_name, timeLimit]);

    useEffect(() => {
        if (!passThePhone || currentWriter || submissions.length === 0 || scoring) return;
        if (drumrollStartedRef.current) return;
        drumrollStartedRef.current = true;
        setRitualPhase('drumroll');
        playDrumroll();
        haptic('medium');
        const roll = setTimeout(() => {
            if (!isHost) return;
            setScoring(true);
            scoreAllSubmissions().finally(() => setScoring(false));
        }, PASS_PHONE_DRUMROLL_MS);
        return () => clearTimeout(roll);
    }, [currentWriter, isHost, passThePhone, scoreAllSubmissions, scoring, submissions.length]);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (submitted) return;

        const answer = submission.trim() || '(no answer)';
        setSubmitted(true);
        haptic('success');
        playSubmitSound();
        if (passThePhone && currentWriter?.player_name) {
            await submitMultiplayerAnswer(answer, { asPlayer: currentWriter.player_name });
        } else {
            await submitMultiplayerAnswer(answer);
        }
    }, [currentWriter?.player_name, passThePhone, submission, submitted, submitMultiplayerAnswer]);

    useEffect(() => {
        if (!submitted || scoring) return;
        const prev = prevSubmissionCountRef.current;
        if (submissions.length > prev && submissions.length < (activePlayers?.length || players.length)) {
            const newSub = submissions[submissions.length - 1];
            if (newSub?.player_name !== playerName) {
                const name = newSub?.player_name || 'A player';
                toast.info(`${name} submitted!`);
            }
        }
        prevSubmissionCountRef.current = submissions.length;
    }, [submitted, submissions, submissions.length, activePlayers?.length, players.length, scoring, playerName, toast]);

    useEffect(() => {
        if (submitted || !canWrite || (passThePhone && ritualPhase !== 'write')) return undefined;
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
        handleSubmit();
        return undefined;
    }, [canWrite, handleSubmit, passThePhone, ritualPhase, submitted, timer]);

    useEffect(() => {
        if (submitted) return;
        if (timer > 0 && timer <= 10) {
            if (timer <= 5) playUrgentTick();
            else playTickSound();
        }
    }, [timer, submitted]);

    useEffect(() => {
        if (!passThePhone && isHost && submissions.length >= (activePlayers?.length || players.length) && (activePlayers?.length || players.length) > 0 && !scoring) {
            setScoring(true);
            const message = room?.scoring_mode === 'ai'
                ? 'All players submitted — scoring...'
                : 'All players submitted — revealing answers...';
            toast.info(message);
            scoreAllSubmissions().finally(() => setScoring(false));
        }
    }, [activePlayers?.length, isHost, passThePhone, players.length, room?.scoring_mode, scoreAllSubmissions, scoring, submissions.length, toast]);

    const submittedPlayers = submissions.map((s) => s.player_name);
    const waitingPlayers = seatedPlayers.filter((p) => !submittedPlayers.includes(p.player_name));

    if (!assets?.left || !assets?.right) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
                <div className="h-12 w-12 rounded-full border-2 border-white/15 border-t-game-accent animate-spin mb-4" />
                <p className="text-white/55">{t('round.loadingRound')}</p>
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
                    {(!passThePhone || ritualPhase === 'write') && (
                        <div className={`game-timer ${timer < 10 ? 'game-timer--urgent' : ''}`}>
                            {timer}s
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="game-hud-chip">
                        <Users className="w-3.5 h-3.5" />
                        <span>{submissions.length}/{seatedPlayers.length} submitted</span>
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

            <VennDiagram leftAsset={assets.left} rightAsset={assets.right} mediaLoading={mediaLoading} />

            {isSpectator ? (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-6 mb-4">
                        <Users className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                        <p className="text-white font-semibold text-lg mb-1">Watching the round...</p>
                        <p className="text-white/50 text-sm">{submissions.length}/{seatedPlayers.length} players have submitted</p>
                    </div>
                </div>
            ) : passThePhone && ritualPhase === 'drumroll' ? (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-8 mb-4">
                        <p className="text-4xl font-display font-bold text-white mb-2">Drumroll</p>
                        <p className="text-white/50 text-sm">Nobody peeks. The host slams the card.</p>
                    </div>
                </div>
            ) : passThePhone && (ritualPhase === 'stare' || !canWrite) && !submitted ? (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-8 mb-4">
                        <p className="text-white/45 text-xs uppercase tracking-[0.2em] mb-3">Pass the phone</p>
                        <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
                            Hand the phone to {currentWriter?.player_name || 'the next writer'}
                        </p>
                        <p className="text-white/55 text-sm mt-4">
                            {ritualPhase === 'stare'
                                ? 'Look at the pair. Three seconds. Then write.'
                                : 'They get 30 seconds. Don\'t peek the last line.'}
                        </p>
                    </div>
                </div>
            ) : !submitted && (!passThePhone || ritualPhase === 'write') ? (
                <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8 relative z-20">
                    <p className="text-center text-white/50 text-sm mb-3">
                        {passThePhone
                            ? `${currentWriter?.player_name || 'Your'} turn — one line, 30 seconds.`
                            : 'One witty phrase that connects both concepts'}
                    </p>
                    <input
                        type="text"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        onFocus={(event) => event.target.scrollIntoView?.({ block: 'center', behavior: 'smooth' })}
                        placeholder="What connects these two?"
                        className="game-input-hero w-full"
                        autoFocus
                    />
                    <div className="sticky bottom-0 z-30 mt-4 space-y-3 bg-gradient-to-t from-[#07070a] via-[#07070a]/95 to-transparent pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-white/40 text-sm sm:static sm:bg-none sm:pb-0">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!submission.trim()}
                            className="wordle-button wordle-primary w-full min-h-[52px] text-lg disabled:opacity-50 sm:hidden"
                        >
                            Submit connection
                        </button>
                        <div className="hidden sm:block">Press <span className="font-semibold text-white/80">Return</span> to submit</div>
                        {waitingPlayers.length > 0 && (
                            <div className="text-white/45 text-xs">
                                Still writing: {waitingPlayers.map((p) => p.player_name).join(', ')}
                            </div>
                        )}
                    </div>
                </form>
            ) : (
                <div className="w-full max-w-xl mt-8 text-center animate-in fade-in duration-500">
                    <div className="wordle-card p-6 mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-white font-semibold text-lg mb-1">
                            {passThePhone ? 'Locked in. Pass the phone.' : 'Answer submitted'}
                        </p>
                        {!passThePhone && (
                            <p className="text-white/55 italic">&ldquo;{submission || '(no answer)'}&rdquo;</p>
                        )}
                    </div>

                    {waitingPlayers.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-white/40 text-sm flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 animate-pulse" />
                                Still writing: {waitingPlayers.map((p) => p.player_name).join(', ')}
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
                            <span className="text-sm font-medium">
                                {room?.scoring_mode === 'ai'
                                    ? 'AI is scoring every connection…'
                                    : 'Preparing the reveal for voting…'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

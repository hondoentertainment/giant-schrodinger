import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useToast } from '../../context/ToastContext';
import { getThemeById } from '../../data/themes';
import { getRoomSubmissions } from '../../services/multiplayer';
import { CountdownPhase } from './sections/CountdownPhase';
import { RevealPhase } from './sections/RevealPhase';
import { VotingPhase } from './sections/VotingPhase';
import { ResultsPhase } from './sections/ResultsPhase';

// Phases: countdown -> reveal -> voting -> results
const REVEAL_PHASES = {
    COUNTDOWN: 'countdown',
    REVEAL: 'reveal',
    VOTING: 'voting',
    RESULTS: 'results',
};

export function MultiplayerReveal() {
    const {
        room,
        players,
        submissions,
        isHost,
        isSpectator,
        roomPhase,
        playerName,
        reactions,
        addReaction,
        advanceToNextRound,
        leaveCurrentRoom,
    } = useRoom();
    const { toast } = useToast();

    const [advancing, setAdvancing] = useState(false);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [revealPhase, setRevealPhase] = useState(REVEAL_PHASES.COUNTDOWN);
    const [countdownValue, setCountdownValue] = useState(3);
    const [revealedCount, setRevealedCount] = useState(0);
    const [votes, setVotes] = useState({});
    const [hasVoted, setHasVoted] = useState(false);

    const theme = getThemeById(room?.theme_id);
    const multiplier = theme?.modifier?.scoreMultiplier || 1;
    const isFinished = roomPhase === 'finished';
    const scoringMode = room?.scoring_mode || 'ai';

    // Fetch all submissions for finished state
    useEffect(() => {
        if (!isFinished || !room?.id) return undefined;
        let cancelled = false;
        getRoomSubmissions(room.id).then((data) => {
            if (!cancelled) setAllSubmissions(data);
        });
        return () => { cancelled = true; };
    }, [isFinished, room?.id]);

    // Dramatic countdown on mount
    useEffect(() => {
        if (isFinished) {
            setRevealPhase(REVEAL_PHASES.RESULTS);
            return;
        }
        setRevealPhase(REVEAL_PHASES.COUNTDOWN);
        setCountdownValue(3);
    }, [isFinished]);

    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.COUNTDOWN) return;
        if (countdownValue <= 0) {
            setRevealPhase(REVEAL_PHASES.REVEAL);
            return;
        }
        const timer = setTimeout(() => setCountdownValue((v) => v - 1), 800);
        return () => clearTimeout(timer);
    }, [countdownValue, revealPhase]);

    // Staggered reveal of answers
    useEffect(() => {
        if (revealPhase !== REVEAL_PHASES.REVEAL) return;
        const currentSubs = submissions;
        if (revealedCount >= currentSubs.length) {
            const moveToNext = setTimeout(() => {
                if (scoringMode === 'ai') {
                    setRevealPhase(REVEAL_PHASES.RESULTS);
                } else {
                    setRevealPhase(REVEAL_PHASES.VOTING);
                }
            }, 1000);
            return () => clearTimeout(moveToNext);
        }
        const timer = setTimeout(() => setRevealedCount((c) => c + 1), 600);
        return () => clearTimeout(timer);
    }, [revealPhase, revealedCount, submissions.length, scoringMode]);

    const handleVote = useCallback((submissionId) => {
        if (hasVoted) return;
        setVotes((prev) => ({
            ...prev,
            [submissionId]: (prev[submissionId] || 0) + 1,
        }));
        setHasVoted(true);
        toast.success('Vote cast!');
    }, [hasVoted, toast]);

    const handleFinishVoting = useCallback(() => {
        setRevealPhase(REVEAL_PHASES.RESULTS);
    }, []);

    // Build scored list
    const scored = useMemo(() => {
        const subs = isFinished ? allSubmissions : submissions;
        return [...subs]
            .map((s) => {
                const score = s.score || {};
                const player = players.find((p) => p.player_name === s.player_name);
                const voteCount = votes[s.id] || 0;
                return {
                    ...s,
                    parsedScore: score,
                    finalScore: score.finalScore || score.score || 0,
                    voteCount,
                    avatar: player?.avatar || '👽',
                };
            })
            .sort((a, b) => {
                if (revealPhase === REVEAL_PHASES.VOTING || (scoringMode !== 'ai' && revealPhase === REVEAL_PHASES.RESULTS)) {
                    return b.voteCount - a.voteCount;
                }
                return b.finalScore - a.finalScore;
            });
    }, [submissions, allSubmissions, players, isFinished, votes, revealPhase, scoringMode]);

    const sessionLeaderboard = useMemo(() => {
        const totals = new Map();
        for (const entry of scored) {
            const prev = totals.get(entry.player_name) || { totalScore: 0, rounds: 0, avatar: entry.avatar, totalVotes: 0 };
            totals.set(entry.player_name, {
                avatar: prev.avatar || entry.avatar,
                totalScore: prev.totalScore + entry.finalScore,
                totalVotes: prev.totalVotes + entry.voteCount,
                rounds: prev.rounds + 1,
            });
        }

        return players
            .map((player) => {
                const agg = totals.get(player.player_name) || { totalScore: 0, rounds: 0, avatar: player.avatar || '👽', totalVotes: 0 };
                return {
                    playerName: player.player_name,
                    avatar: agg.avatar || '👽',
                    totalScore: agg.totalScore,
                    totalVotes: agg.totalVotes,
                    rounds: agg.rounds,
                };
            })
            .sort((a, b) => b.totalScore - a.totalScore || b.totalVotes - a.totalVotes);
    }, [players, scored]);

    const hasNextRound = room && room.round_number < room.total_rounds;

    const handleNext = async () => {
        setAdvancing(true);
        await advanceToNextRound();
    };

    const handleRematch = useCallback(() => {
        // Rematch: restart the room with same settings
        setRevealPhase(REVEAL_PHASES.COUNTDOWN);
        setRevealedCount(0);
        setVotes({});
        setHasVoted(false);
        setCountdownValue(3);
        advanceToNextRound();
    }, [advanceToNextRound]);

    // Countdown screen
    if (revealPhase === REVEAL_PHASES.COUNTDOWN && !isFinished) {
        return (
            <CountdownPhase
                room={room}
                countdownValue={countdownValue}
                onLeave={leaveCurrentRoom}
            />
        );
    }

    // Staggered reveal screen
    if (revealPhase === REVEAL_PHASES.REVEAL && !isFinished) {
        return (
            <RevealPhase
                room={room}
                submissions={submissions}
                players={players}
                revealedCount={revealedCount}
                isSpectator={isSpectator}
                reactions={reactions}
                addReaction={addReaction}
                onLeave={leaveCurrentRoom}
            />
        );
    }

    // Voting screen (for non-AI scoring)
    if (revealPhase === REVEAL_PHASES.VOTING && !isFinished) {
        return (
            <VotingPhase
                scored={scored}
                playerName={playerName}
                hasVoted={hasVoted}
                isHost={isHost}
                onVote={handleVote}
                onFinishVoting={handleFinishVoting}
                onLeave={leaveCurrentRoom}
            />
        );
    }

    // Results screen (final reveal with scores)
    return (
        <ResultsPhase
            room={room}
            isFinished={isFinished}
            isHost={isHost}
            isSpectator={isSpectator}
            scoringMode={scoringMode}
            multiplier={multiplier}
            scored={scored}
            sessionLeaderboard={sessionLeaderboard}
            hasNextRound={hasNextRound}
            advancing={advancing}
            reactions={reactions}
            addReaction={addReaction}
            onNext={handleNext}
            onRematch={handleRematch}
            onLeave={leaveCurrentRoom}
        />
    );
}

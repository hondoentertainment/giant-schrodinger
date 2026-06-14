import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { isBackendEnabled } from '../lib/supabase';
import {
    createRoom,
    joinRoom,
    getRoomPlayers,
    getRoundSubmissions,
    getRoundVotes,
    leaveRoom,
    startRound as startRoundApi,
    setRoomStatus,
    submitAnswer,
    updateSubmissionScore,
    castVote,
    finalizeRoomVoting,
    advanceRoom,
    subscribeToRoom,
} from '../services/multiplayer';
import { buildThemeAssets, getThemeById, MEDIA_TYPES } from '../data/themes';
import { scoreSubmission } from '../services/gemini';
import { getCustomImages } from '../services/customImages';
import { useGame } from './GameContext';
import { reportAppError, reportAppEvent } from '../lib/telemetry';

const RoomContext = createContext();

function getRoomPhaseFromStatus(status) {
    switch (status) {
    case 'playing':
        return 'playing';
    case 'revealing':
        return 'revealing';
    case 'results':
        return 'results';
    case 'finished':
        return 'finished';
    case 'waiting':
    default:
        return 'lobby';
    }
}

export function RoomProvider({ children }) {
    const { toast } = useToast();
    const { user } = useGame();

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [votes, setVotes] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [roomSession, setRoomSession] = useState(null);
    const [roomPhase, setRoomPhase] = useState('none');

    const unsubRef = useRef(null);
    const hydrateRequestRef = useRef(0);

    const isMultiplayer = !!room;
    const roomCode = room?.code || null;
    const allSubmitted = players.length > 0 && submissions.length >= players.length;

    const cleanup = useCallback(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        setRoom(null);
        setPlayers([]);
        setSubmissions([]);
        setVotes([]);
        setIsHost(false);
        setPlayerName('');
        setRoomSession(null);
        setRoomPhase('none');
    }, []);

    useEffect(() => {
        return () => {
            if (unsubRef.current) unsubRef.current();
        };
    }, []);

    const hydrateRoomState = useCallback(async (nextRoom) => {
        if (!nextRoom?.id) {
            setSubmissions([]);
            setVotes([]);
            return;
        }

        const requestId = hydrateRequestRef.current + 1;
        hydrateRequestRef.current = requestId;

        const shouldLoadRoundState = ['revealing', 'results', 'finished'].includes(nextRoom.status);
        const shouldLoadVotes = shouldLoadRoundState && (nextRoom.scoring_mode || 'ai') === 'human';

        if (!shouldLoadRoundState) {
            setSubmissions([]);
            setVotes([]);
            return;
        }

        const [roundSubmissions, roundVotes] = await Promise.all([
            getRoundSubmissions(nextRoom.id, nextRoom.round_number),
            shouldLoadVotes ? getRoundVotes(nextRoom.id, nextRoom.round_number) : Promise.resolve([]),
        ]);

        if (hydrateRequestRef.current !== requestId) {
            return;
        }

        setSubmissions(roundSubmissions);
        setVotes(roundVotes);
    }, []);

    const setupSubscriptions = useCallback((roomId) => {
        if (unsubRef.current) unsubRef.current();

        const unsub = subscribeToRoom(roomId, {
            onRoomUpdate: (updatedRoom) => {
                setRoom(updatedRoom);
                setRoomPhase(getRoomPhaseFromStatus(updatedRoom.status));
                hydrateRoomState(updatedRoom);
            },
            onPlayerJoin: (player) => {
                setPlayers((prev) => {
                    if (prev.some((entry) => entry.id === player.id)) return prev;
                    return [...prev, player];
                });
                toast.info(`${player.player_name} joined the room`);
            },
            onPlayerLeave: (player) => {
                setPlayers((prev) => prev.filter((entry) => entry.id !== player.id));
                if (player.player_name) {
                    toast.info(`${player.player_name} left the room`);
                }
            },
            onSubmission: (submission) => {
                setSubmissions((prev) => {
                    if (prev.some((entry) => entry.id === submission.id)) return prev;
                    return [...prev, submission];
                });
            },
            onSubmissionUpdate: (submission) => {
                setSubmissions((prev) =>
                    prev.map((entry) => (entry.id === submission.id ? submission : entry))
                );
            },
            onVote: (vote) => {
                setVotes((prev) => {
                    if (prev.some((entry) => entry.id === vote.id)) return prev;
                    return [...prev, vote];
                });
            },
        });

        unsubRef.current = unsub;
    }, [hydrateRoomState, toast]);

    const hostRoom = useCallback(async ({ hostName, themeId, totalRounds, scoringMode }) => {
        if (!isBackendEnabled()) {
            toast.error('Multiplayer requires Supabase - check your .env');
            return null;
        }

        const result = await createRoom({
            hostName,
            themeId,
            totalRounds,
            scoringMode,
            avatar: user?.avatar || null,
        });
        if (!result?.room) {
            toast.error('Failed to create room');
            return null;
        }

        setRoom(result.room);
        setRoomSession(result.session || null);
        setIsHost(true);
        setPlayerName(result.session?.playerName || hostName);
        setRoomPhase(getRoomPhaseFromStatus(result.room.status));

        const roomPlayers = await getRoomPlayers(result.room.id);
        setPlayers(roomPlayers);
        await hydrateRoomState(result.room);
        setupSubscriptions(result.room.id);

        toast.success(`Room ${result.room.code} created!`);
        reportAppEvent('multiplayer_room_created', {
            secureMode: result.session?.secureMode !== false,
            scoringMode,
            totalRounds,
        });
        return result.room;
    }, [setupSubscriptions, toast, user?.avatar]);

    const joinRoomByCode = useCallback(async (code, name, avatar) => {
        if (!isBackendEnabled()) {
            toast.error('Multiplayer requires Supabase - check your .env');
            return null;
        }

        const result = await joinRoom(code, name, avatar);
        if (result?.error) {
            toast.error(result.error);
            return null;
        }
        if (!result?.room) {
            toast.error('Failed to join room');
            return null;
        }

        setRoom(result.room);
        setRoomSession(result.session || null);
        setIsHost(false);
        setPlayerName(result.session?.playerName || name);
        setRoomPhase(getRoomPhaseFromStatus(result.room.status));

        const roomPlayers = await getRoomPlayers(result.room.id);
        setPlayers(roomPlayers);
        await hydrateRoomState(result.room);
        setupSubscriptions(result.room.id);

        toast.success(`Joined room ${result.room.code}!`);
        reportAppEvent('multiplayer_room_joined', {
            secureMode: result.session?.secureMode !== false,
            roomCode: result.room.code,
        });
        return result.room;
    }, [setupSubscriptions, toast]);

    const leaveCurrentRoom = useCallback(async () => {
        if (room && playerName) {
            await leaveRoom(room.id, playerName, roomSession);
        }
        cleanup();
        toast.info('Left the room');
    }, [cleanup, playerName, room, roomSession, toast]);

    const startMultiplayerRound = useCallback(async () => {
        if (!room || !isHost) return false;

        const theme = getThemeById(room.theme_id);
        const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;
        const customPool = getCustomImages();
        const useCustom = mediaType === MEDIA_TYPES.IMAGE && user?.useCustomImages && customPool.length >= 2;

        let left;
        let right;
        if (useCustom) {
            const shuffled = [...customPool].sort(() => Math.random() - 0.5);
            [left, right] = shuffled.slice(0, 2).map((img) => ({
                id: img.id,
                label: img.label,
                type: MEDIA_TYPES.IMAGE,
                url: img.url,
                fallbackUrl: img.url,
            }));
        } else {
            [left, right] = buildThemeAssets(theme, 2, mediaType);
        }

        const success = await startRoundApi(room.id, room.round_number, { left, right }, roomSession);
        if (!success) {
            toast.error('Failed to start round');
            return false;
        }
        return true;
    }, [isHost, room, roomSession, toast, user?.mediaType, user?.useCustomImages]);

    const submitMultiplayerAnswer = useCallback(async (submission) => {
        if (!room || !playerName) return false;

        const success = await submitAnswer(room.id, room.round_number, playerName, submission, {
            ...roomSession,
            playerName,
        });
        if (!success) {
            toast.error('Failed to submit answer');
            return false;
        }
        toast.success('Answer submitted!');
        return true;
    }, [playerName, room, roomSession, toast]);

    const scoreAllSubmissions = useCallback(async () => {
        if (!room || !isHost) return;

        const scoringMode = room.scoring_mode || 'ai';

        if (scoringMode === 'ai') {
            const theme = getThemeById(room.theme_id);
            const assets = room.assets;
            const roundSubmissions = await getRoundSubmissions(room.id, room.round_number);

            for (const submission of roundSubmissions) {
                if (submission.score) continue;
                try {
                    const scoreResult = await scoreSubmission(submission.submission, assets.left, assets.right);
                    const multiplier = theme?.modifier?.scoreMultiplier || 1;
                    const finalScore = Math.min(10, Math.max(1, Math.round(scoreResult.score * multiplier)));
                    await updateSubmissionScore(
                        submission.id,
                        {
                            ...scoreResult,
                            finalScore,
                            scoreMultiplier: multiplier,
                        },
                        roomSession
                    );
                } catch (err) {
                    console.warn('Failed to score submission:', err);
                    reportAppError('multiplayer_score_submission', err, {
                        roomId: room.id,
                        roundNumber: room.round_number,
                    });
                }
            }
        } else {
            toast.info('All answers are in - vote for the winner.');
        }

        await setRoomStatus(room.id, 'revealing', roomSession);
    }, [isHost, room, roomSession, toast]);

    const castVoteForSubmission = useCallback(async (submissionId) => {
        if (!room) return { ok: false, error: 'Room not available' };

        const result = await castVote(room.id, room.round_number, submissionId, {
            ...roomSession,
            playerName,
        });
        if (!result.ok && result.error) {
            toast.warn(result.error);
            reportAppError('multiplayer_cast_vote', new Error(result.error), {
                roomId: room.id,
                roundNumber: room.round_number,
            });
        }
        return result;
    }, [playerName, room, roomSession, toast]);

    const finalizeMultiplayerVoting = useCallback(async () => {
        if (!room || !isHost) return false;

        const result = await finalizeRoomVoting(room.id, room.round_number, roomSession);
        if (!result.ok) {
            toast.error(result.error || 'Failed to finalize votes');
            reportAppError('multiplayer_finalize_votes', new Error(result.error || 'Failed to finalize votes'), {
                roomId: room.id,
                roundNumber: room.round_number,
            });
            return false;
        }

        toast.success('Votes finalized!');
        reportAppEvent('multiplayer_votes_finalized', {
            roomId: room.id,
            roundNumber: room.round_number,
        });
        return true;
    }, [isHost, room, roomSession, toast]);

    const advanceToNextRound = useCallback(async () => {
        if (!room || !isHost) return;

        const nextRound = room.round_number + 1;
        if (roomSession?.hostToken) {
            const result = await advanceRoom(room.id, roomSession);
            if (!result.ok) {
                toast.error(result.error || 'Failed to advance round');
            }
            return;
        }

        if (nextRound > room.total_rounds) {
            await setRoomStatus(room.id, 'finished', roomSession);
            return;
        }

        const moved = await setRoomStatus(room.id, 'waiting', roomSession);
        if (!moved) {
            toast.error('Failed to advance round');
            return;
        }

        setRoom((prev) => prev ? { ...prev, round_number: nextRound, assets: null, status: 'waiting' } : prev);
        setSubmissions([]);
        setVotes([]);
    }, [isHost, room, roomSession, toast]);

    const value = {
        room,
        players,
        submissions,
        votes,
        isHost,
        isMultiplayer,
        roomCode,
        playerName,
        roomPhase,
        allSubmitted,
        hostRoom,
        joinRoomByCode,
        leaveCurrentRoom,
        startMultiplayerRound,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
        castVoteForSubmission,
        finalizeMultiplayerVoting,
        advanceToNextRound,
        cleanup,
    };

    return (
        <RoomContext.Provider value={value}>
            {children}
        </RoomContext.Provider>
    );
}

export function useRoom() {
    const ctx = useContext(RoomContext);
    if (!ctx) {
        throw new Error('useRoom must be used within a RoomProvider');
    }
    return ctx;
}

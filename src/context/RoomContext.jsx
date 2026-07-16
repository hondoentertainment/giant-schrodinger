import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { isBackendEnabled } from '../lib/supabase';
import {
    createRoom,
    joinRoom,
    getRoomById,
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
import { getThemeById, MEDIA_TYPES } from '../data/themes';
import { selectRoundAssets, getAssetKey, loadSelectedAssets } from '../services/assetSelection';
import { scoreSubmission } from '../services/gemini';
import { useGame } from './GameContext';
import { reportAppError, reportAppEvent } from '../lib/telemetry';
import { buildE2EMockRoom, isE2EMockRoomEnabled, subscribeToE2EMockRoom } from '../lib/e2eMockRoom';
import { t } from '../lib/i18n';

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
    const [connectionState, setConnectionState] = useState('connected');
    const [roomSyncState, setRoomSyncState] = useState('idle');
    const [roomClosureReason, setRoomClosureReason] = useState(null);
    const [joinedMidRound, setJoinedMidRound] = useState(false);
    const [joinPhase, setJoinPhase] = useState(null);

    const unsubRef = useRef(null);
    const isHostRef = useRef(false);
    const hydrateRequestRef = useRef(0);
    const reconnectToastShownRef = useRef(false);
    const scoringRoundRef = useRef(null);
    const usedAssetIdsRef = useRef([]);

    const isMultiplayer = !!room;
    const roomCode = room?.code || null;
    const allSubmitted = players.length > 0 && submissions.length >= players.length;
    const isSpectator = Boolean(
        roomSession?.isSpectator
        || roomSession?.role === 'spectator'
        || players.find((p) => p.player_name === playerName)?.is_spectator
    );

    useEffect(() => {
        isHostRef.current = isHost;
    }, [isHost]);

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
        setConnectionState('connected');
        setRoomSyncState('idle');
        setRoomClosureReason(null);
        setJoinedMidRound(false);
        setJoinPhase(null);
        usedAssetIdsRef.current = [];
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

        const shouldLoadRoundState = ['playing', 'revealing', 'results', 'finished'].includes(nextRoom.status);
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

    const resyncRoomSnapshot = useCallback(async (currentRoom = room) => {
        if (!currentRoom?.id) return;

        setRoomSyncState('syncing');
        try {
            const snapshotRoom = await getRoomById(currentRoom.id);
            const nextRoom = snapshotRoom || currentRoom;
            const roomPlayers = await getRoomPlayers(nextRoom.id);

            setRoom(nextRoom);
            setRoomPhase(getRoomPhaseFromStatus(nextRoom.status));
            setPlayers(roomPlayers);
            await hydrateRoomState(nextRoom);
            setRoomSyncState((prev) => (prev === 'syncing' ? 'recovered' : prev));
            window.setTimeout(() => {
                setRoomSyncState((current) => (current === 'recovered' ? 'idle' : current));
            }, 4000);
        } catch (err) {
            setRoomSyncState('idle');
            reportAppError('multiplayer_resync_snapshot', err, { roomId: currentRoom.id });
        }
    }, [hydrateRoomState, room]);

    const setupSubscriptions = useCallback((roomId) => {
        if (unsubRef.current) unsubRef.current();

        const callbacks = {
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
                if (player.is_host) {
                    setRoomClosureReason('host_left');
                    reportAppEvent('multiplayer_host_left', {
                        roomId: room?.id,
                        hostName: player.player_name,
                    });
                    if (!isHostRef.current) {
                        toast.warn(t('room.hostLeftToast', { name: player.player_name || 'The host' }));
                    }
                } else if (player.player_name) {
                    toast.info(t('room.playerLeftToast', { name: player.player_name }));
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
            onConnectionStatus: (status) => {
                if (status === 'SUBSCRIBED') {
                    setConnectionState((prev) => {
                        if (prev !== 'connected' && reconnectToastShownRef.current) {
                            toast.success('Room connection restored');
                            reconnectToastShownRef.current = false;
                        }
                        return 'connected';
                    });
                    setRoom((currentRoom) => {
                        if (currentRoom?.id) resyncRoomSnapshot(currentRoom);
                        return currentRoom;
                    });
                    return;
                }

                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    reconnectToastShownRef.current = true;
                    setConnectionState('reconnecting');
                    reportAppError('multiplayer_realtime_connection', new Error(`Realtime ${status}`), { roomId });
                    return;
                }

                if (status === 'CLOSED') {
                    reconnectToastShownRef.current = true;
                    setConnectionState('disconnected');
                    reportAppError('multiplayer_realtime_connection', new Error('Realtime channel closed'), { roomId });
                }
            },
        };

        const unsub = isE2EMockRoomEnabled()
            ? subscribeToE2EMockRoom(callbacks)
            : subscribeToRoom(roomId, callbacks);

        unsubRef.current = unsub;
    }, [resyncRoomSnapshot, toast]);

    const attemptReconnect = useCallback(() => {
        if (!room?.id) return;
        setConnectionState('reconnecting');
        setupSubscriptions(room.id);
        resyncRoomSnapshot(room);
    }, [resyncRoomSnapshot, room, setupSubscriptions]);

    useEffect(() => {
        if (!room?.id || typeof window === 'undefined') return undefined;

        const handleOffline = () => {
            reconnectToastShownRef.current = true;
            setConnectionState('disconnected');
            reportAppError('multiplayer_browser_offline', new Error('Browser reported offline'), {
                roomId: room.id,
            });
        };
        const handleOnline = () => {
            reconnectToastShownRef.current = true;
            setConnectionState('reconnecting');
            setupSubscriptions(room.id);
            resyncRoomSnapshot(room);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [resyncRoomSnapshot, room, setupSubscriptions]);

    const hostRoom = useCallback(async ({ hostName, themeId, totalRounds, scoringMode }) => {
        if (isE2EMockRoomEnabled()) {
            const { room: mockRoom, players: mockPlayers } = buildE2EMockRoom({
                hostName,
                playerName: 'Guest',
                themeId,
                totalRounds,
                scoringMode,
            });
            setRoom(mockRoom);
            setPlayers(mockPlayers);
            setRoomSession({ playerName: hostName, isHost: true, secureMode: false });
            setIsHost(true);
            setPlayerName(hostName);
            setRoomPhase(getRoomPhaseFromStatus(mockRoom.status));
            setupSubscriptions(mockRoom.id);
            toast.success(`Room ${mockRoom.code} created!`);
            return mockRoom;
        }

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
        setJoinedMidRound(false);
        setJoinPhase(null);
        setRoomClosureReason(null);

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
        if (isE2EMockRoomEnabled()) {
            if (code.toUpperCase().trim() === 'NOPE') {
                toast.error('Room not found');
                return null;
            }
            const { room: mockRoom, players: mockPlayers } = buildE2EMockRoom({
                code: code.toUpperCase().trim() || 'MOCK42',
                hostName: 'Host',
                playerName: name,
                themeId: user?.themeId || 'neon',
                totalRounds: 3,
                scoringMode: user?.scoringMode || 'human',
            });
            setRoom(mockRoom);
            setPlayers(mockPlayers);
            setRoomSession({ playerName: name, isHost: false, secureMode: false });
            setIsHost(false);
            setPlayerName(name);
            setRoomPhase(getRoomPhaseFromStatus(mockRoom.status));
            setupSubscriptions(mockRoom.id);
            toast.success(`Joined room ${mockRoom.code}!`);
            return mockRoom;
        }

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
        const midRound = ['playing', 'revealing', 'results'].includes(result.room.status);
        if (midRound) {
            setJoinedMidRound(true);
            setJoinPhase(result.room.status);
            toast.info(t('room.joinedMidRound'));
        } else {
            setJoinedMidRound(false);
            setJoinPhase(null);
        }
        reportAppEvent('multiplayer_room_joined', {
            secureMode: result.session?.secureMode !== false,
            roomCode: result.room.code,
            joinedMidRound: midRound,
            joinPhase: result.room.status,
        });
        return result.room;
    }, [hydrateRoomState, setupSubscriptions, toast, user?.scoringMode, user?.themeId]);

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

        const [left, right] = selectRoundAssets({
            theme,
            mediaType,
            excludeIds: usedAssetIdsRef.current,
            roundNumber: room.round_number,
            useCustomImages: user?.useCustomImages,
        });
        usedAssetIdsRef.current = [...usedAssetIdsRef.current, getAssetKey(left), getAssetKey(right)].filter(Boolean);

        const resolved = await loadSelectedAssets([left, right]);
        const success = await startRoundApi(room.id, room.round_number, { left: resolved[0], right: resolved[1] }, roomSession);
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
        const scoringKey = `${room.id}:${room.round_number}`;
        if (scoringRoundRef.current === scoringKey) return;
        scoringRoundRef.current = scoringKey;

        try {
            if (scoringMode === 'ai') {
                const theme = getThemeById(room.theme_id);
                const assets = room.assets;
                const roundSubmissions = await getRoundSubmissions(room.id, room.round_number);

                for (const submission of roundSubmissions) {
                    if (submission.score) continue;
                    try {
                        const scoreResult = await scoreSubmission(submission.submission, assets.left, assets.right);
                        if (scoreResult?.isMock) {
                            reportAppEvent('ai_mock_score_fallback', {
                                source: 'multiplayer',
                                roomId: room.id,
                                roundNumber: room.round_number,
                            });
                        }
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

            const moved = await setRoomStatus(room.id, 'revealing', roomSession);
            if (!moved) {
                scoringRoundRef.current = null;
                toast.error('Failed to reveal answers');
            }
        } catch (err) {
            scoringRoundRef.current = null;
            throw err;
        }
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
        } else if (result.ok) {
            reportAppEvent('multiplayer_vote_cast', {
                roomId: room.id,
                roundNumber: room.round_number,
            });
        }
        return result;
    }, [playerName, room, roomSession, toast]);

    const finalizeMultiplayerVoting = useCallback(async () => {
        if (!room || !isHost) return false;

        setRoomSyncState('finalizing');
        const result = await finalizeRoomVoting(room.id, room.round_number, roomSession);
        if (!result.ok) {
            setRoomSyncState('idle');
            toast.error(result.error || 'Failed to finalize votes');
            reportAppError('multiplayer_finalize_votes', new Error(result.error || 'Failed to finalize votes'), {
                roomId: room.id,
                roundNumber: room.round_number,
            });
            return false;
        }

        setRoomSyncState('idle');
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
        connectionState,
        roomSyncState,
        roomClosureReason,
        joinedMidRound,
        joinPhase,
        isSpectator,
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
        attemptReconnect,
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

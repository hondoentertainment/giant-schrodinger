import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    broadcastRoomReaction,
} from '../services/multiplayer';
import { getThemeById, MEDIA_TYPES } from '../data/themes';
import { selectRoundAssets, getAssetKey, loadSelectedAssets } from '../services/assetSelection';
import { scoreSubmission } from '../services/gemini';
import { useGame } from './GameContext';
import { reportAppError, reportAppEvent } from '../lib/telemetry';
import { getActivePlayers } from '../lib/roomPlayers';
import { trackRoundComplete, trackEvent } from '../services/analytics';
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
    const [passThePhone, setPassThePhone] = useState(false);
    const [couchSessions, setCouchSessions] = useState([]);
    const [liveReactions, setLiveReactions] = useState([]);

    const unsubRef = useRef(null);
    const isHostRef = useRef(false);
    const hydrateRequestRef = useRef(0);
    const reconnectToastShownRef = useRef(false);
    const scoringRoundRef = useRef(null);
    const usedAssetIdsRef = useRef([]);

    const isMultiplayer = !!room;
    const roomCode = room?.code || null;
    const activePlayers = useMemo(() => getActivePlayers(players), [players]);
    const allSubmitted = activePlayers.length > 0 && submissions.length >= activePlayers.length;
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
        setPassThePhone(false);
        setCouchSessions([]);
        setLiveReactions([]);
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
            onReaction: (reaction) => {
                if (!reaction?.emoji) return;
                setLiveReactions((current) => {
                    const id = reaction.ts || reaction.id || Date.now();
                    if (current.some((entry) => entry.id === id)) return current;
                    return [...current.slice(-7), {
                        emoji: reaction.emoji,
                        from: reaction.from,
                        id,
                    }];
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

    const joinRoomByCode = useCallback(async (code, name, avatar, options = {}) => {
        const spectator = Boolean(options.spectator);
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
            setRoomSession({
                playerName: name,
                isHost: false,
                secureMode: false,
                isSpectator: spectator,
                role: spectator ? 'spectator' : 'player',
            });
            setIsHost(false);
            setPlayerName(name);
            setRoomPhase(getRoomPhaseFromStatus(mockRoom.status));
            setupSubscriptions(mockRoom.id);
            toast.success(spectator ? `Watching room ${mockRoom.code}` : `Joined room ${mockRoom.code}!`);
            return mockRoom;
        }

        if (!isBackendEnabled()) {
            toast.error('Multiplayer requires Supabase - check your .env');
            return null;
        }

        const result = await joinRoom(code, name, avatar, { spectator });
        if (result?.error) {
            toast.error(result.error);
            return null;
        }
        if (!result?.room) {
            toast.error(spectator ? 'Failed to watch room' : 'Failed to join room');
            return null;
        }

        setRoom(result.room);
        setRoomSession({
            ...(result.session || {}),
            isSpectator: spectator || result.session?.isSpectator,
            role: spectator || result.session?.isSpectator ? 'spectator' : result.session?.role,
        });
        setIsHost(false);
        setPlayerName(result.session?.playerName || name);
        setRoomPhase(getRoomPhaseFromStatus(result.room.status));

        const roomPlayers = await getRoomPlayers(result.room.id);
        setPlayers(roomPlayers);
        await hydrateRoomState(result.room);
        setupSubscriptions(result.room.id);

        toast.success(spectator ? `Watching room ${result.room.code}` : `Joined room ${result.room.code}!`);
        const midRound = ['playing', 'revealing', 'results'].includes(result.room.status);
        if (midRound) {
            setJoinedMidRound(true);
            setJoinPhase(result.room.status);
            if (!spectator) toast.info(t('room.joinedMidRound'));
        } else {
            setJoinedMidRound(false);
            setJoinPhase(null);
        }
        reportAppEvent(spectator ? 'multiplayer_room_spectated' : 'multiplayer_room_joined', {
            secureMode: result.session?.secureMode !== false,
            roomCode: result.room.code,
            joinedMidRound: midRound,
            joinPhase: result.room.status,
            spectator,
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

    const rematchRoom = useCallback(async () => {
        if (!room || !isHost || !playerName) return null;

        const settings = {
            hostName: playerName,
            themeId: room.theme_id,
            totalRounds: room.total_rounds || 3,
            scoringMode: room.scoring_mode || 'human',
        };

        if (room.id) {
            await leaveRoom(room.id, playerName, roomSession);
        }
        cleanup();

        const newRoom = await hostRoom(settings);
        if (newRoom?.code) {
            toast.success(`Rematch ready — new code ${newRoom.code}. Share it with friends.`);
            reportAppEvent('multiplayer_rematch_created', {
                roomCode: newRoom.code,
                themeId: settings.themeId,
                scoringMode: settings.scoringMode,
            });
        }
        return newRoom;
    }, [cleanup, hostRoom, isHost, playerName, room, roomSession, toast]);

    const startMultiplayerRound = useCallback(async (roundOverride) => {
        if (!room || !isHost) return false;

        const roundNumber = roundOverride ?? room.round_number;
        const theme = getThemeById(room.theme_id);
        const mediaType = user?.mediaType || MEDIA_TYPES.IMAGE;

        const [left, right] = selectRoundAssets({
            theme,
            mediaType,
            excludeIds: usedAssetIdsRef.current,
            roundNumber,
            useCustomImages: user?.useCustomImages,
        });
        usedAssetIdsRef.current = [...usedAssetIdsRef.current, getAssetKey(left), getAssetKey(right)].filter(Boolean);

        const resolved = await loadSelectedAssets([left, right]);
        const success = await startRoundApi(room.id, roundNumber, { left: resolved[0], right: resolved[1] }, roomSession);
        if (!success) {
            toast.error('Failed to start round');
            return false;
        }
        return true;
    }, [isHost, room, roomSession, toast, user?.mediaType, user?.useCustomImages]);

    const submitMultiplayerAnswer = useCallback(async (submission, options = {}) => {
        if (!room || !playerName) return false;

        const writerName = options.asPlayer || playerName;
        const writerSession = writerName === playerName
            ? roomSession
            : couchSessions.find((session) => session?.playerName === writerName) || roomSession;

        const success = await submitAnswer(room.id, room.round_number, writerName, submission, {
            ...writerSession,
            playerName: writerName,
        });
        if (!success) {
            toast.error('Failed to submit answer');
            return false;
        }
        toast.success(`${writerName === playerName ? 'Answer' : `${writerName}'s answer`} submitted!`);
        return true;
    }, [couchSessions, playerName, room, roomSession, toast]);

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
                trackRoundComplete(null, 'multiplayer', null, {
                    judgeMode: 'ai',
                    roundNumber: room.round_number,
                    totalRounds: room.total_rounds,
                    roomId: room.id,
                    submissionCount: roundSubmissions.length,
                });
                trackEvent('multiplayer_round_complete', {
                    roomId: room.id,
                    roundNumber: room.round_number,
                    judgeMode: 'ai',
                });
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
        trackRoundComplete(null, 'multiplayer', null, {
            judgeMode: room.scoring_mode || 'human',
            roundNumber: room.round_number,
            totalRounds: room.total_rounds,
            roomId: room.id,
            voteCount: votes.length,
        });
        trackEvent('multiplayer_round_complete', {
            roomId: room.id,
            roundNumber: room.round_number,
            judgeMode: room.scoring_mode || 'human',
        });
        return true;
    }, [isHost, room, roomSession, toast, votes.length]);

    const finishMultiplayerGame = useCallback(async () => {
        if (!room || !isHost) return false;
        const moved = await setRoomStatus(room.id, 'finished', roomSession);
        if (!moved) {
            toast.error('Failed to finish the game');
            return false;
        }
        setRoom((prev) => (prev ? { ...prev, status: 'finished' } : prev));
        setRoomPhase('finished');
        return true;
    }, [isHost, room, roomSession, toast]);

    const advanceToNextRound = useCallback(async () => {
        if (!room || !isHost) return;

        const nextRound = room.round_number + 1;
        if (nextRound > room.total_rounds) {
            if (roomSession?.hostToken) {
                const result = await advanceRoom(room.id, roomSession);
                if (result.ok) return;
            }
            await finishMultiplayerGame();
            return;
        }

        if (roomSession?.hostToken) {
            const result = await advanceRoom(room.id, roomSession);
            if (!result.ok) {
                toast.error(result.error || 'Failed to advance round');
                return;
            }
        } else {
            const moved = await setRoomStatus(room.id, 'waiting', roomSession);
            if (!moved) {
                toast.error('Failed to advance round');
                return;
            }
        }

        setSubmissions([]);
        setVotes([]);
        setLiveReactions([]);
        setRoom((prev) => (prev ? { ...prev, round_number: nextRound, assets: null, status: 'waiting' } : prev));

        // Skip full lobby reset — start the next round immediately
        const started = await startMultiplayerRound(nextRound);
        if (!started) {
            toast.info('Next round ready — host can start from the lobby');
        }
    }, [finishMultiplayerGame, isHost, room, roomSession, startMultiplayerRound, toast]);

    const addCouchWriter = useCallback(async (name, avatar) => {
        const trimmed = String(name || '').trim();
        if (!room?.code || !trimmed) return false;
        if (players.some((player) => player.player_name.toLowerCase() === trimmed.toLowerCase())) {
            toast.warn('Name already in the room');
            return false;
        }

        if (isE2EMockRoomEnabled()) {
            const guest = {
                id: `couch-${trimmed.toLowerCase()}`,
                player_name: trimmed,
                avatar: avatar || '📱',
                is_host: false,
            };
            setPlayers((prev) => [...prev, guest]);
            setCouchSessions((prev) => [...prev, { playerName: trimmed, playerToken: null }]);
            setPassThePhone(true);
            toast.success(`${trimmed} is on this phone`);
            return true;
        }

        const result = await joinRoom(room.code, trimmed, avatar || null);
        if (result?.error || !result?.room) {
            toast.error(result?.error || 'Could not add writer');
            return false;
        }
        setCouchSessions((prev) => [...prev, result.session]);
        setPassThePhone(true);
        const roomPlayers = await getRoomPlayers(room.id);
        setPlayers(roomPlayers);
        toast.success(`${trimmed} is on this phone`);
        return true;
    }, [players, room, toast]);

    const sendRoomReaction = useCallback((emoji) => {
        if (!emoji) return;
        const reaction = {
            emoji,
            from: playerName || 'Someone',
            ts: Date.now(),
            roundNumber: room?.round_number,
        };
        setLiveReactions((current) => {
            if (current.some((entry) => entry.id === reaction.ts)) return current;
            return [...current.slice(-7), { ...reaction, id: reaction.ts }];
        });
        if (isE2EMockRoomEnabled() && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vwf:room-reaction', { detail: reaction }));
            return;
        }
        if (room?.id) {
            broadcastRoomReaction(room.id, reaction);
        }
    }, [playerName, room?.id, room?.round_number]);

    const value = {
        room,
        players,
        activePlayers,
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
        passThePhone,
        couchSessions,
        liveReactions,
        allSubmitted,
        hostRoom,
        joinRoomByCode,
        leaveCurrentRoom,
        rematchRoom,
        startMultiplayerRound,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
        castVoteForSubmission,
        finalizeMultiplayerVoting,
        advanceToNextRound,
        finishMultiplayerGame,
        attemptReconnect,
        setPassThePhone,
        addCouchWriter,
        sendRoomReaction,
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

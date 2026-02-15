import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { isBackendEnabled, supabase } from '../lib/supabase';
import {
    createRoom,
    joinRoom,
    getRoomPlayers,
    getRoundSubmissions,
    leaveRoom,
    startRound as startRoundApi,
    setRoomStatus,
    submitAnswer,
    updateSubmissionScore,
    subscribeToRoom,
} from '../services/multiplayer';
import { buildThemeAssets, getThemeById } from '../data/themes';
import { scoreSubmission } from '../services/gemini';

const RoomContext = createContext();

export function RoomProvider({ children }) {
    const { toast } = useToast();

    // Room state
    const [room, setRoom] = useState(null);           // The room DB row
    const [players, setPlayers] = useState([]);        // Room players list
    const [submissions, setSubmissions] = useState([]); // Current round's submissions
    const [isHost, setIsHost] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [roomPhase, setRoomPhase] = useState('none'); // none | lobby | playing | revealing | finished

    const unsubRef = useRef(null);

    // Derived state
    const isMultiplayer = !!room;
    const roomCode = room?.code || null;
    const allSubmitted = players.length > 0 && submissions.length >= players.length;

    // ============================================================
    // Cleanup
    // ============================================================
    const cleanup = useCallback(() => {
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        setRoom(null);
        setPlayers([]);
        setSubmissions([]);
        setIsHost(false);
        setRoomPhase('none');
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (unsubRef.current) unsubRef.current();
        };
    }, []);

    // ============================================================
    // Realtime handlers
    // ============================================================
    const setupSubscriptions = useCallback((roomId) => {
        if (unsubRef.current) unsubRef.current();

        const unsub = subscribeToRoom(roomId, {
            onRoomUpdate: (updatedRoom) => {
                setRoom(updatedRoom);
                const newStatus = updatedRoom.status;
                if (newStatus === 'playing') {
                    setRoomPhase('playing');
                    setSubmissions([]); // Clear submissions for new round
                } else if (newStatus === 'revealing') {
                    setRoomPhase('revealing');
                } else if (newStatus === 'finished') {
                    setRoomPhase('finished');
                } else if (newStatus === 'waiting') {
                    setRoomPhase('lobby');
                }
            },
            onPlayerJoin: (player) => {
                setPlayers((prev) => {
                    if (prev.some((p) => p.id === player.id)) return prev;
                    return [...prev, player];
                });
                toast.info(`${player.player_name} joined the room`);
            },
            onPlayerLeave: (player) => {
                setPlayers((prev) => prev.filter((p) => p.id !== player.id));
                if (player.player_name) {
                    toast.info(`${player.player_name} left the room`);
                }
            },
            onSubmission: (sub) => {
                setSubmissions((prev) => {
                    if (prev.some((s) => s.id === sub.id)) return prev;
                    return [...prev, sub];
                });
            },
            onSubmissionUpdate: (sub) => {
                setSubmissions((prev) =>
                    prev.map((s) => (s.id === sub.id ? sub : s))
                );
            },
        });

        unsubRef.current = unsub;
    }, [toast]);

    // ============================================================
    // Actions
    // ============================================================

    const hostRoom = useCallback(async ({ hostName, themeId, totalRounds, scoringMode }) => {
        if (!isBackendEnabled()) {
            toast.error('Multiplayer requires Supabase — check your .env');
            return null;
        }

        const roomData = await createRoom({ hostName, themeId, totalRounds, scoringMode });
        if (!roomData) {
            toast.error('Failed to create room');
            return null;
        }

        setRoom(roomData);
        setIsHost(true);
        setPlayerName(hostName);
        setRoomPhase('lobby');

        // Fetch initial players
        const roomPlayers = await getRoomPlayers(roomData.id);
        setPlayers(roomPlayers);

        // Subscribe to realtime
        setupSubscriptions(roomData.id);

        toast.success(`Room ${roomData.code} created!`);
        return roomData;
    }, [toast, setupSubscriptions]);

    const joinRoomByCode = useCallback(async (code, name, avatar) => {
        if (!isBackendEnabled()) {
            toast.error('Multiplayer requires Supabase — check your .env');
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
        setIsHost(false);
        setPlayerName(name);
        setRoomPhase('lobby');

        // Fetch current players
        const roomPlayers = await getRoomPlayers(result.room.id);
        setPlayers(roomPlayers);

        // Subscribe to realtime
        setupSubscriptions(result.room.id);

        toast.success(`Joined room ${result.room.code}!`);
        return result.room;
    }, [toast, setupSubscriptions]);

    const leaveCurrentRoom = useCallback(async () => {
        if (room && playerName) {
            await leaveRoom(room.id, playerName);
        }
        cleanup();
        toast.info('Left the room');
    }, [room, playerName, cleanup, toast]);

    const startMultiplayerRound = useCallback(async () => {
        if (!room || !isHost) return false;

        const theme = getThemeById(room.theme_id);
        const [left, right] = buildThemeAssets(theme, 2);
        const assets = { left, right };

        const success = await startRoundApi(room.id, room.round_number, assets);
        if (!success) {
            toast.error('Failed to start round');
            return false;
        }
        return true;
    }, [room, isHost, toast]);

    const submitMultiplayerAnswer = useCallback(async (submission) => {
        if (!room || !playerName) return false;

        const success = await submitAnswer(room.id, room.round_number, playerName, submission);
        if (!success) {
            toast.error('Failed to submit answer');
            return false;
        }
        toast.success('Answer submitted!');
        return true;
    }, [room, playerName, toast]);

    const scoreAllSubmissions = useCallback(async () => {
        if (!room || !isHost) return;
        
        const scoringMode = room.scoring_mode || 'ai';
        
        if (scoringMode === 'ai') {
            // Handle AI scoring
            const theme = getThemeById(room.theme_id);
            const assets = room.assets;
            
            // Fetch all submissions for this round
            const subs = await getRoundSubmissions(room.id, room.round_number);
            
            for (const sub of subs) {
                if (sub.score) continue; // Already scored
                try {
                    const scoreResult = await scoreSubmission(sub.submission, assets.left, assets.right);
                    const multiplier = theme?.modifier?.scoreMultiplier || 1;
                    const finalScore = Math.min(10, Math.max(1, Math.round(scoreResult.score * multiplier)));
                    await updateSubmissionScore(sub.id, {
                        ...scoreResult,
                        finalScore,
                        scoreMultiplier: multiplier,
                    });
                } catch (err) {
                    console.warn('Failed to score submission:', err);
                }
            }
            
        } else if (scoringMode === 'human' || scoringMode === 'hybrid' || scoringMode === 'friends') {
            // Handle human scoring - create shared round for friends to judge
            try {
                const { saveSharedRound } = await import('../services/backend');
                
                const subs = await getRoundSubmissions(room.id, room.round_number);
                
                // Create a shared round for this multiplayer round
                const sharedRound = {
                    assets: room.assets,
                    submission: createAggregateSubmission(subs),
                    shareFrom: `multiplayer-${scoringMode}`,
                    roomCode: room.code,
                    theme: room.theme_id,
                };
                
                await saveSharedRound(sharedRound);
                
                await setRoomStatus(room.id, 'revealing');
                toast.info('Round set up for friend judging! Share the link with others.');
                
            } catch (err) {
                console.warn('Failed to set up friend judging:', err);
                await setRoomStatus(room.id, 'revealing');
                toast.warn('Failed to set up friend judging — showing results anyway.');
            }
        }

        // Move to revealing
        await setRoomStatus(room.id, 'revealing');
    }, [room, isHost]);

    const advanceToNextRound = useCallback(async () => {
        if (!room || !isHost) return;

        const nextRound = room.round_number + 1;
        if (nextRound > room.total_rounds) {
            await setRoomStatus(room.id, 'finished');
            return;
        }

        // Update room to waiting with incremented round
        try {
            if (!isBackendEnabled() || !supabase) {
                toast.error('Supabase is not configured');
                return;
            }
            const { error } = await supabase
                .from('rooms')
                .update({ status: 'waiting', round_number: nextRound, assets: null })
                .eq('id', room.id);
            if (error) throw error;
        } catch (err) {
            toast.error('Failed to advance round');
        }
    }, [room, isHost, toast]);

    const value = {
        // State
        room,
        players,
        submissions,
        isHost,
        isMultiplayer,
        roomCode,
        playerName,
        roomPhase,
        allSubmitted,

        // Actions
        hostRoom,
        joinRoomByCode,
        leaveCurrentRoom,
        startMultiplayerRound,
        submitMultiplayerAnswer,
        scoreAllSubmissions,
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

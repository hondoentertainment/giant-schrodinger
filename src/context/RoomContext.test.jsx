import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
    multiplayer: {
        createRoom: vi.fn(),
        joinRoom: vi.fn(),
        getRoomById: vi.fn(),
        getRoomPlayers: vi.fn(),
        getRoundSubmissions: vi.fn(),
        getRoundVotes: vi.fn(),
        leaveRoom: vi.fn(),
        startRound: vi.fn(),
        setRoomStatus: vi.fn(),
        submitAnswer: vi.fn(),
        updateSubmissionScore: vi.fn(),
        castVote: vi.fn(),
        finalizeRoomVoting: vi.fn(),
        advanceRoom: vi.fn(),
        subscribeToRoom: vi.fn(),
    },
}));

vi.mock('./ToastContext', () => ({
    useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('./GameContext', () => ({
    useGame: () => ({ user: { avatar: 'A' } }),
}));

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: () => true,
}));

vi.mock('../services/gemini', () => ({
    scoreSubmission: vi.fn(),
}));

vi.mock('../services/customImages', () => ({
    getCustomImages: () => [],
}));

vi.mock('../services/multiplayer', () => ({
    createRoom: mocks.multiplayer.createRoom,
    joinRoom: mocks.multiplayer.joinRoom,
    getRoomById: mocks.multiplayer.getRoomById,
    getRoomPlayers: mocks.multiplayer.getRoomPlayers,
    getRoundSubmissions: mocks.multiplayer.getRoundSubmissions,
    getRoundVotes: mocks.multiplayer.getRoundVotes,
    leaveRoom: mocks.multiplayer.leaveRoom,
    startRound: mocks.multiplayer.startRound,
    setRoomStatus: mocks.multiplayer.setRoomStatus,
    submitAnswer: mocks.multiplayer.submitAnswer,
    updateSubmissionScore: mocks.multiplayer.updateSubmissionScore,
    castVote: mocks.multiplayer.castVote,
    finalizeRoomVoting: mocks.multiplayer.finalizeRoomVoting,
    advanceRoom: mocks.multiplayer.advanceRoom,
    subscribeToRoom: mocks.multiplayer.subscribeToRoom,
}));

import { RoomProvider, useRoom } from './RoomContext';

function RoomProbe() {
    const {
        joinRoomByCode,
        hostRoom,
        rematchRoom,
        roomPhase,
        submissions,
        votes,
        players,
        roomClosureReason,
        roomCode,
        isHost,
    } = useRoom();

    return (
        <div>
            <button type="button" onClick={() => joinRoomByCode('ABCD12', 'Ava', 'A')}>
                Join
            </button>
            <button
                type="button"
                onClick={() => hostRoom({
                    hostName: 'Host',
                    themeId: 'neon',
                    totalRounds: 5,
                    scoringMode: 'ai',
                })}
            >
                Host
            </button>
            <button type="button" onClick={() => rematchRoom()}>
                Rematch
            </button>
            <div data-testid="phase">{roomPhase}</div>
            <div data-testid="players">{players.length}</div>
            <div data-testid="submissions">{submissions.length}</div>
            <div data-testid="votes">{votes.length}</div>
            <div data-testid="closure">{roomClosureReason || 'none'}</div>
            <div data-testid="code">{roomCode || ''}</div>
            <div data-testid="host">{isHost ? 'yes' : 'no'}</div>
        </div>
    );
}

describe('RoomProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.multiplayer.subscribeToRoom.mockReturnValue(vi.fn());
        mocks.multiplayer.getRoomById.mockResolvedValue(null);
        mocks.multiplayer.getRoomPlayers.mockResolvedValue([
            { id: 'host', player_name: 'Host', is_host: true, avatar: 'H' },
            { id: 'guest', player_name: 'Ava', is_host: false, avatar: 'A' },
        ]);
        mocks.multiplayer.getRoundSubmissions.mockResolvedValue([
            { id: 'sub-1', player_name: 'Host', submission: 'alpha' },
            { id: 'sub-2', player_name: 'Ava', submission: 'beta' },
        ]);
        mocks.multiplayer.getRoundVotes.mockResolvedValue([
            { id: 'vote-1', voter_name: 'Host', submission_id: 'sub-2' },
            { id: 'vote-2', voter_name: 'Ava', submission_id: 'sub-1' },
        ]);
    });

    it('hydrates active results rooms when joining by code', async () => {
        mocks.multiplayer.joinRoom.mockResolvedValue({
            room: {
                id: 'room-1',
                code: 'ABCD12',
                status: 'results',
                scoring_mode: 'human',
                round_number: 2,
                total_rounds: 3,
            },
            session: {
                playerName: 'Ava',
                secureMode: true,
            },
        });

        render(
            <RoomProvider>
                <RoomProbe />
            </RoomProvider>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Join' }));

        await waitFor(() => {
            expect(screen.getByTestId('phase')).toHaveTextContent('results');
            expect(screen.getByTestId('players')).toHaveTextContent('2');
            expect(screen.getByTestId('submissions')).toHaveTextContent('2');
            expect(screen.getByTestId('votes')).toHaveTextContent('2');
        });

        expect(mocks.multiplayer.getRoundSubmissions).toHaveBeenCalledWith('room-1', 2);
        expect(mocks.multiplayer.getRoundVotes).toHaveBeenCalledWith('room-1', 2);
        expect(mocks.multiplayer.subscribeToRoom).toHaveBeenCalledWith('room-1', expect.any(Object));
    });

    it('resyncs room snapshot, players, submissions, and votes when realtime reconnects', async () => {
        mocks.multiplayer.joinRoom.mockResolvedValue({
            room: {
                id: 'room-1',
                code: 'ABCD12',
                status: 'playing',
                scoring_mode: 'human',
                round_number: 1,
                total_rounds: 3,
            },
            session: {
                playerName: 'Ava',
                secureMode: true,
            },
        });
        mocks.multiplayer.getRoundSubmissions.mockResolvedValueOnce([
            { id: 'initial-sub', player_name: 'Ava', submission: 'before reconnect' },
        ]);
        mocks.multiplayer.getRoundVotes.mockResolvedValueOnce([]);

        render(
            <RoomProvider>
                <RoomProbe />
            </RoomProvider>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Join' }));

        await waitFor(() => {
            expect(screen.getByTestId('phase')).toHaveTextContent('playing');
            expect(screen.getByTestId('submissions')).toHaveTextContent('1');
        });

        mocks.multiplayer.getRoomById.mockResolvedValue({
            id: 'room-1',
            code: 'ABCD12',
            status: 'results',
            scoring_mode: 'human',
            round_number: 2,
            total_rounds: 3,
        });
        mocks.multiplayer.getRoomPlayers.mockResolvedValue([
            { id: 'host', player_name: 'Host', is_host: true, avatar: 'H' },
            { id: 'guest', player_name: 'Ava', is_host: false, avatar: 'A' },
            { id: 'late', player_name: 'Lee', is_host: false, avatar: 'L' },
        ]);
        mocks.multiplayer.getRoundSubmissions.mockResolvedValue([
            { id: 'sub-1', player_name: 'Host', submission: 'alpha' },
            { id: 'sub-2', player_name: 'Ava', submission: 'beta' },
        ]);
        mocks.multiplayer.getRoundVotes.mockResolvedValue([
            { id: 'vote-1', voter_name: 'Host', submission_id: 'sub-2' },
        ]);

        const callbacks = mocks.multiplayer.subscribeToRoom.mock.calls.at(-1)[1];
        await act(async () => {
            callbacks.onConnectionStatus('SUBSCRIBED');
        });

        await waitFor(() => {
            expect(screen.getByTestId('phase')).toHaveTextContent('results');
            expect(screen.getByTestId('players')).toHaveTextContent('3');
            expect(screen.getByTestId('submissions')).toHaveTextContent('2');
            expect(screen.getByTestId('votes')).toHaveTextContent('1');
        }, { timeout: 10000 });

        expect(mocks.multiplayer.getRoomById).toHaveBeenCalledWith('room-1');
        expect(mocks.multiplayer.getRoundSubmissions).toHaveBeenLastCalledWith('room-1', 2);
        expect(mocks.multiplayer.getRoundVotes).toHaveBeenLastCalledWith('room-1', 2);
    });

    it('marks roomClosureReason when the host leaves', async () => {
        mocks.multiplayer.joinRoom.mockResolvedValue({
            room: {
                id: 'room-1',
                code: 'ABCD12',
                status: 'playing',
                scoring_mode: 'human',
                round_number: 1,
                total_rounds: 3,
            },
            session: {
                playerName: 'Ava',
                secureMode: true,
            },
        });

        render(
            <RoomProvider>
                <RoomProbe />
            </RoomProvider>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Join' }));

        const callbacks = mocks.multiplayer.subscribeToRoom.mock.calls.at(-1)[1];
        await act(async () => {
            callbacks.onPlayerLeave({ id: 'host', player_name: 'Host', is_host: true });
        });

        expect(screen.getByTestId('closure')).toHaveTextContent('host_left');
        expect(mocks.toast.warn).toHaveBeenCalled();
    });

    it('rematchRoom leaves the current room and hosts a new one with the same settings', async () => {
        mocks.multiplayer.createRoom
            .mockResolvedValueOnce({
                room: {
                    id: 'room-1',
                    code: 'OLD123',
                    status: 'lobby',
                    theme_id: 'neon',
                    total_rounds: 5,
                    scoring_mode: 'ai',
                    round_number: 1,
                },
                session: { playerName: 'Host', secureMode: true },
            })
            .mockResolvedValueOnce({
                room: {
                    id: 'room-2',
                    code: 'NEW456',
                    status: 'lobby',
                    theme_id: 'neon',
                    total_rounds: 5,
                    scoring_mode: 'ai',
                    round_number: 1,
                },
                session: { playerName: 'Host', secureMode: true },
            });
        mocks.multiplayer.leaveRoom.mockResolvedValue(undefined);
        mocks.multiplayer.getRoomPlayers.mockResolvedValue([
            { id: 'host', player_name: 'Host', is_host: true, avatar: 'H' },
        ]);

        render(
            <RoomProvider>
                <RoomProbe />
            </RoomProvider>
        );

        await userEvent.click(screen.getByRole('button', { name: 'Host' }));
        await waitFor(() => {
            expect(screen.getByTestId('code')).toHaveTextContent('OLD123');
            expect(screen.getByTestId('host')).toHaveTextContent('yes');
        });

        await userEvent.click(screen.getByRole('button', { name: 'Rematch' }));

        await waitFor(() => {
            expect(mocks.multiplayer.leaveRoom).toHaveBeenCalledWith('room-1', 'Host', expect.anything());
            expect(mocks.multiplayer.createRoom).toHaveBeenLastCalledWith(expect.objectContaining({
                hostName: 'Host',
                themeId: 'neon',
                totalRounds: 5,
                scoringMode: 'ai',
            }));
            expect(screen.getByTestId('code')).toHaveTextContent('NEW456');
        });
        expect(mocks.toast.success).toHaveBeenCalledWith(
            expect.stringMatching(/Rematch ready — new code NEW456/)
        );
    });
});

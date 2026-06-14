import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    const { joinRoomByCode, roomPhase, submissions, votes, players } = useRoom();

    return (
        <div>
            <button type="button" onClick={() => joinRoomByCode('ABCD12', 'Ava', 'A')}>
                Join
            </button>
            <div data-testid="phase">{roomPhase}</div>
            <div data-testid="players">{players.length}</div>
            <div data-testid="submissions">{submissions.length}</div>
            <div data-testid="votes">{votes.length}</div>
        </div>
    );
}

describe('RoomProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.multiplayer.subscribeToRoom.mockReturnValue(vi.fn());
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
});

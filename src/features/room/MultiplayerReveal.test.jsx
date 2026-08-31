import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    roomState: {
        room: {
            id: 'room-1',
            round_number: 1,
            total_rounds: 3,
            theme_id: 'neon',
            scoring_mode: 'human',
        },
        players: [
            { id: 'p-1', player_name: 'Alex', avatar: 'A' },
            { id: 'p-2', player_name: 'Blair', avatar: 'B' },
        ],
        submissions: [
            { id: 'sub-1', player_name: 'Alex', submission: 'alpha' },
            { id: 'sub-2', player_name: 'Blair', submission: 'beta' },
        ],
        votes: [
            { id: 'vote-1', voter_name: 'Alex', submission_id: 'sub-2' },
        ],
        isHost: false,
        roomPhase: 'revealing',
        playerName: 'Alex',
        connectionState: 'connected',
        attemptReconnect: vi.fn(),
        castVoteForSubmission: vi.fn(),
        finalizeMultiplayerVoting: vi.fn(),
        advanceToNextRound: vi.fn(),
        leaveCurrentRoom: vi.fn(),
        rematchRoom: vi.fn(),
        finishMultiplayerGame: vi.fn().mockResolvedValue(true),
        sendRoomReaction: vi.fn(),
        liveReactions: [],
    },
    toast: {
        success: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
    getRoomSubmissions: vi.fn(),
}));

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => mocks.roomState,
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('../../data/themes', () => ({
    getThemeById: () => ({
        modifier: {
            scoreMultiplier: 1,
        },
    }),
}));

vi.mock('../../services/multiplayer', () => ({
    getRoomSubmissions: mocks.getRoomSubmissions,
}));

vi.mock('../../services/sounds', () => ({
    playScoreReveal: vi.fn(),
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

import { MultiplayerReveal } from './MultiplayerReveal';

describe('MultiplayerReveal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.roomState.connectionState = 'connected';
        mocks.roomState.isHost = false;
        mocks.roomState.roomPhase = 'revealing';
        mocks.roomState.room = {
            id: 'room-1',
            round_number: 1,
            total_rounds: 3,
            theme_id: 'neon',
            scoring_mode: 'human',
        };
        mocks.roomState.liveReactions = [];
        mocks.roomState.submissions = [
            { id: 'sub-1', player_name: 'Alex', submission: 'alpha' },
            { id: 'sub-2', player_name: 'Blair', submission: 'beta' },
        ];
        mocks.getRoomSubmissions.mockResolvedValue(mocks.roomState.submissions);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('recovers an existing vote and shows vote progress during manual judging', async () => {
        render(<MultiplayerReveal />);

        for (let i = 0; i < 6; i += 1) {
            await act(async () => {
                await vi.advanceTimersByTimeAsync(1000);
            });
        }

        expect(screen.getByText(/Your vote is locked in/i)).toBeInTheDocument();
        expect(screen.getByText(/Votes locked in: 1\/2/i)).toBeInTheDocument();
        expect(screen.getByText(/Voted/i)).toBeInTheDocument();
    });

    it('shows connection recovery controls during reveal when disconnected', async () => {
        mocks.roomState.connectionState = 'disconnected';
        render(<MultiplayerReveal />);

        expect(screen.getByText(/Disconnected from the room/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('shows Rematch for the host when the game is finished', async () => {
        vi.useRealTimers();
        mocks.roomState.isHost = true;
        mocks.roomState.roomPhase = 'finished';
        mocks.roomState.room = {
            ...mocks.roomState.room,
            status: 'finished',
            round_number: 3,
            total_rounds: 3,
        };

        render(<MultiplayerReveal />);

        expect(await screen.findByRole('button', { name: /Rematch/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Lobby/i })).toBeInTheDocument();
    });

    it('calls rematchRoom when the host clicks Rematch', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        mocks.roomState.isHost = true;
        mocks.roomState.roomPhase = 'finished';
        mocks.roomState.rematchRoom.mockResolvedValue({ code: 'NEW123' });
        mocks.roomState.room = {
            ...mocks.roomState.room,
            status: 'finished',
            round_number: 3,
            total_rounds: 3,
        };

        render(<MultiplayerReveal />);
        await user.click(await screen.findByRole('button', { name: /Rematch/i }));
        expect(mocks.roomState.rematchRoom).toHaveBeenCalled();
    });

    it('attaches a reaction to a specific scored line', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        mocks.roomState.roomPhase = 'results';
        mocks.roomState.room = {
            ...mocks.roomState.room,
            status: 'results',
            scoring_mode: 'ai',
        };
        mocks.roomState.submissions = [
            { id: 'sub-1', player_name: 'Alex', submission: 'alpha', score: { finalScore: 8 } },
            { id: 'sub-2', player_name: 'Blair', submission: 'beta', score: { finalScore: 6 } },
        ];

        render(<MultiplayerReveal />);
        await user.click(await screen.findByRole('button', { name: /React 🔥 to Alex/i }));
        expect(mocks.roomState.sendRoomReaction).toHaveBeenCalledWith('🔥', { entryId: 'sub-1' });
    });
});

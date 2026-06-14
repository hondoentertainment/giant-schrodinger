import React from 'react';
import { act, render, screen } from '@testing-library/react';
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
        castVoteForSubmission: vi.fn(),
        finalizeMultiplayerVoting: vi.fn(),
        advanceToNextRound: vi.fn(),
        leaveCurrentRoom: vi.fn(),
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

import { MultiplayerReveal } from './MultiplayerReveal';

describe('MultiplayerReveal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const soundMocks = vi.hoisted(() => ({
    playSubmitSound: vi.fn(),
    playTickSound: vi.fn(),
    playUrgentTick: vi.fn(),
    playDrumroll: vi.fn(),
}));

const roomMocks = vi.hoisted(() => ({
    submitMultiplayerAnswer: vi.fn().mockResolvedValue(undefined),
    scoreAllSubmissions: vi.fn().mockResolvedValue(undefined),
    leaveCurrentRoom: vi.fn(),
    roomState: {
        room: {
            id: 'room-1',
            round_number: 1,
            total_rounds: 3,
            theme_id: 'classic',
            scoring_mode: 'human',
            assets: {
                left: { id: 'cat', label: 'Cat', type: 'image', url: 'https://example.com/cat.jpg' },
                right: { id: 'dog', label: 'Dog', type: 'image', url: 'https://example.com/dog.jpg' },
            },
        },
        players: [
            { id: 'p1', player_name: 'Alex', avatar: 'A' },
            { id: 'p2', player_name: 'Blair', avatar: 'B' },
        ],
        submissions: [],
        isHost: true,
        isSpectator: false,
        playerName: 'Alex',
        passThePhone: false,
        couchSessions: [],
    },
}));

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => ({
        ...roomMocks.roomState,
        submitMultiplayerAnswer: roomMocks.submitMultiplayerAnswer,
        scoreAllSubmissions: roomMocks.scoreAllSubmissions,
        leaveCurrentRoom: roomMocks.leaveCurrentRoom,
    }),
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({
        toast: { success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    }),
}));

vi.mock('../../data/themes', () => ({
    getThemeById: () => ({
        id: 'classic',
        modifier: { timeLimit: 60, scoreMultiplier: 1 },
    }),
}));

vi.mock('../../services/sounds', () => soundMocks);

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

vi.mock('../../services/assetSelection', () => ({
    loadSelectedAssets: async (assets) => assets,
}));

vi.mock('../round/VennDiagram', () => ({
    VennDiagram: () => <div data-testid="venn-diagram" />,
}));

vi.mock('./ConnectionBanner', () => ({
    ConnectionBanner: () => null,
}));

vi.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

import { MultiplayerRound } from './MultiplayerRound';

describe('MultiplayerRound', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        roomMocks.roomState.submissions = [];
        roomMocks.roomState.isSpectator = false;
        roomMocks.roomState.passThePhone = false;
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('plays submit sound when an answer is submitted', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });
        render(<MultiplayerRound />);
        await user.type(screen.getByPlaceholderText('What connects these two?'), 'Both pets{Enter}');
        expect(soundMocks.playSubmitSound).toHaveBeenCalled();
        expect(roomMocks.submitMultiplayerAnswer).toHaveBeenCalledWith('Both pets');
    });

    it('plays tick then urgent tick sounds in the final seconds', async () => {
        render(<MultiplayerRound />);
        expect(await screen.findByPlaceholderText('What connects these two?')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(50_000);
        });
        expect(soundMocks.playTickSound).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(5_000);
        });
        expect(soundMocks.playUrgentTick).toHaveBeenCalled();
    });

    it('stares at the pair for three seconds before the keyboard in pass-the-phone', async () => {
        roomMocks.roomState.passThePhone = true;
        render(<MultiplayerRound />);
        expect(screen.getByText(/Hand the phone to Alex/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('What connects these two?')).not.toBeInTheDocument();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });
        expect(screen.getByPlaceholderText('What connects these two?')).toBeInTheDocument();
    });
});

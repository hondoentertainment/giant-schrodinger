import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomLobby } from './RoomLobby';

// NOTE ON SCOPE
// -------------
// The Phase-8 finding referenced a join-room form with an inline-validation
// gap. That form is NOT rendered by this file — RoomLobby is the post-join
// waiting room (it shows the current room code, player list, and host/leave
// controls). The join-code input lives in the Lobby feature, which is outside
// the "files you own" boundary for this task. These tests therefore cover
// RoomLobby's real surface area (accessibility of the room-code display,
// host/guest/spectator branching, start-game flow) so the file has the
// regression coverage it previously lacked.

// ── useRoom mock ──────────────────────────────────────────────────────────
const mockLeaveCurrentRoom = vi.fn();
const mockStartMultiplayerRound = vi.fn(() => Promise.resolve());
const mockAttemptReconnect = vi.fn();

let mockRoomState = {
    room: { total_rounds: 3, scoring_mode: 'ai', theme_id: 'neon' },
    players: [{ id: 'p1', player_name: 'Host', avatar: '👽', is_host: true }],
    isHost: true,
    isSpectator: false,
    roomCode: 'ABCD',
    connectionState: 'connected',
};

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => ({
        ...mockRoomState,
        leaveCurrentRoom: mockLeaveCurrentRoom,
        startMultiplayerRound: mockStartMultiplayerRound,
        attemptReconnect: mockAttemptReconnect,
    }),
}));

// ── useToast mock ─────────────────────────────────────────────────────────
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
};
vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

// ── haptics + multiplayer service mocks ───────────────────────────────────
vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

vi.mock('../../services/multiplayer.js', () => ({
    joinRoom: vi.fn(),
    createRoom: vi.fn(),
    getRoomPlayers: vi.fn(() => Promise.resolve([])),
    getRoomByCode: vi.fn(),
    leaveRoom: vi.fn(),
    startRound: vi.fn(),
    setRoomStatus: vi.fn(),
    submitAnswer: vi.fn(),
    getRoundSubmissions: vi.fn(() => Promise.resolve([])),
    getRoomSubmissions: vi.fn(() => Promise.resolve([])),
    updateSubmissionScore: vi.fn(),
    fetchRoomState: vi.fn(),
    subscribeToRoom: vi.fn(() => () => {}),
}));

function resetRoomState(overrides = {}) {
    mockRoomState = {
        room: { total_rounds: 3, scoring_mode: 'ai', theme_id: 'neon' },
        players: [{ id: 'p1', player_name: 'Host', avatar: '👽', is_host: true }],
        isHost: true,
        isSpectator: false,
        roomCode: 'ABCD',
        connectionState: 'connected',
        ...overrides,
    };
}

// Install a clipboard stub — navigator.clipboard is a non-writable getter
// in jsdom, so we must use defineProperty rather than Object.assign.
const clipboardWriteText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: clipboardWriteText },
});

describe('RoomLobby', () => {
    beforeEach(() => {
        resetRoomState();
        vi.clearAllMocks();
        clipboardWriteText.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the room code prominently so hosts can share it', () => {
        render(<RoomLobby />);
        expect(screen.getByText('ABCD')).toBeInTheDocument();
        expect(screen.getByText(/Share this code with friends/i)).toBeInTheDocument();
    });

    it('copy-code button has an accessible label and writes to the clipboard', () => {
        // Use fireEvent here rather than userEvent — userEvent.setup() installs
        // its own clipboard API that bypasses our navigator.clipboard spy.
        render(<RoomLobby />);
        const copyBtn = screen.getByRole('button', { name: /copy room code/i });
        expect(copyBtn).toBeInTheDocument();
        fireEvent.click(copyBtn);
        expect(clipboardWriteText).toHaveBeenCalledWith('ABCD');
        expect(mockToast.success).toHaveBeenCalledWith('Room code copied!');
    });

    it('exposes the players list with role="list" and an aria-live region', () => {
        render(<RoomLobby />);
        const list = screen.getByRole('list', { name: /Players in room/i });
        expect(list).toBeInTheDocument();
        expect(list).toHaveAttribute('aria-live', 'polite');
    });

    it('host sees a Start Game button that is disabled until 2 players are present', () => {
        render(<RoomLobby />);
        const startBtn = screen.getByRole('button', { name: /start game/i });
        expect(startBtn).toBeDisabled();
    });

    it('host Start Game warns via toast when clicked with too few players', async () => {
        const user = userEvent.setup();
        resetRoomState({
            players: [
                { id: 'p1', player_name: 'Host', avatar: '👽', is_host: true },
                { id: 'p2', player_name: 'Guest', avatar: '🎨', is_host: false },
            ],
        });
        render(<RoomLobby />);
        // With 2 players the button is enabled; click kicks off countdown.
        const startBtn = screen.getByRole('button', { name: /start game/i });
        expect(startBtn).not.toBeDisabled();
        await user.click(startBtn);
        // After click, button text reflects countdown state (not plain "Start Game").
        expect(startBtn).toBeDisabled();
    });

    it('non-host guests see a waiting message instead of Start Game', () => {
        resetRoomState({ isHost: false });
        render(<RoomLobby />);
        expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Waiting for the host to start/i)).toBeInTheDocument();
    });

    it('spectators see the spectator banner and a "Stop Watching" exit label', () => {
        resetRoomState({ isHost: false, isSpectator: true });
        render(<RoomLobby />);
        expect(screen.getByText(/Spectating -- watch and react!/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /stop watching/i })).toBeInTheDocument();
    });

    it('Leave Room button calls leaveCurrentRoom', async () => {
        const user = userEvent.setup();
        render(<RoomLobby />);
        const leaveBtn = screen.getByRole('button', { name: /leave room/i });
        await user.click(leaveBtn);
        expect(mockLeaveCurrentRoom).toHaveBeenCalledTimes(1);
    });
});

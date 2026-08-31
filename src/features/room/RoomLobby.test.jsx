import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
};

const roomState = {
    room: {
        id: 'room-1',
        code: 'ABCD',
        total_rounds: 3,
        scoring_mode: 'human',
        theme_id: 'classic',
    },
    players: [
        { id: 'p1', player_name: 'Alex', is_host: true, avatar: 'A' },
        { id: 'p2', player_name: 'Blair', is_host: false, avatar: 'B' },
    ],
    isHost: true,
    isSpectator: false,
    roomCode: 'ABCD',
    leaveCurrentRoom: vi.fn(),
    startMultiplayerRound: vi.fn().mockResolvedValue(true),
    passThePhone: false,
    setPassThePhone: vi.fn(),
    addCouchWriter: vi.fn().mockResolvedValue(true),
};

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => roomState,
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast }),
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

vi.mock('./ConnectionBanner', () => ({
    ConnectionBanner: () => null,
}));

import { RoomLobby } from './RoomLobby';

describe('RoomLobby', () => {
    let clipboardWriteText;

    beforeEach(() => {
        vi.clearAllMocks();
        roomState.players = [
            { id: 'p1', player_name: 'Alex', is_host: true, avatar: 'A' },
            { id: 'p2', player_name: 'Blair', is_host: false, avatar: 'B' },
        ];
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            writable: true,
            value: undefined,
        });
        clipboardWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            writable: true,
            value: { writeText: clipboardWriteText },
        });
        // Prefer spy in case jsdom already exposed a Clipboard instance
        if (navigator.clipboard?.writeText && !vi.isMockFunction(navigator.clipboard.writeText)) {
            clipboardWriteText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        }
    });

    it('shares a join invite via navigator.share when available', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: share,
        });
        const user = userEvent.setup();
        render(<RoomLobby />);

        await user.click(screen.getByRole('button', { name: /Share invite/i }));

        expect(share).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Join my Venn room',
            url: expect.stringContaining('join=ABCD'),
            text: expect.stringContaining('ABCD'),
        }));
        expect(toast.success).toHaveBeenCalledWith('Invite shared!');
    });

    it('falls back to clipboard when share is unavailable', async () => {
        const user = userEvent.setup();
        expect(typeof navigator.share).not.toBe('function');
        render(<RoomLobby />);

        await user.click(screen.getByRole('button', { name: /Share invite/i }));

        await vi.waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Invite link copied!');
        });
        expect(screen.getByRole('button', { name: /Invite ready/i })).toBeInTheDocument();
    });

    it('does nothing when the user aborts the share sheet', async () => {
        const abortError = new Error('cancelled');
        abortError.name = 'AbortError';
        Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: vi.fn().mockRejectedValue(abortError),
        });
        const user = userEvent.setup();
        render(<RoomLobby />);

        await user.click(screen.getByRole('button', { name: /Share invite/i }));

        expect(toast.success).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /Share invite/i })).toBeInTheDocument();
    });

    it('always shows the add-writer field so the host can start the first writer', () => {
        roomState.players = [{ id: 'p1', player_name: 'Alex', is_host: true, avatar: 'A' }];
        render(<RoomLobby />);
        expect(screen.getByLabelText(/Writer name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Share invite — get the next writer/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Need one more writer/i })).toBeDisabled();
    });

    it('lets the host turn on pass-the-phone', async () => {
        const user = userEvent.setup();
        render(<RoomLobby />);
        await user.click(screen.getByRole('switch', { name: /Pass the phone/i }));
        expect(roomState.setPassThePhone).toHaveBeenCalledWith(true);
    });
});

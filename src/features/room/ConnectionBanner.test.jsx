import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionBanner } from './ConnectionBanner';

vi.mock('../../context/RoomContext', () => ({
    useRoom: vi.fn(),
}));

import { useRoom } from '../../context/RoomContext';

describe('ConnectionBanner', () => {
    it('renders nothing when connected and idle', () => {
        useRoom.mockReturnValue({
            connectionState: 'connected',
            roomSyncState: 'idle',
            roomClosureReason: null,
            joinedMidRound: false,
            joinPhase: null,
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: vi.fn(),
            room: { scoring_mode: 'ai' },
            votes: [],
            submissions: [],
        });

        const { container } = render(<ConnectionBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows reconnecting message', () => {
        useRoom.mockReturnValue({
            connectionState: 'reconnecting',
            roomSyncState: 'idle',
            roomClosureReason: null,
            joinedMidRound: false,
            joinPhase: null,
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: vi.fn(),
            room: null,
            votes: [],
            submissions: [],
        });

        render(<ConnectionBanner />);
        expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
    });

    it('shows host-left banner with return action', () => {
        const leave = vi.fn();
        useRoom.mockReturnValue({
            connectionState: 'connected',
            roomSyncState: 'idle',
            roomClosureReason: 'host_left',
            joinedMidRound: false,
            joinPhase: null,
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: leave,
            room: { scoring_mode: 'human', status: 'finished' },
            votes: [],
            submissions: [],
        });

        render(<ConnectionBanner />);
        expect(screen.getByText(/host left/i)).toBeInTheDocument();
        screen.getByRole('button', { name: /return to lobby/i }).click();
        expect(leave).toHaveBeenCalled();
    });

    it('shows late-join banner when joined mid-round', () => {
        useRoom.mockReturnValue({
            connectionState: 'connected',
            roomSyncState: 'idle',
            roomClosureReason: null,
            joinedMidRound: true,
            joinPhase: 'revealing',
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: vi.fn(),
            room: { scoring_mode: 'human', status: 'revealing' },
            votes: [],
            submissions: [],
        });

        render(<ConnectionBanner />);
        expect(screen.getByText(/Joined during voting/i)).toBeInTheDocument();
    });

    it('shows finalizing sync message', () => {
        useRoom.mockReturnValue({
            connectionState: 'connected',
            roomSyncState: 'finalizing',
            roomClosureReason: null,
            joinedMidRound: false,
            joinPhase: null,
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: vi.fn(),
            room: { scoring_mode: 'human', status: 'results' },
            votes: [],
            submissions: [{ id: '1' }, { id: '2' }],
        });

        render(<ConnectionBanner />);
        expect(screen.getByText(/Finalizing votes/i)).toBeInTheDocument();
    });

    it('lists players who still need to vote', () => {
        useRoom.mockReturnValue({
            connectionState: 'connected',
            roomSyncState: 'idle',
            roomClosureReason: null,
            joinedMidRound: false,
            joinPhase: null,
            attemptReconnect: vi.fn(),
            leaveCurrentRoom: vi.fn(),
            room: { scoring_mode: 'human', status: 'revealing' },
            votes: [{ voter_name: 'Alex', submission_id: 'sub-2' }],
            submissions: [
                { id: 'sub-1', player_name: 'Alex' },
                { id: 'sub-2', player_name: 'Sam' },
            ],
        });

        render(<ConnectionBanner />);
        expect(screen.getByText(/Still need to vote: Sam/i)).toBeInTheDocument();
        expect(screen.getByText(/\(1\/2\)/)).toBeInTheDocument();
    });
});

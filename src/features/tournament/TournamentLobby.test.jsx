import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TournamentLobby } from './TournamentLobby';

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({ user: { name: 'Test', avatar: '🎮' } }),
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}));

vi.mock('../../services/tournaments', () => ({
    getActiveTournaments: () => [],
    getTournament: vi.fn(),
    joinTournament: vi.fn(),
    createTournament: vi.fn(),
    advanceTournamentRound: vi.fn(),
    getTournamentStandings: () => [],
    isWeekendTournamentActive: () => false,
    getWeekendTournament: () => null,
    getTournamentHistory: () => [],
}));

describe('TournamentLobby', () => {
    it('renders tournament shell with local preview context', () => {
        render(<TournamentLobby onBack={vi.fn()} />);
        expect(screen.getByRole('heading', { name: 'Tournaments' })).toBeInTheDocument();
        expect(screen.getByText('Local preview')).toBeInTheDocument();
    });
});

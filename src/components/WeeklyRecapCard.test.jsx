import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let mockRecap = null;
vi.mock('../services/weeklyRecap', () => ({
    getWeeklyRecap: () => mockRecap,
}));

const trackEvent = vi.fn();
vi.mock('../services/analytics', () => ({
    trackEvent: (...args) => trackEvent(...args),
}));

vi.mock('../lib/haptics', () => ({
    haptic: vi.fn(),
}));

import { WeeklyRecapCard } from './WeeklyRecapCard';

describe('WeeklyRecapCard', () => {
    beforeEach(() => {
        trackEvent.mockClear();
        mockRecap = null;
    });

    it('renders nothing without a recap', () => {
        const { container } = render(<WeeklyRecapCard />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows rounds, average, best link, and streak', () => {
        mockRecap = {
            roundsPlayed: 3,
            averageScore: 7.5,
            best: { submission: 'Neon jellyfish', score: 9 },
            streak: 4,
            highlightCount: 1,
            shareText: 'My week in Venns',
        };
        render(<WeeklyRecapCard />);
        expect(screen.getByText(/Your week in Venns/i)).toBeInTheDocument();
        expect(screen.getByText(/3 connections/i)).toBeInTheDocument();
        expect(screen.getByText(/avg 7\.5\/10/i)).toBeInTheDocument();
        expect(screen.getByText(/Neon jellyfish/i)).toBeInTheDocument();
        expect(screen.getByText(/4-day streak/i)).toBeInTheDocument();
    });

    it('copies the share text and tracks the event', async () => {
        mockRecap = {
            roundsPlayed: 2,
            averageScore: 8,
            best: { submission: 'Quiet thunder', score: 8 },
            streak: 0,
            highlightCount: 1,
            shareText: 'My week in Venns: 2 connections',
        };
        const writeText = vi.fn().mockResolvedValue();
        Object.assign(navigator, { clipboard: { writeText }, share: undefined });

        render(<WeeklyRecapCard />);
        await userEvent.click(screen.getByRole('button', { name: /Share recap/i }));

        expect(writeText).toHaveBeenCalledWith('My week in Venns: 2 connections');
        expect(trackEvent).toHaveBeenCalledWith('weekly_recap_share', expect.objectContaining({ rounds: 2 }));
        expect(await screen.findByText(/Shared/i)).toBeInTheDocument();
    });
});

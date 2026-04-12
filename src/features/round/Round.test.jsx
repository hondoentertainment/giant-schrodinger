import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Round } from './Round';

// ── Mock GameContext ──
const mockSetGameState = vi.fn();

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        setGameState: mockSetGameState,
        user: { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'ai', mediaType: 'image', useCustomImages: false },
        roundNumber: 1,
        totalRounds: 3,
        currentModifier: { id: 'normal', label: 'Standard Round', timeFactor: 1.0, scoreFactor: 1.0, icon: '🎯' },
        isDailyChallenge: false,
    }),
}));

// ── Mock theme/services ──
vi.mock('../../data/themes', () => ({
    THEMES: [{ id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } }],
    getThemeById: () => ({ id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } }),
    buildThemeAssets: () => [
        { id: 'cat', label: 'Cat', type: 'image', url: 'https://example.com/cat.jpg', fallbackUrl: 'https://example.com/cat-fallback.jpg' },
        { id: 'dog', label: 'Dog', type: 'image', url: 'https://example.com/dog.jpg', fallbackUrl: 'https://example.com/dog-fallback.jpg' },
    ],
    MEDIA_TYPES: { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' },
}));

vi.mock('../../services/customImages', () => ({
    getCustomImages: () => [],
}));

vi.mock('../../services/stats', () => ({
    getStats: () => ({ totalRounds: 5, currentStreak: 0, maxStreak: 0, milestonesUnlocked: [] }),
    isThemeUnlocked: () => true,
}));

vi.mock('../../services/aiFeatures', () => ({
    getAIDifficulty: () => 'medium',
    getDifficultyConfig: () => ({ timeBonus: 0 }),
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

describe('Round', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders two concept images', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByAltText('Cat')).toBeInTheDocument();
        expect(screen.getByAltText('Dog')).toBeInTheDocument();
    });

    it('shows get-ready countdown before timer starts', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        // The round now shows a "Get Ready" countdown (3-2-1-Go) before the timer
        // During ready phase, the countdown number should be visible
        expect(screen.getByText('3')).toBeInTheDocument();

        // After countdown completes, timer should appear
        act(() => {
            vi.advanceTimersByTime(3500);
        });
        // Timer display should now be visible
        const timerEl = screen.queryByRole('timer');
        expect(timerEl).toBeTruthy();
    });

    it('text input accepts user submission', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, 'They both have fur');
        expect(input).toHaveValue('They both have fur');
    });

    it('submit button is hidden when input is empty', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        // The submit button only appears when submission.trim() is truthy (mobile only)
        const submitButtons = screen.queryAllByRole('button', { name: /submit/i });
        // No visible submit button when empty
        expect(submitButtons.length).toBe(0);
    });

    it('shows validation shake on empty submit (form submit via enter)', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        // Submit without typing anything
        await user.type(input, '{Enter}');
        // onSubmit should NOT have been called since input was empty
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows round info with round number', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getByText(/ROUND 1 \/ 3/)).toBeInTheDocument();
    });
});

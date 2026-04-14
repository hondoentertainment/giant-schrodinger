import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Round } from './Round';

// ── Mock GameContext ──
const mockSetGameState = vi.fn();
let mockContextValue = {
    setGameState: mockSetGameState,
    user: { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'ai', mediaType: 'image', useCustomImages: false },
    roundNumber: 1,
    totalRounds: 3,
    currentModifier: { id: 'normal', label: 'Standard Round', timeFactor: 1.0, scoreFactor: 1.0, icon: '🎯' },
    isDailyChallenge: false,
};

vi.mock('../../context/GameContext', () => ({
    useGame: () => mockContextValue,
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

// Baseline context used by most tests.
const baselineContext = {
    setGameState: mockSetGameState,
    user: { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'ai', mediaType: 'image', useCustomImages: false },
    roundNumber: 1,
    totalRounds: 3,
    currentModifier: { id: 'normal', label: 'Standard Round', timeFactor: 1.0, scoreFactor: 1.0, icon: '🎯' },
    isDailyChallenge: false,
};

describe('Round', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset context to baseline for each test
        mockContextValue = { ...baselineContext, setGameState: mockSetGameState };
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

    it('renders both concept labels during the ready countdown', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        // During the 'ready' phase both labels are displayed in the overlay
        expect(screen.getAllByText('Cat').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Dog').length).toBeGreaterThan(0);
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

    it('submit button appears only after non-empty input is typed', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, 'abc');
        expect(screen.getByRole('button', { name: /^submit$/i })).toBeInTheDocument();
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

    it('rejects whitespace-only submissions without calling onSubmit', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, '   {Enter}');
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('input enforces the 200-character maxLength limit', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        expect(input).toHaveAttribute('maxLength', '200');
    });

    it('submits valid input with {submission, assets} shape and transitions to REVEAL', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, 'Both have whiskers{Enter}');

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const args = mockOnSubmit.mock.calls[0][0];
        expect(args).toMatchObject({
            submission: 'Both have whiskers',
            assets: expect.objectContaining({
                left: expect.objectContaining({ label: expect.any(String) }),
                right: expect.objectContaining({ label: expect.any(String) }),
            }),
        });
        expect(mockSetGameState).toHaveBeenCalledWith('REVEAL');
    });

    it('shows round info with round number', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getByText(/ROUND 1 \/ 3/)).toBeInTheDocument();
    });

    it('shows DAILY instead of ROUND when isDailyChallenge is true', () => {
        mockContextValue = { ...baselineContext, isDailyChallenge: true };
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getByText(/DAILY 1 \/ 3/)).toBeInTheDocument();
    });

    it('transitions from ready phase to playing phase after countdown', async () => {
        render(<Round onSubmit={mockOnSubmit} />);
        // During ready phase the countdown overlay is shown
        expect(screen.getByText('3')).toBeInTheDocument();
        // Advance past the 3-2-1 countdown (~3000ms)
        await act(async () => {
            vi.advanceTimersByTime(3200);
        });
        // Timer role should now be present
        await waitFor(() => {
            expect(screen.queryByRole('timer')).toBeTruthy();
        });
    });

    it('opens quit confirmation modal when quit button is clicked', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const quitButton = screen.getByRole('button', { name: /quit round/i });
        await user.click(quitButton);
        expect(screen.getByText(/Quit Session\?/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^keep playing$/i })).toBeInTheDocument();
    });

    it('confirming quit returns to LOBBY', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        await user.click(screen.getByRole('button', { name: /quit round/i }));
        // The quit-confirm modal has two buttons; the second one named "Quit" returns to LOBBY
        const quitButtons = screen.getAllByRole('button', { name: /^quit$/i });
        await user.click(quitButtons[quitButtons.length - 1]);
        expect(mockSetGameState).toHaveBeenCalledWith('LOBBY');
    });

    it('displays the special-round modifier banner for non-normal modifiers', () => {
        mockContextValue = {
            ...baselineContext,
            currentModifier: {
                id: 'speed',
                label: 'Speed Round',
                description: 'Half time, 1.5x points',
                timeFactor: 0.5,
                scoreFactor: 1.5,
                icon: '⚡',
            },
        };
        render(<Round onSubmit={mockOnSubmit} />);
        // Speed round preview text shows in the ready overlay
        expect(screen.getByText(/SPEED ROUND/)).toBeInTheDocument();
        expect(screen.getByText('Speed Round')).toBeInTheDocument();
    });
});

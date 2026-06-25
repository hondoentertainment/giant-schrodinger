import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Round } from './Round';
import { getStats } from '../../services/stats';

// ── Mock GameContext ──
const mockSetGameState = vi.fn();
let mockContextValue = {
    setGameState: mockSetGameState,
    user: { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'ai', mediaType: 'image', useCustomImages: false },
    roundNumber: 1,
    totalRounds: 3,
    currentModifier: { id: 'normal', label: 'Standard Round', timeFactor: 1.0, scoreFactor: 1.0, icon: '🎯' },
    isDailyChallenge: false,
    trackUsedAssets: vi.fn(),
    getUsedAssetIds: () => [],
};

vi.mock('../../context/GameContext', () => ({
    useGame: () => mockContextValue,
}));

// ── Mock theme/services ──
vi.mock('../../data/themes', () => {
    const theme = { id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } };
    return {
        THEMES: [theme],
        getThemeById: () => theme,
        MEDIA_TYPES: { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', MEME: 'meme', MEMES_VIDEOS: 'memes_videos' },
    };
});

vi.mock('./VennDiagram', () => ({
    VennDiagram: ({ leftAsset, rightAsset }) => (
        <div data-testid="venn-diagram">
            <img alt={leftAsset?.label} src={leftAsset?.url} />
            <img alt={rightAsset?.label} src={rightAsset?.url} />
            <span>{leftAsset?.label}</span>
            <span>{rightAsset?.label}</span>
        </div>
    ),
}));

vi.mock('../../services/assetSelection', () => ({
    selectRoundAssets: () => [
        { id: 'cat', label: 'Cat', type: 'image', url: 'https://example.com/cat.jpg', fallbackUrl: 'https://example.com/cat-fallback.jpg' },
        { id: 'dog', label: 'Dog', type: 'image', url: 'https://example.com/dog.jpg', fallbackUrl: 'https://example.com/dog-fallback.jpg' },
    ],
    resolveSelectedAssets: async (assets) => assets,
    preloadRoundAssets: vi.fn(),
    getAssetMediaLabel: (type) => {
        if (type === 'video') return 'Video';
        if (type === 'meme') return 'Meme';
        if (type === 'audio') return 'Audio';
        return 'Concept';
    },
}));

vi.mock('../../services/dailyChallenge', () => ({
    getDailyChallenge: () => ({ seed: 12345 }),
}));

vi.mock('../../services/stats', () => ({
    getStats: vi.fn(() => ({ totalRounds: 5, currentStreak: 0, maxStreak: 0, milestonesUnlocked: [] })),
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
    trackUsedAssets: vi.fn(),
    getUsedAssetIds: () => [],
};

describe('Round', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        getStats.mockReturnValue({ totalRounds: 5, currentStreak: 0, maxStreak: 0, milestonesUnlocked: [] });
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

    it('renders concept labels on the venn diagram', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getAllByText('Cat').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Dog').length).toBeGreaterThan(0);
    });

    it('shows the round timer immediately when assets are loaded', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getAllByText('60s').length).toBeGreaterThan(0);
    });

    it('text input accepts user submission', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, 'They both have fur');
        expect(input).toHaveValue('They both have fur');
    });

    it('does not render a separate submit button', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
    });

    it('submits on Enter even when input is empty', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, '{Enter}');
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('submits whitespace-only input on Enter', async () => {
        vi.useRealTimers();
        const user = userEvent.setup();
        render(<Round onSubmit={mockOnSubmit} />);
        const input = screen.getByPlaceholderText('What connects these two?');
        await user.type(input, '   {Enter}');
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
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
        expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Round progress: 1 of 3/i)).toBeInTheDocument();
    });

    it('shows DAILY instead of ROUND when isDailyChallenge is true', () => {
        mockContextValue = { ...baselineContext, isDailyChallenge: true };
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getByText(/Daily puzzle/i)).toBeInTheDocument();
        expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
    });

    it('counts down the timer each second', () => {
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getAllByText('60s').length).toBeGreaterThan(0);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getAllByText('59s').length).toBeGreaterThan(0);
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
        expect(screen.getByText('Speed Round')).toBeInTheDocument();
        expect(screen.getByText(/Half time, 1.5x points/)).toBeInTheDocument();
    });

    it('shows memes & videos coaching and placeholder when media type is memes_videos', () => {
        getStats.mockReturnValue({ totalRounds: 0, currentStreak: 0, maxStreak: 0, milestonesUnlocked: [] });
        mockContextValue = {
            ...baselineContext,
            user: { ...baselineContext.user, mediaType: 'memes_videos' },
        };
        render(<Round onSubmit={mockOnSubmit} />);
        expect(screen.getByPlaceholderText(/What connects this meme and video/i)).toBeInTheDocument();
        expect(screen.getByText(/Connect the vibe, not just the visuals/i)).toBeInTheDocument();
    });
});

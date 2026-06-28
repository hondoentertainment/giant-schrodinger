import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reveal } from './Reveal';

// ── Mock GameContext ──
const mockSetGameState = vi.fn();
const mockCompleteRound = vi.fn();
const mockNextRound = vi.fn();
let mockScoringMode = 'ai';
let mockRoundNumber = 1;
let mockTotalRounds = 3;
const mockClipboardWriteText = vi.fn();

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        setGameState: mockSetGameState,
        user: { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: mockScoringMode, mediaType: 'image' },
        completeRound: mockCompleteRound,
        roundNumber: mockRoundNumber,
        totalRounds: mockTotalRounds,
        currentModifier: { id: 'normal', label: 'Standard Round', timeFactor: 1.0, scoreFactor: 1.0, icon: '🎯' },
        nextRound: mockNextRound,
    }),
}));

// ── Mock ToastContext ──
vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({
        toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warn: vi.fn() },
    }),
}));

// ── Mock services ──
vi.mock('../../services/gemini', () => ({
    scoreSubmission: vi.fn().mockResolvedValue({
        score: 8,
        baseScore: 8,
        breakdown: { wit: 8, logic: 7, originality: 9, clarity: 8 },
        commentary: 'Great connection between Cat and Dog!',
        relevance: 'Highly Logical',
        isMock: true,
    }),
    generateFusionImage: vi.fn().mockResolvedValue({
        url: 'https://example.com/fusion.jpg',
        fallbackUrl: 'https://example.com/fusion-fallback.jpg',
        isFallback: false,
    }),
}));

vi.mock('../../services/storage', () => ({
    saveCollision: vi.fn(() => ({ id: 'test-collision-1', submission: 'They both have fur' })),
}));

vi.mock('../../services/stats', () => ({
    recordPlay: vi.fn(() => ({ newlyUnlocked: [] })),
    getStats: vi.fn(() => ({ currentStreak: 0, totalRounds: 0, milestonesUnlocked: [] })),
    getMilestones: vi.fn(() => []),
}));

vi.mock('../../services/offlineQueue', () => ({
    addToOfflineQueue: vi.fn(),
}));

vi.mock('../../services/share', () => ({
    createJudgeShareLinks: vi.fn(() => Promise.resolve({
        shareUrl: 'https://example.com/judge/123',
        previewUrl: 'https://example.com/judge/123',
    })),
}));

vi.mock('../../services/challenges', () => ({
    createChallenge: vi.fn(() => ({})),
    createChallengeUrl: vi.fn(() => 'https://example.com/challenge/123'),
}));

vi.mock('../../services/leaderboard', () => ({
    submitScore: vi.fn(),
    submitSeasonalScore: vi.fn(),
    getPlayerRank: vi.fn(() => null),
}));

vi.mock('../../services/sounds', () => ({
    playScoreReveal: vi.fn(),
    playConfetti: vi.fn(),
}));

vi.mock('../../services/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('../../services/highlights', () => ({
    autoSaveHighlight: vi.fn(),
}));

vi.mock('../../services/aiFeatures', () => ({
    getConnectionExplanation: vi.fn(() => 'Both are beloved household pets that bring joy to families.'),
}));

vi.mock('../../services/achievements', () => ({
    checkAchievements: vi.fn(),
    getNextAchievementProgress: vi.fn(() => null),
}));

vi.mock('../../services/shop', () => ({
    addCoins: vi.fn(),
    addBattlePassXp: vi.fn(),
}));

vi.mock('../../services/backend', () => ({
    saveSharedRound: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../data/themes', () => ({
    getThemeById: () => ({ id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } }),
    buildThemeAssets: () => [
        { id: 'next1', label: 'Next1', type: 'image', url: 'https://example.com/next1.jpg' },
        { id: 'next2', label: 'Next2', type: 'image', url: 'https://example.com/next2.jpg' },
    ],
    MEDIA_TYPES: { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' },
}));

vi.mock('../../lib/scoreBands', () => ({
    getScoreBand: () => ({ label: 'Brilliant', color: 'from-yellow-300 to-amber-600' }),
}));

vi.mock('../../components/MilestoneCelebration', () => ({
    MilestoneCelebration: () => null,
}));

vi.mock('../../components/Confetti', () => ({
    default: () => null,
}));

vi.mock('../../components/SocialShareButtons', () => ({
    default: () => <div data-testid="social-share-buttons">Share Buttons</div>,
}));

vi.mock('../../components/ShareCardCanvas', () => ({
    ShareCardCanvas: () => <div data-testid="share-card-canvas">Share Card</div>,
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

describe('Reveal', () => {
    const mockAssets = {
        left: { id: 'cat', label: 'Cat', type: 'image', url: 'https://example.com/cat.jpg' },
        right: { id: 'dog', label: 'Dog', type: 'image', url: 'https://example.com/dog.jpg' },
    };
    const mockSubmission = 'They both have fur';

    beforeEach(() => {
        mockScoringMode = 'ai';
        mockRoundNumber = 1;
        mockTotalRounds = 3;
        vi.clearAllMocks();
        mockClipboardWriteText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: mockClipboardWriteText,
            },
        });
    });

    it('displays score when result is provided', async () => {
        const { saveCollision } = await import('../../services/storage');
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);
        // Initially shows loading/scoring status
        expect(screen.getByRole('status')).toBeInTheDocument();
        // Wait for scoring to complete
        const scoreDisplays = await screen.findAllByText(/\/10/, {}, { timeout: 3000 });
        expect(scoreDisplays.length).toBeGreaterThan(0);
        expect(saveCollision).toHaveBeenCalledWith(expect.objectContaining({
            assets: {
                left: expect.objectContaining({ label: 'Cat' }),
                right: expect.objectContaining({ label: 'Dog' }),
            },
            judgeMode: 'ai',
        }));
    });

    it('shows score breakdown and commentary after scoring', async () => {
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);
        expect(await screen.findByText(/Great connection between Cat and Dog!/, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(await screen.findByText(/Wit:/)).toBeInTheDocument();
    });

    it('share button exists after scoring', async () => {
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);
        const shareBtn = await screen.findByRole('button', { name: /ask a friend to judge|share for friend to judge/i }, { timeout: 3000 });
        expect(shareBtn).toBeInTheDocument();
    });

    it('lets manual scoring users ask a friend to judge before self-scoring', async () => {
        mockScoringMode = 'human';
        const user = userEvent.setup();
        const { createJudgeShareLinks } = await import('../../services/share');

        render(<Reveal submission={mockSubmission} assets={mockAssets} />);

        const friendJudgeButton = await screen.findByRole('button', { name: /ask a friend to judge/i }, { timeout: 3000 });
        await user.click(friendJudgeButton);

        expect(createJudgeShareLinks).toHaveBeenCalledWith(expect.objectContaining({
            submission: mockSubmission,
            collisionId: null,
            judgeMode: 'friend',
        }));
        expect(await screen.findByRole('button', { name: /friend judge link copied/i })).toBeInTheDocument();
    });

    it('Next Round button navigates forward', async () => {
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);
        const nextBtn = await screen.findByRole('button', { name: /Next Round/i }, { timeout: 3000 });
        expect(nextBtn).toBeInTheDocument();
    });

    it('shows a recommended workflow after a standout round', async () => {
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);

        expect(await screen.findByText(/Recommended next move/i, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText(/Share this standout round for friend feedback/i)).toBeInTheDocument();
        expect(screen.getByText(/Saved to your gallery/i)).toBeInTheDocument();
        expect(screen.getByText(/Continue to round 2/i)).toBeInTheDocument();
    });

    it('recommends session summary on the final round', async () => {
        mockRoundNumber = 3;
        mockTotalRounds = 3;

        render(<Reveal submission={mockSubmission} assets={mockAssets} />);

        expect(await screen.findByText(/Review your session summary/i, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText(/Open your session summary/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /See Results/i })).toBeInTheDocument();
    });

    it('shows the submission in quotes while loading', async () => {
        render(<Reveal submission={mockSubmission} assets={mockAssets} />);
        expect(screen.getByText(`\u201c${mockSubmission}\u201d`)).toBeInTheDocument();
        expect(await screen.findByText(/Great connection between Cat and Dog!/, {}, { timeout: 3000 })).toBeInTheDocument();
    });
});

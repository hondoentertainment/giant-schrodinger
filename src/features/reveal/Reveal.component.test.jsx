import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all Reveal dependencies
vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        state: {
            roundNumber: 1,
            totalRounds: 5,
            sessionScores: [],
            streak: { current: 3, max: 5 },
            coins: 100,
            achievements: [],
            theme: 'neon',
            playerName: 'TestPlayer',
            mediaType: 'image',
            lastScore: null,
        },
        dispatch: vi.fn(),
        setGameState: vi.fn(),
    }),
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../services/gemini', () => ({
    scoreSubmission: vi.fn().mockResolvedValue({
        score: 8, baseScore: 8,
        breakdown: { wit: 8, logic: 7, originality: 9, clarity: 8 },
        commentary: 'Great connection!', relevance: 'Highly Logical',
    }),
    generateFusionImage: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/storage', () => ({
    saveCollision: vi.fn(),
}));

vi.mock('../../services/stats', () => ({
    recordPlay: vi.fn(),
    getStats: vi.fn().mockReturnValue({ totalRounds: 10 }),
}));

vi.mock('../../services/share', () => ({
    createJudgeShareUrl: vi.fn().mockReturnValue('https://example.com/share'),
}));

vi.mock('../../services/challenges', () => ({
    createChallenge: vi.fn().mockReturnValue({ id: '123' }),
    createChallengeUrl: vi.fn().mockReturnValue('https://example.com/challenge'),
    getStreakBonus: vi.fn().mockReturnValue({ multiplier: 1, label: '' }),
}));

vi.mock('../../services/leaderboard', () => ({
    submitScore: vi.fn(),
    getPlayerRank: vi.fn().mockReturnValue(null),
    submitSeasonalScore: vi.fn(),
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
    getConnectionExplanation: vi.fn().mockReturnValue('Good connection'),
}));

vi.mock('../../components/ShareCardCanvas', () => ({
    ShareCardCanvas: () => null,
}));

vi.mock('../../services/achievements', () => ({
    checkAchievements: vi.fn().mockReturnValue([]),
}));

vi.mock('../../components/AchievementProgress', () => ({
    AchievementProgress: () => null,
}));

vi.mock('../../services/shop', () => ({
    addCoins: vi.fn(),
    addBattlePassXp: vi.fn(),
}));

vi.mock('../../services/offlineQueue', () => ({
    addToOfflineQueue: vi.fn(),
}));

vi.mock('../../data/themes', () => ({
    getThemeById: vi.fn().mockReturnValue({ id: 'neon', name: 'Neon Nights' }),
    buildThemeAssets: vi.fn().mockReturnValue({ left: {}, right: {} }),
    MEDIA_TYPES: [{ id: 'image', label: 'Images' }],
}));

vi.mock('../../lib/scoreBands', () => ({
    getScoreBand: vi.fn().mockReturnValue({ label: 'Great', color: 'text-green-400', emoji: '⭐' }),
}));

vi.mock('../../components/MilestoneCelebration', () => ({
    MilestoneCelebration: () => null,
}));

vi.mock('../../components/Confetti', () => ({
    default: () => null,
}));

vi.mock('../../components/SocialShareButtons', () => ({
    default: () => null,
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

vi.mock('../../lib/timings', () => ({
    TIMINGS: { MOCK_AI_DELAY: 0, SCORE_REVEAL_DELAY: 0, AUTO_SUBMIT_DELAY: 0 },
}));

describe('Reveal component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', async () => {
        const { Reveal } = await import('./Reveal');
        const { container } = render(
            <Reveal
                submission="Test connection"
                assets={{
                    left: { id: 'l1', label: 'City Lights', url: 'https://example.com/city.jpg' },
                    right: { id: 'r1', label: 'Ocean Waves', url: 'https://example.com/ocean.jpg' },
                }}
            />
        );
        expect(container).toBeTruthy();
    });
});

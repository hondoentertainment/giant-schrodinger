import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies comprehensively
vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        gameState: 'LOBBY',
        setGameState: vi.fn(),
        state: {
            playerName: 'TestPlayer',
            avatar: '🎯',
            theme: 'neon',
            streak: { current: 3, max: 5 },
            coins: 100,
            totalRounds: 10,
            achievements: [],
            mediaType: 'image',
            scoringMode: 'ai',
            sessionLength: 5,
        },
        dispatch: vi.fn(),
    }),
}));

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => ({
        isMultiplayer: false,
        createRoom: vi.fn(),
        joinRoom: vi.fn(),
    }),
}));

vi.mock('../../data/themes', () => ({
    THEMES: [{ id: 'neon', name: 'Neon Nights', emoji: '🌃' }],
    getThemeById: vi.fn().mockReturnValue({ id: 'neon', name: 'Neon Nights' }),
    MEDIA_TYPES: [{ id: 'image', label: 'Images' }],
}));

vi.mock('../../services/stats', () => ({
    getStats: vi.fn().mockReturnValue({ totalRounds: 10, maxStreak: 5, totalCoins: 100 }),
    getMilestones: vi.fn().mockReturnValue([]),
    isAvatarUnlocked: vi.fn().mockReturnValue(true),
    isThemeUnlocked: vi.fn().mockReturnValue(true),
}));

vi.mock('../../services/dailyChallenge', () => ({
    getDailyChallenge: vi.fn().mockReturnValue(null),
    hasDailyChallengeBeenPlayed: vi.fn().mockReturnValue(false),
}));

vi.mock('../../services/countdown', () => ({
    getTimeUntilNextChallenge: vi.fn().mockReturnValue(0),
    formatCountdown: vi.fn().mockReturnValue('12:00:00'),
}));

vi.mock('../../services/challenges', () => ({
    getStreakBonus: vi.fn().mockReturnValue({ multiplier: 1, label: '' }),
}));

vi.mock('../../services/referrals', () => ({
    parseReferralFromUrl: vi.fn(),
    trackReferral: vi.fn(),
    generateReferralCode: vi.fn().mockReturnValue('TEST123'),
}));

vi.mock('../../services/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('../../services/sounds', () => ({
    toggleMute: vi.fn(),
    isMuted: vi.fn().mockReturnValue(false),
    playClick: vi.fn(),
}));

vi.mock('../../services/leaderboard', () => ({
    getCurrentSeason: vi.fn().mockReturnValue({ name: 'Test Season', id: 1 }),
}));

vi.mock('../analytics/ScoreHistoryChart', () => ({
    ScoreHistoryChart: () => null,
}));

vi.mock('../social/FriendProfile', () => ({
    FriendProfile: () => null,
}));

vi.mock('../../services/weeklyEvents', () => ({
    getCurrentWeeklyEvent: vi.fn().mockReturnValue(null),
    getTimeUntilNextWeek: vi.fn().mockReturnValue(0),
    formatWeeklyCountdown: vi.fn().mockReturnValue(''),
}));

vi.mock('../../lib/validation', () => ({
    validatePlayerName: vi.fn().mockReturnValue({ valid: true }),
}));

vi.mock('../../lib/supabase', () => ({
    isBackendEnabled: vi.fn().mockReturnValue(false),
}));

vi.mock('../../services/friends', () => ({
    getFriends: vi.fn().mockReturnValue([]),
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

vi.mock('../../services/ranked', () => ({
    getPlayerRating: vi.fn().mockReturnValue({ rating: 1000, tier: { name: 'Bronze' } }),
    isPlacementComplete: vi.fn().mockReturnValue(false),
    applyDecayOnLoad: vi.fn(),
    getSeasonLaunchConfig: vi.fn().mockReturnValue({ banner: null }),
}));

describe('Lobby', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('venn_player', JSON.stringify({ name: 'TestPlayer', avatar: '🎯' }));
    });

    it('renders the lobby without crashing', async () => {
        const { Lobby } = await import('./Lobby');
        const { container } = render(<Lobby />);
        expect(container).toBeTruthy();
    });

    it('renders interactive buttons', async () => {
        const { Lobby } = await import('./Lobby');
        render(<Lobby />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies comprehensively
vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
<<<<<<< HEAD
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
=======
        user: mockUser,
        login: mockLogin,
        logout: vi.fn(),
        setGameState: mockSetGameState,
        sessionId: mockSessionId,
        roundNumber: 1,
        totalRounds: 3,
        sessionScore: 0,
        roundComplete: false,
        sessionResults: [],
        startSession: mockStartSession,
        beginRound: mockBeginRound,
        advanceRound: mockAdvanceRound,
        endSession: mockEndSession,
>>>>>>> origin/main
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
<<<<<<< HEAD
    getStats: vi.fn().mockReturnValue({ totalRounds: 10, maxStreak: 5, totalCoins: 100 }),
    getMilestones: vi.fn().mockReturnValue([]),
    isAvatarUnlocked: vi.fn().mockReturnValue(true),
    isThemeUnlocked: vi.fn().mockReturnValue(true),
}));

vi.mock('../../services/dailyChallenge', () => ({
    getDailyChallenge: vi.fn().mockReturnValue(null),
    hasDailyChallengeBeenPlayed: vi.fn().mockReturnValue(false),
=======
    getStats: () => ({ totalRounds: 20, currentStreak: globalThis.__testStreakValue, maxStreak: 3, milestonesUnlocked: [], scores: [8, 9], themesPlayed: ['neon'] }),
    getMilestones: () => [],
    isAvatarUnlocked: () => true,
    isThemeUnlocked: () => true,
    getProfileSummary: () => ({
        bestScore: 9,
        favoriteThemeId: 'neon',
        currentStreak: globalThis.__testStreakValue || 0,
        totalRounds: 20,
        nextMilestone: { label: 'Test milestone', remaining: 2, threshold: 25, type: 'rounds' },
        averageScore: 8.5,
        friendJudgedCount: 1,
        highlightCount: 2,
        streakAtRisk: false,
        streakStatus: 'active_today',
    }),
}));

vi.mock('../../services/dailyChallenge', () => ({
    getDailyChallenge: () => ({ prompt: 'Test daily prompt' }),
    getDailyChallengeSummary: () => ({
        completions: 2,
        bestScore: 9,
        latestScore: 7,
        averageScore: 8,
        shareLine: 'Daily Venn complete: 7/10 today, best 9/10 across 2 days.',
        weeklyBest: 9,
        weeklyCompletions: 2,
    }),
    hasDailyChallengeBeenPlayed: () => false,
>>>>>>> origin/main
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

vi.mock('../../lib/runtimeConfig', () => ({
    getRuntimeStatus: () => ({
        backendEnabled: mockBackendEnabled,
        geminiEnabled: false,
        aiScoringMode: 'mock',
        fusionImageMode: 'curated',
        multiplayerMode: mockBackendEnabled ? 'live' : 'disabled',
        friendJudgingMode: mockBackendEnabled ? 'persisted' : 'local-only',
    }),
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

<<<<<<< HEAD
=======
vi.mock('../../components/OnboardingTour', () => ({
    OnboardingTour: ({ onComplete }) => <div data-testid="onboarding-tour"><button onClick={onComplete}>Complete Tour</button></div>,
}));

vi.mock('../../components/NotificationBanner', () => ({
    NotificationBanner: () => <div data-testid="notification-banner">Notify</div>,
}));

vi.mock('../../components/UnlockModal', () => ({
    UnlockModal: () => <div data-testid="unlock-modal">Unlock Modal</div>,
}));

vi.mock('../../components/CustomImagesManager', () => ({
    CustomImagesManager: () => <div data-testid="custom-images-manager">Custom Images</div>,
}));

vi.mock('../../services/customImages', () => ({
    getCustomImages: () => [],
}));

vi.mock('../../services/promptPacks', () => ({
    getBuiltInPacks: () => [],
    getCustomPacks: () => [],
}));

// i18n mock - return English translations so tests match visible text
const enStrings = {
    'lobby.createProfile': 'Create Profile',
    'lobby.customizeExperience': 'Customize your experience and unlock rewards by playing',
    'lobby.enterName': 'Enter your name...',
    'lobby.username': 'Username',
    'lobby.startStreak': 'Play today to start a streak!',
    'lobby.dayStreak': 'Day Streak',
    'lobby.offlineMode': 'Offline mode — leaderboards, multiplayer & challenges require backend',
    'lobby.dailyChallenge': 'Daily Challenge',
    'lobby.play': 'Play',
};
vi.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key, params) => {
            let val = enStrings[key] || key;
            if (params) Object.entries(params).forEach(([k, v]) => { val = val.replace(`{{${k}}}`, v); });
            return val;
        },
        locale: 'en',
        setLocale: vi.fn(),
    }),
}));

vi.mock('../../components/LanguageSelector', () => ({
    LanguageSelector: () => null,
}));

vi.mock('../../components/OnboardingTour', () => ({
    OnboardingTour: () => null,
}));

const loggedInUser = { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'human', mediaType: 'image', useCustomImages: false };

>>>>>>> origin/main
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

<<<<<<< HEAD
    it('renders interactive buttons', async () => {
        const { Lobby } = await import('./Lobby');
        render(<Lobby />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
=======
    it('does not show a streak badge when streak is 0', () => {
        mockUser = loggedInUser;
        render(<Lobby />);
        expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument();
    });

    it('shows streak counter when streak > 0', () => {
        mockUser = loggedInUser;
        globalThis.__testStreakValue = 3;
        render(<Lobby />);
        expect(screen.getByText('3 days')).toBeInTheDocument();
    });

    it('shows daily challenge ritual context in the lobby', () => {
        mockUser = loggedInUser;
        render(<Lobby />);
        expect(screen.getByText(/Test daily prompt/i)).toBeInTheDocument();
        expect(screen.getByText(/2 daily completions/i)).toBeInTheDocument();
        expect(screen.getByText(/Best daily: 9\/10/i)).toBeInTheDocument();
    });

    it('shows runtime status card when backend is not enabled', () => {
        mockUser = loggedInUser;
        mockBackendEnabled = false;
        render(<Lobby />);
        expect(screen.getByText(/Runtime Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Supabase missing/i)).toBeInTheDocument();
    });

    it('does not show backend-disabled messaging when backend is enabled', () => {
        mockUser = loggedInUser;
        mockBackendEnabled = true;
        render(<Lobby />);
        expect(screen.queryByText(/Supabase missing/i)).not.toBeInTheDocument();
    });

    it('play button exists and is clickable', async () => {
        const user = userEvent.setup();
        mockUser = loggedInUser;
        render(<Lobby />);
        const playBtn = screen.getByRole('button', { name: /Start solo session/i });
        expect(playBtn).toBeInTheDocument();
        await user.click(playBtn);
        // startSession or beginRound should be called (depending on session state)
        expect(mockStartSession).toHaveBeenCalled();
    });

    it('daily challenge section renders', () => {
        mockUser = loggedInUser;
        render(<Lobby />);
        expect(screen.getByText('Daily Challenge')).toBeInTheDocument();
        expect(screen.getByText('Test daily prompt')).toBeInTheDocument();
    });

    it('shows profile form when user is not logged in', () => {
        render(<Lobby />);
        expect(screen.getByPlaceholderText('Enter your name...')).toBeInTheDocument();
>>>>>>> origin/main
    });

    it('prefills multiplayer join code from ?join= query param', async () => {
        mockUser = loggedInUser;
        mockBackendEnabled = true;
        window.history.pushState({}, '', '/?join=ABCD');
        render(<Lobby />);
        expect(await screen.findByDisplayValue('ABCD')).toBeInTheDocument();
        await vi.waitFor(() => {
            expect(window.location.search).not.toContain('join=');
        });
    });

    it('mounts the notification banner once the player has enough rounds', () => {
        mockUser = loggedInUser;
        render(<Lobby />);
        expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    });
});

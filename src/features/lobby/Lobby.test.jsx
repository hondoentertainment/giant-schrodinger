import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lobby } from './Lobby';

// ── Mock context providers ──
const mockLogin = vi.fn();
const mockSetGameState = vi.fn();
const mockStartSession = vi.fn();
const mockBeginRound = vi.fn();
const mockAdvanceRound = vi.fn();
const mockEndSession = vi.fn();

let mockUser = null;
let mockSessionId = null;

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        user: mockUser,
        login: mockLogin,
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
    }),
}));

vi.mock('../../context/RoomContext', () => ({
    useRoom: () => ({
        hostRoom: vi.fn(),
        joinRoomByCode: vi.fn(),
    }),
}));

// ── Mock services ──
vi.mock('../../data/themes', () => ({
    THEMES: [
        { id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } },
    ],
    getThemeById: () => ({ id: 'classic', label: 'Classic', gradient: 'from-purple-500 to-pink-500', modifier: { timeLimit: 60, scoreMultiplier: 1.0 } }),
    MEDIA_TYPES: { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' },
}));

// Attach to globalThis so linter does not prune the variable
globalThis.__testStreakValue = 0;
vi.mock('../../services/stats', () => ({
    getStats: () => ({ totalRounds: 20, currentStreak: globalThis.__testStreakValue, maxStreak: 3, milestonesUnlocked: [], scores: [8, 9], themesPlayed: ['neon'] }),
    getMilestones: () => [],
    isAvatarUnlocked: () => true,
    isThemeUnlocked: () => true,
    getProfileSummary: () => ({
        bestScore: 9,
        favoriteThemeId: 'neon',
        currentStreak: globalThis.__testStreakValue || 0,
        totalRounds: 20,
        nextMilestone: { label: 'Test milestone', remaining: 2 },
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
}));

vi.mock('../../services/countdown', () => ({
    getTimeUntilNextChallenge: () => 3600000,
    formatCountdown: () => '1h 0m',
}));

vi.mock('../../services/leaderboard', () => ({
    getPlayerRank: () => null,
    getDailyLeaderboard: () => [],
    getCurrentSeason: () => ({ id: '2026-3', name: 'March 2026', startDate: new Date() }),
}));

vi.mock('../../services/challenges', () => ({
    getStreakBonus: () => 1,
}));

vi.mock('../../services/referrals', () => ({
    parseReferralFromUrl: () => null,
    trackReferral: vi.fn(),
    hasReferralBonus: () => false,
    claimReferralBonus: vi.fn(),
    generateReferralCode: () => 'ABC123',
}));

vi.mock('../../services/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('../../services/sounds', () => ({
    toggleMute: vi.fn(() => false),
    isMuted: () => false,
    playClick: vi.fn(),
}));

vi.mock('../../services/weeklyEvents', () => ({
    getCurrentWeeklyEvent: () => null,
    getTimeUntilNextWeek: () => 0,
    formatWeeklyCountdown: () => '7d',
}));

vi.mock('../../lib/validation', () => ({
    validatePlayerName: (name) => ({ valid: !!name?.trim(), value: name?.trim() }),
}));

vi.mock('../analytics/ScoreHistoryChart', () => ({
    ScoreHistoryChart: () => null,
}));

vi.mock('../social/FriendProfile', () => ({
    FriendProfile: () => null,
}));

let mockBackendEnabled = false;
vi.mock('../../lib/supabase', () => ({
    isBackendEnabled: () => mockBackendEnabled,
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

vi.mock('../../components/OnboardingModal', () => ({
    OnboardingModal: () => <div data-testid="onboarding-modal">Onboarding</div>,
}));

vi.mock('../../components/OnboardingTour', () => ({
    OnboardingTour: ({ onComplete }) => <div data-testid="onboarding-tour"><button onClick={onComplete}>Complete Tour</button></div>,
}));

vi.mock('../../components/NotificationBanner', () => ({
    NotificationBanner: () => null,
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

vi.mock('../../components/NotificationBanner', () => ({
    NotificationBanner: () => null,
}));

const loggedInUser = { name: 'TestUser', avatar: '👽', themeId: 'classic', scoringMode: 'human', mediaType: 'image', useCustomImages: false };

describe('Lobby', () => {
    beforeEach(() => {
        mockUser = null;
        mockSessionId = null;
        mockBackendEnabled = false;
        globalThis.__testStreakValue = 0;
        vi.clearAllMocks();
    });

    it('renders the Create Profile heading when not logged in', () => {
        render(<Lobby />);
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
    });

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
    });
});

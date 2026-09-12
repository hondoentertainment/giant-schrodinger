import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockEndSession = vi.fn();
const mockSetGameState = vi.fn();
const mockStartSession = vi.fn();
const mockBeginRound = vi.fn();
let mockIsDailyChallenge = true;
let mockSessionResults = [
    { score: 8, submission: 'green roommate', collisionId: 'c1', modifier: { id: 'normal' } },
    { score: 6, submission: 'sleepy toaster', collisionId: 'c2', modifier: { id: 'normal' } },
];

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({
        sessionResults: mockSessionResults,
        sessionScore: 14,
        totalRounds: mockSessionResults.length,
        endSession: mockEndSession,
        isDailyChallenge: mockIsDailyChallenge,
        setGameState: mockSetGameState,
        startSession: mockStartSession,
        beginRound: mockBeginRound,
    }),
}));

const toastMocks = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: toastMocks }),
}));

vi.mock('../../services/backend', () => ({
    getJudgementsByCollisionIds: vi.fn(() => Promise.resolve({})),
}));
vi.mock('../../services/judgements', () => ({
    getJudgementForCollision: vi.fn(() => null),
}));

let mockStats = { totalRounds: 20, currentStreak: 3, lastPlayedDate: '2026-09-10' };
vi.mock('../../services/stats', () => ({
    getStats: () => mockStats,
    getStreakStatus: () => (mockStats.currentStreak > 0 ? 'active_today' : 'none'),
}));

vi.mock('../../services/dailyChallenge', () => ({
    getDailyChallengeHistory: () => [{ date: '2026-09-10' }],
    getDailyChallengeSummary: () => ({ weeklyCompletions: 1, shareLine: 'Daily done' }),
    hasDailyChallengeBeenPlayed: () => true,
}));

vi.mock('../../components/PWAInstallBanner', () => ({
    PWAInstallBanner: () => null,
}));

vi.mock('../../lib/haptics', () => ({ haptic: vi.fn() }));
vi.mock('../../services/sounds', () => ({ playConfetti: vi.fn() }));
vi.mock('../../services/analytics', () => ({ trackEvent: vi.fn() }));

const shareOrCopy = vi.fn(async () => ({ method: 'clipboard', copied: true }));
vi.mock('../../lib/shareOrCopy', () => ({
    LINK_COPIED_MESSAGE: 'Link copied',
    shareOrCopy: (...args) => shareOrCopy(...args),
}));

let mockCelebrate = false;
vi.mock('../../lib/firstSession', () => ({
    shouldCelebrateFirstSession: () => mockCelebrate,
    markFirstSessionCelebrated: vi.fn(),
}));

import { SessionSummary } from './SessionSummary';

describe('SessionSummary', () => {
    beforeEach(() => {
        mockIsDailyChallenge = true;
        mockCelebrate = false;
        mockStats = { totalRounds: 20, currentStreak: 3, lastPlayedDate: '2026-09-10' };
        mockSessionResults = [
            { score: 8, submission: 'green roommate', collisionId: 'c1', modifier: { id: 'normal' } },
            { score: 6, submission: 'sleepy toaster', collisionId: 'c2', modifier: { id: 'normal' } },
        ];
        vi.clearAllMocks();
        shareOrCopy.mockResolvedValue({ method: 'clipboard', copied: true });
    });

    it('leads with a what-next stack and keeps score secondary', async () => {
        const user = userEvent.setup();
        render(<SessionSummary />);

        expect(screen.getByText(/What next/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Play again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Share best line/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Invite friends to a room/i })).toBeInTheDocument();
        expect(screen.getByText(/Day 3 streak is alive/i)).toBeInTheDocument();
        expect(screen.queryByText(/Play again tomorrow to start a streak/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Share your masterpiece/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Share best line/i }));
        expect(shareOrCopy).toHaveBeenCalled();
        expect(toastMocks.success).toHaveBeenCalledWith('Link copied');
    });

    it('starts another run from Play again', async () => {
        const user = userEvent.setup();
        render(<SessionSummary />);
        await user.click(screen.getByRole('button', { name: /Play again/i }));
        expect(mockStartSession).toHaveBeenCalledWith(3, false);
        expect(mockBeginRound).toHaveBeenCalled();
    });

    it('celebrates the first session once with a single CTA', () => {
        mockCelebrate = true;
        render(<SessionSummary />);
        expect(screen.getByText(/First session in the books/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Share best line/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Play again/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Invite friends/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/Round breakdown/i)).not.toBeInTheDocument();
    });

    it('hides streak copy when there is no streak data', () => {
        mockStats = { totalRounds: 6, currentStreak: 0, lastPlayedDate: null };
        mockIsDailyChallenge = false;
        render(<SessionSummary />);
        expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Play again tomorrow to start a streak/i)).not.toBeInTheDocument();
    });
});

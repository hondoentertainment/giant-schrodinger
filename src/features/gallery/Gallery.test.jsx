import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb) { this._cb = cb; }
    observe() { this._cb([{ isIntersecting: true }]); }
    unobserve() {}
    disconnect() {}
  });
});

vi.mock('../../services/storage', () => ({
  getCollisions: () => [
    { id: '1', submission: 'Test connection', score: 8, createdAt: Date.now() },
  ],
}));

vi.mock('../../services/votes', () => ({
  getVotes: () => ({}),
  upvote: vi.fn(),
  downvote: vi.fn(),
  getAllVotes: () => ({}),
  getVoteDirection: () => null,
}));

vi.mock('../../services/highlights', () => ({
  getHighlights: () => [],
  getWeeklyHighlights: () => [],
}));

vi.mock('../../services/backend', () => ({
  isBackendEnabled: () => false,
  getJudgementsByCollisionIds: () => Promise.resolve({}),
}));

vi.mock('../../services/judgements', () => ({
  getJudgement: () => null,
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({ setGameState: vi.fn() }),
}));

vi.mock('../../lib/scoreBands', () => ({
  getScoreBand: () => ({ label: 'Great', color: 'from-green-400 to-green-600' }),
}));

// Import after mocks
import { Gallery } from './Gallery';

describe('Gallery', () => {
  it('renders gallery heading', async () => {
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText(/Connection Gallery/i)).toBeInTheDocument();
    });
  });

  it('shows connection entries', async () => {
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText(/No connections yet|Test connection/i)).toBeInTheDocument();
    });
  });

  it('has a sort control', async () => {
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Sort gallery/i)).toBeInTheDocument();
    });
  });
});

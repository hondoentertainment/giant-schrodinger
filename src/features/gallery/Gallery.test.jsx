import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

beforeAll(() => {
  global.IntersectionObserver = class {
    constructor(cb) {
      this._cb = cb;
    }
    observe() {
      this._cb([{ isIntersecting: true }]);
    }
    unobserve() {}
    disconnect() {}
  };
});

// Mutable mock list so individual tests can control what getCollisions returns.
// Default: one sample connection so top-level tests show gallery entries.
let mockCollisionList = [
  {
    id: '1',
    submission: 'Test connection',
    score: 8,
    timestamp: Date.now(),
    imageUrl: 'https://example.com/img.jpg',
  },
];
vi.mock('../../services/storage', () => ({
  getCollisions: () => mockCollisionList,
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
  beforeEach(() => {
    // Reset to the "populated" default before every test.
    mockCollisionList = [
      {
        id: '1',
        submission: 'Test connection',
        score: 8,
        timestamp: Date.now(),
        imageUrl: 'https://example.com/img.jpg',
      },
    ];
  });

  it('renders gallery heading', () => {
    render(<Gallery />);
    expect(screen.getByText(/Connection Gallery/i)).toBeInTheDocument();
  });

  it('shows connection entries when mock data is present', () => {
    render(<Gallery />);
    // The rendered gallery exposes a list with an accessible label.
    expect(screen.getByRole('list', { name: /your connection gallery/i })).toBeInTheDocument();
    // And the mocked submission text is present in aria-label / DOM.
    expect(screen.getAllByText(/Test connection/i).length).toBeGreaterThan(0);
  });

  it('has a sort control', () => {
    render(<Gallery />);
    expect(screen.getByLabelText(/Sort gallery/i)).toBeInTheDocument();
  });

  it('renders an empty state when there are no connections', () => {
    mockCollisionList = [];
    render(<Gallery />);
    expect(screen.getByText(/No connections yet\. Play a game!/i)).toBeInTheDocument();
    // The connection list should NOT be present when empty.
    expect(
      screen.queryByRole('list', { name: /your connection gallery/i })
    ).not.toBeInTheDocument();
  });

  it('renders each gallery item as a keyboard-focusable element', () => {
    mockCollisionList = [
      {
        id: 'a',
        submission: 'Alpha',
        score: 5,
        timestamp: Date.now(),
        imageUrl: 'https://example.com/a.jpg',
      },
      {
        id: 'b',
        submission: 'Beta',
        score: 9,
        timestamp: Date.now(),
        imageUrl: 'https://example.com/b.jpg',
      },
    ];
    render(<Gallery />);
    // Each collision is rendered inside an <article> with tabIndex=0,
    // so the browser treats it as a focusable element for keyboard users.
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBe(2);
    articles.forEach((el) => {
      expect(el).toHaveAttribute('tabindex', '0');
    });
  });
});

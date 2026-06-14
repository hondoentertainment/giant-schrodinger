import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb) { this._cb = cb; }
    observe() { this._cb([{ isIntersecting: true }]); }
    unobserve() {}
    disconnect() {}
  });
});

// Collisions fixture - the tests below can override the returned array to cover
// empty state, sort, and judgement merging behavior.
const baseCollisions = [
  {
    id: '1',
    submission: 'Test connection',
    score: 8,
    timestamp: Date.now() - 1000,
    imageUrl: 'https://example.com/a.jpg',
  },
];
let mockCollisions = baseCollisions;
vi.mock('../../services/storage', () => ({
  getCollisions: () => mockCollisions,
}));

vi.mock('../../services/votes', () => ({
  getVotes: () => ({ up: 0, down: 0, score: 0 }),
  upvote: vi.fn(),
  downvote: vi.fn(),
  getAllVotes: () => ({}),
  getVoteDirection: () => null,
}));

vi.mock('../../services/highlights', () => ({
  getHighlights: () => [],
  getWeeklyHighlights: () => [],
}));

// Judgement mock is controllable per-test: tests set the resolved value via
// `mockJudgementsResolve`, or set `holdJudgementResolve = true` and call
// `releaseJudgementResolve()` manually to assert the loading state.
let mockJudgementsResolve = () => ({});
let holdJudgementResolve = false;
let _pendingJudgementResolve = null;
function releaseJudgementResolve() {
  if (_pendingJudgementResolve) {
    _pendingJudgementResolve(mockJudgementsResolve());
    _pendingJudgementResolve = null;
  }
}
vi.mock('../../services/backend', () => ({
  isBackendEnabled: () => false,
  getJudgementsByCollisionIds: vi.fn(() => {
    if (holdJudgementResolve) {
      return new Promise((resolve) => { _pendingJudgementResolve = resolve; });
    }
    return Promise.resolve(mockJudgementsResolve());
  }),
}));

vi.mock('../../services/judgements', () => ({
  getJudgement: () => null,
}));

vi.mock('../../services/moderation', () => ({
  flagContent: vi.fn(),
}));

const mockSetGameState = vi.fn();
vi.mock('../../context/GameContext', () => ({
  useGame: () => ({ setGameState: mockSetGameState }),
}));

vi.mock('../../lib/scoreBands', () => ({
  getScoreBand: () => ({ label: 'Great', color: 'from-green-400 to-green-600' }),
}));

// Import after mocks
import { Gallery } from './Gallery';

describe('Gallery', () => {
  beforeEach(() => {
    mockCollisions = baseCollisions;
    mockJudgementsResolve = () => ({});
    holdJudgementResolve = false;
    _pendingJudgementResolve = null;
    mockSetGameState.mockClear();
  });

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

  it('shows the empty state when no collisions are stored', async () => {
    mockCollisions = [];
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText(/No connections yet\. Play a game!/i)).toBeInTheDocument();
    });
  });

  it('clicking Back to Lobby sets game state to LOBBY', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    const backButton = await screen.findByRole('button', { name: /back to lobby/i });
    await user.click(backButton);
    expect(mockSetGameState).toHaveBeenCalledWith('LOBBY');
  });

  it('shows the loading indicator while judgements are loading and hides it after resolve', async () => {
    mockCollisions = [
      { id: '1', submission: 'Pending one', score: 7, timestamp: Date.now(), imageUrl: 'https://example.com/p.jpg' },
    ];
    holdJudgementResolve = true;
    render(<Gallery />);
    const loadingEl = await screen.findByText(/Loading friend feedback\.\.\./i);
    expect(loadingEl).toBeInTheDocument();
    // Release the pending promise and the loading indicator should go away.
    await act(async () => {
      releaseJudgementResolve();
    });
    await waitFor(() => {
      expect(screen.queryByText(/Loading friend feedback\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('displays friend judgements on matching cards when backend returns them', async () => {
    mockCollisions = [
      { id: 'abc', submission: 'Witty take', score: 9, timestamp: Date.now(), imageUrl: 'https://example.com/j.jpg' },
    ];
    mockJudgementsResolve = () => ({
      abc: { judgeName: 'Alice', score: 10, commentary: 'Brilliant!' },
    });
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText(/Judged by Alice: 10\/10/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Brilliant!/)).toBeInTheDocument();
  });

  it('changing sort select reorders collision items', async () => {
    const user = userEvent.setup();
    // Two collisions with different scores + timestamps so sort orders differ.
    mockCollisions = [
      { id: 'low', submission: 'Low score one', score: 2, timestamp: Date.now(), imageUrl: 'https://example.com/low.jpg' },
      { id: 'high', submission: 'High score one', score: 10, timestamp: Date.now() - 10_000, imageUrl: 'https://example.com/high.jpg' },
    ];
    render(<Gallery />);
    const list = await screen.findByRole('list', { name: /your connection gallery/i });
    // Each LazyImage renders an <article>; collect them in DOM order.
    let items = within(list).getAllByRole('article');
    // Default sort is 'newest' — "Low score one" has the newer timestamp, so it appears first.
    expect(items[0].getAttribute('aria-label')).toMatch(/Low score one/);

    // Switch to "Highest score" — "High score one" should move to position 0.
    const sortSelect = screen.getByLabelText(/Sort gallery/i);
    await user.selectOptions(sortSelect, 'score-high');
    items = within(list).getAllByRole('article');
    expect(items[0].getAttribute('aria-label')).toMatch(/High score one/);
  });

  it('switching to Community tab shows filter chips and sort control', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: /^community$/i }));
    // Filter chips specific to the community view
    expect(screen.getByRole('button', { name: /^neon$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ocean$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/sort community gallery/i)).toBeInTheDocument();
  });

  it('community theme filter narrows visible submissions to the selected theme', async () => {
    const user = userEvent.setup();
    render(<Gallery />);
    await user.click(await screen.findByRole('button', { name: /^community$/i }));
    const communityList = await screen.findByRole('list', { name: /community submissions/i });
    // Community cards are the direct children of the list container.
    const initialCount = communityList.childElementCount;
    expect(initialCount).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /^neon$/i }));
    const filteredList = await screen.findByRole('list', { name: /community submissions/i });
    expect(filteredList.childElementCount).toBeLessThan(initialCount);
    // Every visible card should expose a "neon" theme label.
    const themeLabels = within(filteredList).getAllByText(/^neon$/i);
    expect(themeLabels.length).toBe(filteredList.childElementCount);
  });

  it('renders LazyImage cards as accessible articles with IntersectionObserver triggering image load', async () => {
    mockCollisions = [
      { id: 'lazy1', submission: 'Lazy thing', score: 6, timestamp: Date.now(), imageUrl: 'https://example.com/lazy.jpg' },
    ];
    render(<Gallery />);
    // The mocked IntersectionObserver fires isIntersecting=true immediately,
    // so the <img> should be present (rather than only the placeholder).
    const card = await screen.findByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Lazy thing'));
    const img = await within(card).findByAltText('Lazy thing');
    expect(img).toHaveAttribute('src', 'https://example.com/lazy.jpg');
  });
});

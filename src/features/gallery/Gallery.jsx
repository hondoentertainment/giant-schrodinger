import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getCollisions } from '../../services/storage';
import { getJudgementsByCollisionIds } from '../../services/backend';
import { getJudgement } from '../../services/judgements';
import { upvote, downvote, getVotes, getAllVotes, getVoteDirection } from '../../services/votes';
import { getHighlights, getWeeklyHighlights } from '../../services/highlights';
import { flagContent } from '../../services/moderation';
import { getScoreBand } from '../../lib/scoreBands';

const MOCK_COMMUNITY = [
  {
    id: 'c1',
    playerName: 'WitMaster',
    avatar: '\uD83E\uDDE0',
    submission: 'Both peak at 3AM when no one is watching',
    score: 9,
    theme: 'neon',
    conceptLeft: '3AM Taxi Ride',
    conceptRight: 'Midnight Arcade Fever',
    votes: 42,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'c2',
    playerName: 'PunQueen',
    avatar: '\uD83D\uDC51',
    submission: 'They both make waves that no one asked for',
    score: 8,
    theme: 'ocean',
    conceptLeft: "Poseidon's Living Room",
    conceptRight: 'The Wave That Writes Poetry',
    votes: 38,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'c3',
    playerName: 'CosmicJester',
    avatar: '\uD83C\uDCCF',
    submission: 'Neither has an off switch once you start',
    score: 7,
    theme: 'neon',
    conceptLeft: 'Infinite Jukebox',
    conceptRight: "The Thought That Won't Sleep",
    votes: 31,
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'c4',
    playerName: 'ZenMaster42',
    avatar: '\uD83E\uDDD8',
    submission: 'Both are louder when the room is silent',
    score: 9,
    theme: 'nature',
    conceptLeft: "Morning's First Songbird",
    conceptRight: 'A Ringing in Your Ears',
    votes: 55,
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'c5',
    playerName: 'NightOwlNinja',
    avatar: '\uD83E\uDD89',
    submission: 'You only notice them when they stop',
    score: 6,
    theme: 'nature',
    conceptLeft: 'The Background Hum of Civilization',
    conceptRight: 'A Heartbeat',
    votes: 19,
    createdAt: Date.now() - 18000000,
  },
  {
    id: 'c6',
    playerName: 'PixelPoet',
    avatar: '\uD83C\uDFA8',
    submission: 'Both promise you the world but deliver a headache',
    score: 5,
    theme: 'retro',
    conceptLeft: 'A First Date',
    conceptRight: 'Assembly Instructions from IKEA',
    votes: 27,
    createdAt: Date.now() - 21600000,
  },
  {
    id: 'c7',
    playerName: 'ChaosBard',
    avatar: '\uD83C\uDFB8',
    submission: 'They both sound better with reverb',
    score: 8,
    theme: 'neon',
    conceptLeft: "A Cathedral's Echo",
    conceptRight: 'Your Voice in the Shower',
    votes: 34,
    createdAt: Date.now() - 25200000,
  },
  {
    id: 'c8',
    playerName: 'LogicLlama',
    avatar: '\uD83E\uDD99',
    submission: 'Both require faith and a running start',
    score: 7,
    theme: 'nature',
    conceptLeft: 'A Leap of Faith',
    conceptRight: 'Learning to Ride a Bicycle',
    votes: 22,
    createdAt: Date.now() - 28800000,
  },
  {
    id: 'c9',
    playerName: 'VelvetThunder',
    avatar: '\u26A1',
    submission: 'They both leave you wondering what just happened',
    score: 10,
    theme: 'ocean',
    conceptLeft: 'A Magic Trick',
    conceptRight: 'A Rogue Wave',
    votes: 61,
    createdAt: Date.now() - 32400000,
  },
  {
    id: 'c10',
    playerName: 'QuietStorm',
    avatar: '\uD83C\uDF0A',
    submission: 'Both are journeys you take while standing still',
    score: 3,
    theme: 'retro',
    conceptLeft: 'A Good Book',
    conceptRight: 'An Escalator',
    votes: 8,
    createdAt: Date.now() - 36000000,
  },
];

function buildSortOptions(votesMap) {
  return [
    { id: 'newest', label: 'Newest', fn: (a, b) => new Date(b.timestamp) - new Date(a.timestamp) },
    { id: 'oldest', label: 'Oldest', fn: (a, b) => new Date(a.timestamp) - new Date(b.timestamp) },
    { id: 'score-high', label: 'Highest score', fn: (a, b) => (b.score ?? 0) - (a.score ?? 0) },
    { id: 'score-low', label: 'Lowest score', fn: (a, b) => (a.score ?? 0) - (b.score ?? 0) },
    {
      id: 'most-voted',
      label: 'Most voted',
      fn: (a, b) => {
        const va = votesMap[a.id] || { up: 0, down: 0 };
        const vb = votesMap[b.id] || { up: 0, down: 0 };
        return vb.up - vb.down - (va.up - va.down);
      },
    },
  ];
}

function VoteButtons({ collisionId }) {
  const [votes, setVotesState] = useState(() => getVotes(collisionId));
  const [direction, setDirection] = useState(() => getVoteDirection(collisionId));
  const voted = direction !== null;

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (voted) return;
    upvote(collisionId);
    setVotesState(getVotes(collisionId));
    setDirection('up');
  };
  const handleDownvote = (e) => {
    e.stopPropagation();
    if (voted) return;
    downvote(collisionId);
    setVotesState(getVotes(collisionId));
    setDirection('down');
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={handleUpvote}
        disabled={voted}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          direction === 'up'
            ? 'bg-emerald-500/30 text-emerald-300'
            : 'bg-white/10 text-white/50 hover:bg-emerald-500/20 hover:text-emerald-300'
        } disabled:cursor-default`}
        aria-label="Upvote"
      >
        ▲ {votes.up}
      </button>
      <button
        onClick={handleDownvote}
        disabled={voted}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          direction === 'down'
            ? 'bg-red-500/30 text-red-300'
            : 'bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-300'
        } disabled:cursor-default`}
        aria-label="Downvote"
      >
        ▼ {votes.down}
      </button>
      {votes.score !== 0 && (
        <span
          className={`text-xs font-bold ${votes.score > 0 ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {votes.score > 0 ? '+' : ''}
          {votes.score}
        </span>
      )}
    </div>
  );
}

const LazyImage = React.memo(function LazyImage({ collision, displayJudgement }) {
  const [imageStatus, setImageStatus] = useState('loading');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const fallbackUrl =
    collision.fallbackImageUrl || 'https://picsum.photos/seed/venn-fallback/800/800';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '100px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleError = (event) => {
    const fallback = event.currentTarget.dataset.fallback;
    if (fallback && event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
      event.currentTarget.onerror = () => setImageStatus('error');
    } else {
      setImageStatus('error');
    }
  };

  const fj = displayJudgement;

  return (
    <article
      ref={ref}
      className="group relative aspect-square rounded-2xl overflow-hidden glass-panel transition-transform hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-purple-500 focus-within:outline-none"
      tabIndex={0}
      aria-label={`Connection: "${collision.submission}". Score ${collision.score} out of 10. ${new Date(collision.timestamp).toLocaleDateString()}.${fj ? ` Judged by ${fj.judgeName || fj.judge_name || 'a friend'}: ${fj.score}/10.` : ''}`}
    >
      {imageStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <div
            className="w-12 h-12 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin"
            aria-hidden="true"
          />
        </div>
      )}
      {imageStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <div className="text-center text-white/50 text-sm px-4">Image unavailable</div>
        </div>
      )}
      {isVisible && (
        <img
          src={collision.imageUrl}
          alt={collision.submission}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          data-fallback={fallbackUrl}
          onLoad={() => setImageStatus('loaded')}
          onError={handleError}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <div className="text-2xl font-bold text-white mb-1">{collision.submission}</div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <div className="text-white/60 text-sm">
              {new Date(collision.timestamp).toLocaleDateString()}
            </div>
            <div className="text-yellow-400 font-bold">{collision.score}/10</div>
          </div>
          {/* Voting & Report */}
          <div className="flex items-center justify-between">
            <VoteButtons collisionId={collision.id} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                flagContent(collision.id, 'inappropriate');
              }}
              className="text-white/30 hover:text-red-400 text-xs"
              aria-label="Report this submission"
            >
              {'\u{1F6A9}'} Report
            </button>
          </div>
          {fj && (
            <div className="text-white/70 text-sm border-t border-white/20 pt-2 mt-2">
              Judged by {fj.judgeName || fj.judge_name || 'a friend'}: {fj.score}/10
              {fj.commentary && (
                <div className="text-white/50 italic mt-1 truncate">
                  &ldquo;{fj.commentary}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

const COMMUNITY_THEMES = ['All', 'Neon', 'Ocean', 'Nature', 'Retro'];
const SCORE_RANGES = [
  { id: 'all', label: 'All' },
  { id: '8+', label: '8+', fn: (s) => s >= 8 },
  { id: '6-7', label: '6-7', fn: (s) => s >= 6 && s <= 7 },
  { id: '<6', label: '<6', fn: (s) => s < 6 },
];
const COMMUNITY_SORTS = [
  { id: 'most-voted', label: 'Most Voted', fn: (a, b) => b.votes - a.votes },
  { id: 'highest-score', label: 'Highest Score', fn: (a, b) => b.score - a.score },
  { id: 'newest', label: 'Newest', fn: (a, b) => b.createdAt - a.createdAt },
];

function CommunityVoteButtons({ entry }) {
  const [votes, setVotes] = useState(entry.votes);
  const [direction, setDirection] = useState(() => getVoteDirection(entry.id));
  const voted = direction !== null;

  const handleUp = (e) => {
    e.stopPropagation();
    if (voted) return;
    upvote(entry.id);
    setVotes((v) => v + 1);
    setDirection('up');
  };
  const handleDown = (e) => {
    e.stopPropagation();
    if (voted) return;
    downvote(entry.id);
    setVotes((v) => v - 1);
    setDirection('down');
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={handleUp}
        disabled={voted}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          direction === 'up'
            ? 'bg-emerald-500/30 text-emerald-300'
            : 'bg-white/10 text-white/50 hover:bg-emerald-500/20 hover:text-emerald-300'
        } disabled:cursor-default`}
        aria-label="Upvote"
      >
        &#9650;
      </button>
      <span
        className={`text-sm font-bold ${votes > 0 ? 'text-emerald-400' : votes < 0 ? 'text-red-400' : 'text-white/50'}`}
      >
        {votes}
      </span>
      <button
        onClick={handleDown}
        disabled={voted}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          direction === 'down'
            ? 'bg-red-500/30 text-red-300'
            : 'bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-300'
        } disabled:cursor-default`}
        aria-label="Downvote"
      >
        &#9660;
      </button>
    </div>
  );
}

const CommunityCard = React.memo(function CommunityCard({ entry }) {
  const band = getScoreBand(entry.score);
  return (
    <div className="group relative rounded-2xl overflow-hidden glass-panel p-5 transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {entry.avatar}
        </span>
        <span className="font-bold text-white text-sm">{entry.playerName}</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold capitalize bg-white/10 text-white/60 border border-white/10">
          {entry.theme}
        </span>
      </div>
      <blockquote className="text-white/90 italic text-base mb-3 leading-relaxed">
        &ldquo;{entry.submission}&rdquo;
      </blockquote>
      <div className="text-white/40 text-xs mb-3">
        {entry.conceptLeft} &times; {entry.conceptRight}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${band.color}`}
        >
          {entry.score}/10
        </span>
        <span className="text-white/40 text-xs">{band.label}</span>
      </div>
      <CommunityVoteButtons entry={entry} />
    </div>
  );
});

function CommunityTab() {
  const [themeFilter, setThemeFilter] = useState('All');
  const [scoreRange, setScoreRange] = useState('all');
  const [sortBy, setSortBy] = useState('most-voted');

  const filtered = useMemo(() => {
    let items = [...MOCK_COMMUNITY];
    if (themeFilter !== 'All') {
      items = items.filter((e) => e.theme.toLowerCase() === themeFilter.toLowerCase());
    }
    const range = SCORE_RANGES.find((r) => r.id === scoreRange);
    if (range?.fn) {
      items = items.filter((e) => range.fn(e.score));
    }
    const sort = COMMUNITY_SORTS.find((s) => s.id === sortBy) || COMMUNITY_SORTS[0];
    items.sort(sort.fn);
    return items;
  }, [themeFilter, scoreRange, sortBy]);

  const trending = useMemo(
    () => [...MOCK_COMMUNITY].sort((a, b) => b.votes - a.votes).slice(0, 5),
    []
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Trending Today */}
      <div className="mb-8">
        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-orange-400">&#9733;</span> Trending Today
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {trending.map((entry, i) => {
            const band = getScoreBand(entry.score);
            return (
              <div
                key={entry.id}
                className={`relative p-3 rounded-2xl border transition-all ${
                  i === 0
                    ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {i === 0 && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    #1
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{entry.avatar}</span>
                  <span className="text-white text-xs font-bold truncate">{entry.playerName}</span>
                </div>
                <div className="text-white/70 text-sm italic truncate mb-1">
                  &ldquo;{entry.submission}&rdquo;
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-black text-transparent bg-clip-text bg-gradient-to-r ${band.color}`}
                  >
                    {entry.score}/10
                  </span>
                  <span className="text-white/40 text-xs">&#9650; {entry.votes}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs uppercase tracking-wider">Theme</span>
          {COMMUNITY_THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setThemeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                themeFilter === t
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs uppercase tracking-wider">Score</span>
          {SCORE_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setScoreRange(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                scoreRange === r.id
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="community-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="community-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/30 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            aria-label="Sort community gallery"
          >
            {COMMUNITY_SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-3xl">
          <p className="text-white/40 text-lg">No submissions match your filters.</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Community submissions"
        >
          {filtered.map((entry) => (
            <CommunityCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Gallery() {
  const { setGameState } = useGame();
  const [activeTab, setActiveTab] = useState('my');
  const [collisions, setCollisions] = useState([]);
  const [friendJudgements, setFriendJudgements] = useState({});
  const [loadingJudgements, setLoadingJudgements] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [todayHighlights, setTodayHighlights] = useState([]);
  const galleryGridRef = useRef(null);

  const handleGalleryKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const grid = galleryGridRef.current;
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('[tabindex="0"]'));
    const currentIndex = items.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    e.preventDefault();
    if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
      items[currentIndex + 1].focus();
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      items[currentIndex - 1].focus();
    }
  };

  useEffect(() => {
    // Load today's best highlights (top-scoring from all highlights)
    const highlights = getHighlights();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayItems = highlights
      .filter((h) => h.timestamp >= startOfDay)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    setTodayHighlights(todayItems.length > 0 ? todayItems : highlights.slice(0, 3));
  }, []);

  useEffect(() => {
    const list = getCollisions();
    setCollisions(list);
    const ids = list.map((c) => c.id);
    if (ids.length === 0) {
      setLoadingJudgements(false);
    } else {
      setLoadingJudgements(true);
      getJudgementsByCollisionIds(ids)
        .then(setFriendJudgements)
        .finally(() => setLoadingJudgements(false));
    }
  }, []);

  const getDisplayJudgement = (collision) =>
    friendJudgements[collision.id] || getJudgement(collision.id);

  const votesMap = useMemo(() => getAllVotes(), [collisions]);
  const sortOptions = useMemo(() => buildSortOptions(votesMap), [votesMap]);
  const sorted = useMemo(() => {
    const sortOpt = sortOptions.find((o) => o.id === sortBy) ?? sortOptions[0];
    return [...collisions].sort(sortOpt.fn);
  }, [collisions, sortBy, sortOptions]);

  return (
    <div className="w-full max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-4xl font-display font-bold text-white">Connection Gallery</h2>
        <button
          onClick={() => setGameState('LOBBY')}
          className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-h-[44px]"
          aria-label="Back to Lobby"
        >
          Back to Lobby
        </button>
      </div>

      {/* Tab system */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'my'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          My Connections
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'community'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Community
        </button>
      </div>

      {activeTab === 'community' ? (
        <CommunityTab />
      ) : (
        <>
          {/* Sort controls for My Connections */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="gallery-sort" className="text-white/50 text-sm sr-only">
                Sort by
              </label>
              <select
                id="gallery-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/30 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                aria-label="Sort gallery"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Best of Today */}
          {todayHighlights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-400">&#9733;</span> Best of Today
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {todayHighlights.map((h, i) => (
                  <div
                    key={h.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      i === 0
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {i === 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        #1
                      </div>
                    )}
                    <div className="text-lg font-bold text-white mb-1 truncate">{h.submission}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm">
                        {h.leftLabel && h.rightLabel
                          ? `${h.leftLabel} + ${h.rightLabel}`
                          : 'Connection'}
                      </span>
                      <span className="text-yellow-400 font-bold text-lg">{h.score}/10</span>
                    </div>
                    {h.playerName && (
                      <div className="text-white/40 text-xs mt-1">by {h.playerName}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {collisions.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl">
              <p className="text-white/40 text-xl">No connections yet. Play a game!</p>
            </div>
          ) : (
            <>
              {loadingJudgements && (
                <p className="text-white/40 text-sm mb-4" role="status" aria-live="polite">
                  Loading friend feedback...
                </p>
              )}
              <div
                ref={galleryGridRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                role="list"
                aria-label="Your connection gallery"
                onKeyDown={handleGalleryKeyDown}
              >
                {sorted.map((c) => (
                  <LazyImage key={c.id} collision={c} displayJudgement={getDisplayJudgement(c)} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

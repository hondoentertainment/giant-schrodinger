const STORAGE_KEY = 'vwf_prompt_packs';
const STATS_KEY = 'vwf_pack_stats';

const BUILT_IN_PACKS = [
  {
    id: 'builtin-impossible-connections',
    name: 'Impossible Connections',
    description: 'Absurd pairings that have no business being together',
    pairings: [
      { left: 'Tax Returns', right: 'Rollercoasters' },
      { left: 'Dentist Appointments', right: 'Skydiving' },
      { left: 'Spreadsheets', right: 'Breakdancing' },
      { left: 'Insurance Policies', right: 'Fireworks' },
      { left: 'Traffic Jams', right: 'Symphonies' },
      { left: 'Laundry', right: 'Outer Space' },
      { left: 'Plumbing', right: 'Poetry' },
      { left: 'Tax Code', right: 'Dance Moves' },
      { left: 'Accounting', right: 'Surfing' },
      { left: 'Filing Cabinets', right: 'Volcanoes' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-pop-culture-mashup',
    name: 'Pop Culture Mashup',
    description: 'When fandoms collide with everyday life',
    pairings: [
      { left: 'Superhero Movies', right: 'Sushi' },
      { left: 'Rock Bands', right: 'Houseplants' },
      { left: 'Video Games', right: 'Cooking Shows' },
      { left: 'Cartoons', right: 'Philosophy' },
      { left: 'Reality TV', right: 'Ancient History' },
      { left: 'Podcasts', right: 'Martial Arts' },
      { left: 'Memes', right: 'Classical Music' },
      { left: 'TikTok', right: 'Shakespeare' },
      { left: 'Netflix', right: 'Gardening' },
      { left: 'Anime', right: 'Weather' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-deep-thoughts',
    name: 'Deep Thoughts',
    description: 'Philosophical concepts meet mundane reality',
    pairings: [
      { left: 'Time', right: 'Sandwiches' },
      { left: 'Consciousness', right: 'Traffic Lights' },
      { left: 'Free Will', right: 'Vending Machines' },
      { left: 'Mortality', right: 'Board Games' },
      { left: 'Identity', right: 'Mirrors' },
      { left: 'Dreams', right: 'Alarm Clocks' },
      { left: 'Truth', right: 'Social Media' },
      { left: 'Beauty', right: 'Garbage' },
      { left: 'Love', right: 'Wi-Fi' },
      { left: 'Existence', right: 'Parking Lots' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

function loadCustomPacks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCustomPacks(packs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
}

function loadPackStats() {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function savePackStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getBuiltInPacks() {
  return [...BUILT_IN_PACKS];
}

export function createCustomPack({ name, description, pairings, creatorName }) {
  if (!name || typeof name !== 'string') {
    throw new Error('Pack name is required');
  }
  if (!pairings || !Array.isArray(pairings) || pairings.length < 10) {
    throw new Error('A minimum of 10 pairings is required');
  }
  for (const pairing of pairings) {
    if (!pairing.left || !pairing.right) {
      throw new Error('Each pairing must have a left and right value');
    }
  }

  const pack = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    description: (description || '').trim(),
    pairings: pairings.map((p) => ({ left: p.left.trim(), right: p.right.trim() })),
    creatorName: (creatorName || 'Anonymous').trim(),
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  const customPacks = loadCustomPacks();
  customPacks.push(pack);
  saveCustomPacks(customPacks);

  return pack;
}

export function getCustomPacks() {
  return loadCustomPacks();
}

export function getPackById(packId) {
  const builtIn = BUILT_IN_PACKS.find((p) => p.id === packId);
  if (builtIn) {
    return { ...builtIn };
  }
  const customPacks = loadCustomPacks();
  const custom = customPacks.find((p) => p.id === packId);
  return custom ? { ...custom } : null;
}

export function deleteCustomPack(packId) {
  const customPacks = loadCustomPacks();
  const index = customPacks.findIndex((p) => p.id === packId);
  if (index === -1) {
    return false;
  }
  customPacks.splice(index, 1);
  saveCustomPacks(customPacks);
  return true;
}

export function getRandomPairing(packId) {
  const pack = getPackById(packId);
  if (!pack) {
    return null;
  }
  const index = Math.floor(Math.random() * pack.pairings.length);
  return { left: pack.pairings[index].left, right: pack.pairings[index].right };
}

export function recordPackPlay(packId, score) {
  const stats = loadPackStats();
  if (!stats[packId]) {
    stats[packId] = { playCount: 0, scores: [] };
  }
  stats[packId].playCount += 1;
  stats[packId].scores.push({
    score,
    playedAt: new Date().toISOString(),
  });
  savePackStats(stats);
}

export function getPackLeaderboard(packId) {
  const stats = loadPackStats();
  const packStats = stats[packId];
  if (!packStats || !packStats.scores.length) {
    return [];
  }
  return [...packStats.scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

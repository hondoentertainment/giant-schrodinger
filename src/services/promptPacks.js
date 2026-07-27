import { loadJSON, saveJSON, generateId } from '../lib/storage';
import { isInSeason } from './seasonalRotation';

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
  {
    id: 'builtin-summer-heat',
    name: 'Summer Heat',
    description: 'Sun, sweat, festivals, and the weird poetry of hot days',
    seasonId: 'summer',
    pairings: [
      { left: 'Heat Mirages', right: 'Office Air Conditioning' },
      { left: 'Festival Wristbands', right: 'Library Silence' },
      { left: 'Popsicles', right: 'Deadline Panic' },
      { left: 'Road Trip Playlists', right: 'Wedding Vows' },
      { left: 'Sunscreen', right: 'Ambition' },
      { left: 'Fireflies', right: 'Push Notifications' },
      { left: 'Lemonade Stands', right: 'Venture Capital' },
      { left: 'Pool Noodles', right: 'Diplomacy' },
      { left: 'Thunderstorms', right: 'Group Chats' },
      { left: 'Golden Hour', right: 'Last Call' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'builtin-autumn-ember',
    name: 'Autumn Ember',
    description: 'Falling leaves, harvest rituals, and cozy dread',
    seasonId: 'autumn',
    pairings: [
      { left: 'Falling Leaves', right: 'Inbox Zero' },
      { left: 'Pumpkin Spice', right: 'Quarterly Reports' },
      { left: 'Corn Mazes', right: 'Career Paths' },
      { left: 'Sweaters', right: 'Security Blankets' },
      { left: 'Harvest Moons', right: 'Deadlines' },
      { left: 'Haunted Houses', right: 'Open Floor Plans' },
      { left: 'Apple Picking', right: 'Stock Picking' },
      { left: 'First Frost', right: 'First Impressions' },
      { left: 'Bonfires', right: 'Group Therapy' },
      { left: 'Daylight Saving', right: 'Procrastination' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2026-07-26T00:00:00.000Z',
  },
  {
    id: 'builtin-winter-glow',
    name: 'Winter Glow',
    description: 'Frost, firelight, and the strange comfort of the cold',
    seasonId: 'winter',
    pairings: [
      { left: 'Snow Days', right: 'Server Outages' },
      { left: 'Hot Cocoa', right: 'Peace Treaties' },
      { left: 'Ice Scrapers', right: 'Small Talk' },
      { left: 'Blizzards', right: 'Family Dinners' },
      { left: 'Mittens', right: 'Firewalls' },
      { left: 'Frozen Lakes', right: 'Poker Faces' },
      { left: 'Holiday Lights', right: 'Impulse Purchases' },
      { left: "New Year's Resolutions", right: 'Free Trials' },
      { left: 'Fireplaces', right: 'Podcasts' },
      { left: 'Icicles', right: 'Cliffhangers' },
    ],
    creatorName: 'Built-in',
    isBuiltIn: true,
    createdAt: '2026-07-26T00:00:00.000Z',
  },
];

function loadCustomPacks() {
  return loadJSON(STORAGE_KEY, []);
}

function saveCustomPacks(packs) {
  saveJSON(STORAGE_KEY, packs);
}

function loadPackStats() {
  return loadJSON(STATS_KEY, {});
}

function savePackStats(stats) {
  saveJSON(STATS_KEY, stats);
}

// Seasonal packs only surface during their calendar window; pass
// includeOffSeason to list everything (e.g. for admin/debug views).
export function getBuiltInPacks({ date = new Date(), includeOffSeason = false } = {}) {
  return BUILT_IN_PACKS.filter((pack) => includeOffSeason || isInSeason(pack.seasonId, date));
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
    id: generateId('custom_'),
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

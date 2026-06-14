const QUEUE_KEY = 'venn_matchmaking_queue';
const RATING_RANGE = 150;
const QUEUE_TIMEOUT = 30000;

function generateMatchId() {
  // Prefer crypto.randomUUID (Node 18+, modern browsers, jsdom).
  // Fall back to a Date.now()+random suffix for very old environments.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `match-${crypto.randomUUID()}`;
  }
  return `match-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function joinMatchmakingQueue(playerName, rating) {
  const entry = { playerName, rating, joinedAt: Date.now(), id: generateMatchId() };
  // In production: insert into Supabase matchmaking_queue table
  // For now: localStorage simulation
  const queue = getQueue();
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

export function findMatch(playerRating) {
  const queue = getQueue().filter(e => Date.now() - e.joinedAt < QUEUE_TIMEOUT);
  const match = queue.find(e => Math.abs(e.rating - playerRating) <= RATING_RANGE);
  return match || null;
}

export function leaveQueue(id) {
  const queue = getQueue().filter(e => e.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
}

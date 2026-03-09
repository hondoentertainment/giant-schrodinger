const VOTES_KEY = 'vwf_votes';
const MY_VOTES_KEY = 'vwf_my_votes';

function loadVotes() {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVotes(votes) {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // storage full or unavailable
  }
}

function loadMyVotes() {
  try {
    const raw = localStorage.getItem(MY_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMyVotes(myVotes) {
  try {
    localStorage.setItem(MY_VOTES_KEY, JSON.stringify(myVotes));
  } catch {
    // storage full or unavailable
  }
}

function ensureEntry(votes, collisionId) {
  if (!votes[collisionId]) {
    votes[collisionId] = { up: 0, down: 0 };
  }
}

export function upvote(collisionId) {
  const votes = loadVotes();
  ensureEntry(votes, collisionId);
  votes[collisionId].up += 1;
  saveVotes(votes);

  const myVotes = loadMyVotes();
  myVotes[collisionId] = 'up';
  saveMyVotes(myVotes);
}

export function downvote(collisionId) {
  const votes = loadVotes();
  ensureEntry(votes, collisionId);
  votes[collisionId].down += 1;
  saveVotes(votes);

  const myVotes = loadMyVotes();
  myVotes[collisionId] = 'down';
  saveMyVotes(myVotes);
}

export function getVotes(collisionId) {
  const votes = loadVotes();
  const entry = votes[collisionId] || { up: 0, down: 0 };
  return {
    up: entry.up,
    down: entry.down,
    score: entry.up - entry.down,
  };
}

export function getAllVotes() {
  return loadVotes();
}

export function hasVoted(collisionId) {
  const myVotes = loadMyVotes();
  return collisionId in myVotes;
}

export function getVoteDirection(collisionId) {
  const myVotes = loadMyVotes();
  return myVotes[collisionId] || null;
}

export function getBestConnections(collisions, limit = 10) {
  return collisions
    .map((collision) => ({
      ...collision,
      votes: getVotes(collision.id),
    }))
    .sort((a, b) => b.votes.score - a.votes.score)
    .slice(0, limit);
}

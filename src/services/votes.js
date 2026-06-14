const VOTES_KEY = 'vwf_votes';
const MY_VOTES_KEY = 'vwf_my_votes';

// Module-level cache to avoid repeated localStorage parses
let _votesCache = null;
let _myVotesCache = null;

function loadVotes() {
  if (_votesCache) return _votesCache;
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    _votesCache = raw ? JSON.parse(raw) : {};
  } catch {
    _votesCache = {};
  }
  return _votesCache;
}

function saveVotes(votes) {
  _votesCache = votes;
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // storage full or unavailable
  }
}

function loadMyVotes() {
  if (_myVotesCache) return _myVotesCache;
  try {
    const raw = localStorage.getItem(MY_VOTES_KEY);
    _myVotesCache = raw ? JSON.parse(raw) : {};
  } catch {
    _myVotesCache = {};
  }
  return _myVotesCache;
}

function saveMyVotes(myVotes) {
  _myVotesCache = myVotes;
  try {
    localStorage.setItem(MY_VOTES_KEY, JSON.stringify(myVotes));
  } catch {
    // storage full or unavailable
  }
}

function castVote(collisionId, direction) {
  const votes = loadVotes();
  if (!votes[collisionId]) {
    votes[collisionId] = { up: 0, down: 0 };
  }
  votes[collisionId][direction] += 1;
  saveVotes(votes);

  const myVotes = loadMyVotes();
  myVotes[collisionId] = direction;
  saveMyVotes(myVotes);
}

export function upvote(collisionId) {
  castVote(collisionId, 'up');
}

export function downvote(collisionId) {
  castVote(collisionId, 'down');
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
  const votes = loadVotes();
  return collisions
    .map((collision) => {
      const entry = votes[collision.id] || { up: 0, down: 0 };
      return {
        ...collision,
        votes: { up: entry.up, down: entry.down, score: entry.up - entry.down },
      };
    })
    .sort((a, b) => b.votes.score - a.votes.score)
    .slice(0, limit);
}

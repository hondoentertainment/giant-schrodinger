// Party game mode service for 4-8 player sessions
import { loadJSON, saveJSON } from '../lib/storage';

const STORAGE_KEY = 'vwf_party_games';

// Available party modes
const PARTY_MODES = [
  {
    id: 'round-robin',
    name: 'Round Robin',
    description: 'Everyone gets the same concepts and plays simultaneously. Compare answers after!',
    minPlayers: 4,
    maxPlayers: 8,
  },
  {
    id: 'hot-seat',
    name: 'Hot Seat',
    description: 'Pass the device around. Each player gets 30 seconds to answer!',
    minPlayers: 4,
    maxPlayers: 8,
    turnDuration: 30,
  },
  {
    id: 'team-battle',
    name: 'Team Battle',
    description: 'Split into two teams (2v2 or 3v3). Team scores are averaged!',
    minPlayers: 4,
    maxPlayers: 6,
  },
  {
    id: 'audience',
    name: 'Audience Mode',
    description: 'Players submit answers, then everyone (including non-players) votes on the best connection!',
    minPlayers: 4,
    maxPlayers: 8,
  },
];

// Generate a short 4-character game code
function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadGames() {
  return loadJSON(STORAGE_KEY, {});
}

function saveGames(games) {
  saveJSON(STORAGE_KEY, games);
}

// Save a single game back into the store
function persistGame(game) {
  const games = loadGames();
  games[game.id] = game;
  saveGames(games);
}

/**
 * Returns the list of available party modes.
 * @returns {Array} Array of mode descriptor objects
 */
export function getPartyModes() {
  return PARTY_MODES.map((m) => ({ ...m }));
}

/**
 * Creates a new party game session.
 * @param {Object} options
 * @param {string} options.hostName - Name of the host player
 * @param {string} options.mode - One of 'round-robin', 'hot-seat', 'team-battle', 'audience'
 * @param {number} options.maxPlayers - Maximum players allowed (4-8)
 * @returns {Object} The created game object
 */
export function createPartyGame({ hostName, mode, maxPlayers }) {
  if (!hostName || typeof hostName !== 'string') {
    throw new Error('hostName is required');
  }

  const modeConfig = PARTY_MODES.find((m) => m.id === mode);
  if (!modeConfig) {
    throw new Error(`Invalid party mode: ${mode}. Available: ${PARTY_MODES.map((m) => m.id).join(', ')}`);
  }

  const clampedMax = Math.min(Math.max(maxPlayers || modeConfig.maxPlayers, 4), modeConfig.maxPlayers);

  const game = {
    id: generateGameCode(),
    hostName,
    mode,
    maxPlayers: clampedMax,
    players: [
      {
        name: hostName,
        avatar: null,
        score: 0,
        isTeamA: mode === 'team-battle' ? true : undefined,
      },
    ],
    rounds: [],
    status: 'waiting',
    currentRound: 0,
    createdAt: new Date().toISOString(),
  };

  persistGame(game);
  return game;
}

/**
 * Adds a player to an existing party game.
 * @param {string} gameId - The 4-char game code
 * @param {string} playerName - Display name for the player
 * @param {string} avatar - Avatar identifier
 * @returns {Object} The updated game object
 */
export function joinPartyGame(gameId, playerName, avatar) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }
  if (game.status !== 'waiting') {
    throw new Error('Game has already started');
  }
  if (game.players.length >= game.maxPlayers) {
    throw new Error(`Game is full (${game.maxPlayers} players max)`);
  }
  if (game.players.some((p) => p.name === playerName)) {
    throw new Error(`Player name "${playerName}" is already taken`);
  }

  const playerIndex = game.players.length;
  const isTeamA = game.mode === 'team-battle' ? playerIndex % 2 === 0 : undefined;

  game.players.push({
    name: playerName,
    avatar: avatar || null,
    score: 0,
    isTeamA,
  });

  persistGame(game);
  return game;
}

/**
 * Returns the full game state for a given game ID.
 * @param {string} gameId - The 4-char game code
 * @returns {Object|null} The game object or null if not found
 */
export function getPartyGame(gameId) {
  const games = loadGames();
  return games[gameId] || null;
}

/**
 * Begins a new round in the party game.
 * @param {string} gameId - The 4-char game code
 * @returns {Object} The updated game object with the new round
 */
export function startPartyRound(gameId) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }
  if (game.players.length < 4) {
    throw new Error('Need at least 4 players to start');
  }
  if (game.status === 'finished') {
    throw new Error('Game has already finished');
  }

  const roundNum = game.rounds.length + 1;

  const round = {
    roundNum,
    concepts: {
      left: null,
      right: null,
    },
    submissions: [],
  };

  game.rounds.push(round);
  game.currentRound = roundNum;
  game.status = 'playing';

  persistGame(game);
  return game;
}

/**
 * Records a player's answer/submission for the current round.
 * @param {string} gameId - The 4-char game code
 * @param {string} playerName - The submitting player's name
 * @param {*} submission - The player's answer/connection
 * @returns {Object} The updated game object
 */
export function submitPartyAnswer(gameId, playerName, submission) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }
  if (game.status !== 'playing') {
    throw new Error('Game is not in playing state');
  }

  const round = game.rounds[game.currentRound - 1];
  if (!round) {
    throw new Error('No active round');
  }

  const player = game.players.find((p) => p.name === playerName);
  if (!player) {
    throw new Error(`Player not found: ${playerName}`);
  }

  const existingIdx = round.submissions.findIndex((s) => s.playerName === playerName);
  if (existingIdx !== -1) {
    // Update existing submission
    round.submissions[existingIdx].submission = submission;
  } else {
    round.submissions.push({
      playerName,
      submission,
      score: 0,
      votes: 0,
    });
  }

  // In audience mode, once all players have submitted, move to voting
  if (game.mode === 'audience' && round.submissions.length === game.players.length) {
    game.status = 'voting';
  }

  persistGame(game);
  return game;
}

/**
 * Returns all submissions for a specific round.
 * @param {string} gameId - The 4-char game code
 * @param {number} roundNum - The round number (1-based)
 * @returns {Array} Array of submission objects for that round
 */
export function getPartyResults(gameId, roundNum) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  const round = game.rounds.find((r) => r.roundNum === roundNum);
  if (!round) {
    throw new Error(`Round ${roundNum} not found`);
  }

  return round.submissions.map((s) => ({ ...s }));
}

/**
 * Casts a vote for the best submission in audience/voting mode (Jackbox-style).
 * @param {string} gameId - The 4-char game code
 * @param {number} roundNum - The round number
 * @param {string} voterName - Name of the person voting
 * @param {string} votedForName - Name of the player being voted for
 * @returns {Object} The updated game object
 */
export function voteForBest(gameId, roundNum, voterName, votedForName) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  const round = game.rounds.find((r) => r.roundNum === roundNum);
  if (!round) {
    throw new Error(`Round ${roundNum} not found`);
  }

  if (voterName === votedForName) {
    throw new Error('Cannot vote for yourself');
  }

  const submission = round.submissions.find((s) => s.playerName === votedForName);
  if (!submission) {
    throw new Error(`No submission found for player: ${votedForName}`);
  }

  // Track who has voted to prevent double-voting
  if (!round._voters) {
    round._voters = {};
  }
  if (round._voters[voterName]) {
    throw new Error(`${voterName} has already voted this round`);
  }

  round._voters[voterName] = votedForName;
  submission.votes += 1;

  // Award points based on votes received
  const votedPlayer = game.players.find((p) => p.name === votedForName);
  if (votedPlayer) {
    votedPlayer.score += 1;
  }

  persistGame(game);
  return game;
}

/**
 * Returns cumulative scores/standings for all players (or teams in team-battle).
 * @param {string} gameId - The 4-char game code
 * @returns {Object} Standings with individual scores and optional team scores
 */
export function getPartyStandings(gameId) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  const players = game.players
    .map((p) => ({
      name: p.name,
      score: p.score,
      avatar: p.avatar,
      isTeamA: p.isTeamA,
    }))
    .sort((a, b) => b.score - a.score);

  const result = { players };

  if (game.mode === 'team-battle') {
    const teamA = game.players.filter((p) => p.isTeamA);
    const teamB = game.players.filter((p) => !p.isTeamA);

    const teamAAvg = teamA.length > 0
      ? teamA.reduce((sum, p) => sum + p.score, 0) / teamA.length
      : 0;
    const teamBAvg = teamB.length > 0
      ? teamB.reduce((sum, p) => sum + p.score, 0) / teamB.length
      : 0;

    result.teams = {
      teamA: {
        members: teamA.map((p) => p.name),
        averageScore: Math.round(teamAAvg * 100) / 100,
      },
      teamB: {
        members: teamB.map((p) => p.name),
        averageScore: Math.round(teamBAvg * 100) / 100,
      },
    };
  }

  return result;
}

/**
 * Advances the game to the between-rounds state so startPartyRound can
 * begin the next round. Does NOT start the next round itself.
 * @param {string} gameId - The 4-char game code
 * @returns {Object} The updated game object
 */
export function advancePartyRound(gameId) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }
  if (game.status === 'finished') {
    throw new Error('Game has already finished');
  }

  // Reset status back to waiting-for-round so startPartyRound can be called.
  game.status = 'waiting';

  persistGame(game);
  return game;
}

/**
 * Ends the party game and returns final standings.
 * @param {string} gameId - The 4-char game code
 * @returns {Object} Final standings with game summary
 */
export function endPartyGame(gameId) {
  const games = loadGames();
  const game = games[gameId];

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  game.status = 'finished';
  persistGame(game);

  const standings = getPartyStandings(gameId);

  return {
    gameId: game.id,
    mode: game.mode,
    totalRounds: game.rounds.length,
    standings,
    finishedAt: new Date().toISOString(),
  };
}

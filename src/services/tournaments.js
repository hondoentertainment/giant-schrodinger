// Tournament system service supporting bracket and Swiss formats
const STORAGE_KEY = 'vwf_tournaments';

/**
 * Retrieves all tournaments from local storage
 * @returns {Array} Array of tournament objects
 */
function loadTournaments() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load tournaments:', error);
    return [];
  }
}

/**
 * Persists tournaments array to local storage
 * @param {Array} tournaments
 */
function saveTournaments(tournaments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  } catch (error) {
    console.warn('Failed to save tournaments:', error);
  }
}

/**
 * Generates a unique tournament ID
 * @returns {string}
 */
function generateId() {
  return 'tourney_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Returns the smallest power of 2 >= n
 * @param {number} n
 * @returns {number}
 */
function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Shuffles an array in place using Fisher-Yates
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Creates a new tournament
 * @param {Object} options
 * @param {string} options.name - Tournament name
 * @param {string} options.format - 'bracket' or 'swiss'
 * @param {number} options.maxPlayers - Maximum number of players
 * @param {string} options.entryType - 'free' or 'premium'
 * @returns {Object} The created tournament
 */
export function createTournament({ name, format, maxPlayers, entryType }) {
  if (!name || !format) {
    throw new Error('Tournament name and format are required');
  }
  if (format !== 'bracket' && format !== 'swiss') {
    throw new Error('Format must be "bracket" or "swiss"');
  }
  if (!entryType || (entryType !== 'free' && entryType !== 'premium')) {
    throw new Error('Entry type must be "free" or "premium"');
  }

  const tournament = {
    id: generateId(),
    name,
    format,
    maxPlayers: maxPlayers || 16,
    entryType: entryType || 'free',
    players: [],
    rounds: [],
    status: 'upcoming',
    startTime: null,
    endTime: null,
    createdAt: new Date().toISOString(),
  };

  const tournaments = loadTournaments();
  tournaments.push(tournament);
  saveTournaments(tournaments);

  return tournament;
}

/**
 * Adds a player to a tournament
 * @param {string} tournamentId
 * @param {string} playerName
 * @param {string} avatar
 * @returns {Object} Updated tournament
 */
export function joinTournament(tournamentId, playerName, avatar) {
  const tournaments = loadTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }
  if (tournament.status !== 'upcoming') {
    throw new Error('Tournament is no longer accepting players');
  }
  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }
  if (tournament.players.some(p => p.name === playerName)) {
    throw new Error('Player already registered');
  }

  tournament.players.push({
    name: playerName,
    avatar: avatar || null,
    seed: tournament.players.length + 1,
  });

  saveTournaments(tournaments);
  return tournament;
}

/**
 * Returns all tournaments with status 'upcoming' or 'active'
 * @returns {Array}
 */
export function getActiveTournaments() {
  const tournaments = loadTournaments();
  return tournaments.filter(t => t.status === 'upcoming' || t.status === 'active');
}

/**
 * Returns the full tournament data for a given ID
 * @param {string} tournamentId
 * @returns {Object|null}
 */
export function getTournament(tournamentId) {
  const tournaments = loadTournaments();
  return tournaments.find(t => t.id === tournamentId) || null;
}

/**
 * Records a score for a player in a specific round
 * @param {string} tournamentId
 * @param {number} roundNum - 1-indexed round number
 * @param {string} playerName
 * @param {number} score
 * @returns {Object} Updated tournament
 */
export function submitTournamentScore(tournamentId, roundNum, playerName, score) {
  const tournaments = loadTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }
  if (tournament.status !== 'active') {
    throw new Error('Tournament is not active');
  }

  const round = tournament.rounds.find(r => r.roundNum === roundNum);
  if (!round) {
    throw new Error(`Round ${roundNum} not found`);
  }

  const matchup = round.matchups.find(
    m => m.player1 === playerName || m.player2 === playerName
  );
  if (!matchup) {
    throw new Error('Player not found in this round');
  }

  if (matchup.player1 === playerName) {
    matchup.score1 = score;
  } else {
    matchup.score2 = score;
  }

  // Determine winner if both scores submitted
  if (matchup.score1 !== null && matchup.score2 !== null) {
    if (matchup.player2 === null) {
      // Bye match
      matchup.winner = matchup.player1;
    } else if (matchup.score1 > matchup.score2) {
      matchup.winner = matchup.player1;
    } else if (matchup.score2 > matchup.score1) {
      matchup.winner = matchup.player2;
    } else {
      // Tie: higher seed (lower seed number) wins
      const p1 = tournament.players.find(p => p.name === matchup.player1);
      const p2 = tournament.players.find(p => p.name === matchup.player2);
      matchup.winner = (p1 && p2 && p1.seed <= p2.seed) ? matchup.player1 : matchup.player2;
    }
  }

  saveTournaments(tournaments);
  return tournament;
}

/**
 * Generates bracket-format matchups for the current round
 * @param {Object} tournament
 * @returns {Array} matchups
 */
function generateBracketRound(tournament) {
  const currentRoundNum = tournament.rounds.length + 1;

  if (currentRoundNum === 1) {
    // First round: random seeding with byes for non-power-of-2
    const shuffled = shuffle(tournament.players);
    const bracketSize = nextPowerOf2(shuffled.length);
    const byeCount = bracketSize - shuffled.length;
    const matchups = [];

    // Assign seeds after shuffle
    shuffled.forEach((p, i) => {
      p.seed = i + 1;
    });

    // Build first round matchups; players beyond the count get byes
    for (let i = 0; i < bracketSize; i += 2) {
      const p1 = shuffled[i] ? shuffled[i].name : null;
      const p2 = shuffled[i + 1] ? shuffled[i + 1].name : null;

      if (p1 && !p2) {
        // Bye: player auto-advances
        matchups.push({
          player1: p1,
          player2: null,
          score1: 0,
          score2: null,
          winner: p1,
        });
      } else if (p1 && p2) {
        matchups.push({
          player1: p1,
          player2: p2,
          score1: null,
          score2: null,
          winner: null,
        });
      }
    }
    return matchups;
  }

  // Subsequent rounds: advance winners from previous round
  const prevRound = tournament.rounds[tournament.rounds.length - 1];
  const winners = prevRound.matchups.map(m => m.winner).filter(Boolean);
  const matchups = [];

  for (let i = 0; i < winners.length; i += 2) {
    const p1 = winners[i] || null;
    const p2 = winners[i + 1] || null;

    if (p1 && !p2) {
      matchups.push({
        player1: p1,
        player2: null,
        score1: 0,
        score2: null,
        winner: p1,
      });
    } else if (p1 && p2) {
      matchups.push({
        player1: p1,
        player2: p2,
        score1: null,
        score2: null,
        winner: null,
      });
    }
  }

  return matchups;
}

/**
 * Computes win-loss records for all players in a Swiss tournament
 * @param {Object} tournament
 * @returns {Object} Map of playerName -> { wins, losses, scoreDiff }
 */
function computeSwissRecords(tournament) {
  const records = {};
  for (const player of tournament.players) {
    records[player.name] = { wins: 0, losses: 0, scoreDiff: 0 };
  }

  for (const round of tournament.rounds) {
    for (const matchup of round.matchups) {
      if (!matchup.winner) continue;

      if (matchup.player2 === null) {
        // Bye: give a win
        if (records[matchup.player1]) {
          records[matchup.player1].wins += 1;
        }
        continue;
      }

      const s1 = matchup.score1 || 0;
      const s2 = matchup.score2 || 0;

      if (records[matchup.player1]) {
        records[matchup.player1].scoreDiff += s1 - s2;
        if (matchup.winner === matchup.player1) {
          records[matchup.player1].wins += 1;
        } else {
          records[matchup.player1].losses += 1;
        }
      }

      if (records[matchup.player2]) {
        records[matchup.player2].scoreDiff += s2 - s1;
        if (matchup.winner === matchup.player2) {
          records[matchup.player2].wins += 1;
        } else {
          records[matchup.player2].losses += 1;
        }
      }
    }
  }

  return records;
}

/**
 * Generates Swiss-format matchups, pairing players with similar records
 * @param {Object} tournament
 * @returns {Array} matchups
 */
function generateSwissRound(tournament) {
  const records = computeSwissRecords(tournament);

  // Collect players who have already been paired together
  const previousPairings = new Set();
  for (const round of tournament.rounds) {
    for (const matchup of round.matchups) {
      if (matchup.player1 && matchup.player2) {
        previousPairings.add(`${matchup.player1}|${matchup.player2}`);
        previousPairings.add(`${matchup.player2}|${matchup.player1}`);
      }
    }
  }

  // Sort players by wins (desc), then score differential (desc)
  const sorted = [...tournament.players].sort((a, b) => {
    const ra = records[a.name];
    const rb = records[b.name];
    if (rb.wins !== ra.wins) return rb.wins - ra.wins;
    return rb.scoreDiff - ra.scoreDiff;
  });

  const paired = new Set();
  const matchups = [];

  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i].name)) continue;

    let matched = false;
    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j].name)) continue;

      const pairKey = `${sorted[i].name}|${sorted[j].name}`;
      // Prefer opponents not previously faced, but allow repeats if necessary
      if (!previousPairings.has(pairKey)) {
        matchups.push({
          player1: sorted[i].name,
          player2: sorted[j].name,
          score1: null,
          score2: null,
          winner: null,
        });
        paired.add(sorted[i].name);
        paired.add(sorted[j].name);
        matched = true;
        break;
      }
    }

    // Fallback: pair with next unpaired player even if they've met before
    if (!matched) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (paired.has(sorted[j].name)) continue;
        matchups.push({
          player1: sorted[i].name,
          player2: sorted[j].name,
          score1: null,
          score2: null,
          winner: null,
        });
        paired.add(sorted[i].name);
        paired.add(sorted[j].name);
        matched = true;
        break;
      }
    }

    // Odd player out gets a bye
    if (!matched && !paired.has(sorted[i].name)) {
      matchups.push({
        player1: sorted[i].name,
        player2: null,
        score1: 0,
        score2: null,
        winner: sorted[i].name,
      });
      paired.add(sorted[i].name);
    }
  }

  return matchups;
}

/**
 * Processes results from the current round and advances to the next round.
 * Starts the tournament if it is in 'upcoming' status.
 * Completes the tournament when all rounds are finished.
 * @param {string} tournamentId
 * @returns {Object} Updated tournament
 */
export function advanceTournamentRound(tournamentId) {
  const tournaments = loadTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }
  if (tournament.status === 'completed') {
    throw new Error('Tournament is already completed');
  }
  if (tournament.players.length < 2) {
    throw new Error('Not enough players to start the tournament');
  }

  // Activate tournament if upcoming
  if (tournament.status === 'upcoming') {
    tournament.status = 'active';
    tournament.startTime = new Date().toISOString();
  }

  // Verify all current round matchups are resolved (if there is a current round)
  if (tournament.rounds.length > 0) {
    const currentRound = tournament.rounds[tournament.rounds.length - 1];
    const unresolved = currentRound.matchups.filter(
      m => m.player2 !== null && m.winner === null
    );
    if (unresolved.length > 0) {
      throw new Error('Current round has unresolved matchups');
    }
  }

  // Check if tournament should be completed
  if (tournament.format === 'bracket') {
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    if (lastRound && lastRound.matchups.length === 1 && lastRound.matchups[0].winner) {
      tournament.status = 'completed';
      tournament.endTime = new Date().toISOString();
      saveTournaments(tournaments);
      return tournament;
    }
  }

  if (tournament.format === 'swiss') {
    const maxRounds = 5;
    if (tournament.rounds.length >= maxRounds) {
      tournament.status = 'completed';
      tournament.endTime = new Date().toISOString();
      saveTournaments(tournaments);
      return tournament;
    }
  }

  // Generate next round
  const matchups =
    tournament.format === 'bracket'
      ? generateBracketRound(tournament)
      : generateSwissRound(tournament);

  const newRound = {
    roundNum: tournament.rounds.length + 1,
    matchups,
  };

  tournament.rounds.push(newRound);

  // For bracket: if there's only one matchup and it's a bye, tournament is done
  if (tournament.format === 'bracket' && matchups.length === 1 && matchups[0].winner) {
    tournament.status = 'completed';
    tournament.endTime = new Date().toISOString();
  }

  saveTournaments(tournaments);
  return tournament;
}

/**
 * Returns current standings for a tournament, sorted by rank
 * Bracket: by round reached / winner status
 * Swiss: by wins (desc), then score differential (desc)
 * @param {string} tournamentId
 * @returns {Array} Sorted standings array
 */
export function getTournamentStandings(tournamentId) {
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.format === 'swiss') {
    const records = computeSwissRecords(tournament);
    return Object.entries(records)
      .map(([name, record]) => ({
        name,
        wins: record.wins,
        losses: record.losses,
        scoreDiff: record.scoreDiff,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.scoreDiff - a.scoreDiff;
      });
  }

  // Bracket: determine elimination round for each player
  const eliminatedIn = {};
  const players = tournament.players.map(p => p.name);

  for (const round of tournament.rounds) {
    for (const matchup of round.matchups) {
      if (matchup.winner && matchup.player2 !== null) {
        const loser =
          matchup.winner === matchup.player1 ? matchup.player2 : matchup.player1;
        if (!eliminatedIn[loser]) {
          eliminatedIn[loser] = round.roundNum;
        }
      }
    }
  }

  // Players not eliminated survived the longest
  const totalRounds = tournament.rounds.length;
  return players
    .map(name => ({
      name,
      eliminatedIn: eliminatedIn[name] || null,
      roundsReached: eliminatedIn[name] ? eliminatedIn[name] : totalRounds + 1,
    }))
    .sort((a, b) => b.roundsReached - a.roundsReached);
}

/**
 * Returns all completed tournaments
 * @returns {Array}
 */
export function getTournamentHistory() {
  const tournaments = loadTournaments();
  return tournaments.filter(t => t.status === 'completed');
}

/**
 * Checks whether the current time falls within the weekend tournament window
 * (Friday 6 PM through Sunday 6 PM, local time)
 * @returns {boolean}
 */
export function isWeekendTournamentActive() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const hour = now.getHours();

  if (day === 5 && hour >= 18) return true; // Friday 6pm+
  if (day === 6) return true; // All Saturday
  if (day === 0 && hour < 18) return true; // Sunday before 6pm
  return false;
}

/**
 * Returns the current weekend tournament, creating one if none exists
 * for the current weekend window.
 * @returns {Object} The weekend tournament
 */
export function getWeekendTournament() {
  const tournaments = loadTournaments();

  // Determine the Friday 6 PM that starts the current (or most recent) weekend window
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Calculate how many days back to the most recent Friday
  let daysToFriday;
  if (day === 5 && hour >= 18) {
    daysToFriday = 0;
  } else if (day === 6) {
    daysToFriday = 1;
  } else if (day === 0 && hour < 18) {
    daysToFriday = 2;
  } else {
    // Not in a weekend window; find the upcoming Friday
    daysToFriday = ((5 - day) + 7) % 7;
    if (daysToFriday === 0) daysToFriday = 7; // Next Friday, not today (before 6pm)
  }

  const weekendStart = new Date(now);
  if (daysToFriday === 0) {
    // It's Friday 6pm+, use today
    weekendStart.setHours(18, 0, 0, 0);
  } else if (day === 6 || (day === 0 && hour < 18)) {
    // Go back to last Friday 6pm
    weekendStart.setDate(now.getDate() - daysToFriday);
    weekendStart.setHours(18, 0, 0, 0);
  } else {
    // Upcoming Friday
    weekendStart.setDate(now.getDate() + daysToFriday);
    weekendStart.setHours(18, 0, 0, 0);
  }

  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendStart.getDate() + 2);
  weekendEnd.setHours(18, 0, 0, 0);

  const windowStart = weekendStart.toISOString();
  const windowEnd = weekendEnd.toISOString();

  // Look for an existing weekend tournament that falls within this window
  const existing = tournaments.find(
    t =>
      t.name &&
      t.name.startsWith('Weekend Tournament') &&
      t.startTime &&
      t.startTime >= windowStart &&
      t.startTime <= windowEnd
  );

  if (existing) return existing;

  // Also match by createdAt for upcoming tournaments that haven't started yet
  const existingByCreated = tournaments.find(
    t =>
      t.name &&
      t.name.startsWith('Weekend Tournament') &&
      t.createdAt >= windowStart &&
      t.createdAt <= windowEnd
  );

  if (existingByCreated) return existingByCreated;

  // Create a new weekend tournament
  const dateStr = weekendStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tournament = {
    id: generateId(),
    name: `Weekend Tournament - ${dateStr}`,
    format: 'bracket',
    maxPlayers: 32,
    entryType: 'free',
    players: [],
    rounds: [],
    status: 'upcoming',
    startTime: windowStart,
    endTime: windowEnd,
    createdAt: new Date().toISOString(),
  };

  tournaments.push(tournament);
  saveTournaments(tournaments);

  return tournament;
}

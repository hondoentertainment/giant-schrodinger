import { describe, it, expect, beforeEach, vi } from 'vitest';

const store = {};
beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
    vi.stubGlobal('localStorage', {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, val) => { store[key] = val; }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    });
});

import {
    createTournament,
    joinTournament,
    advanceTournamentRound,
    getTournamentStandings,
    getTournament,
    submitTournamentScore,
} from './tournaments';

describe('tournaments service', () => {
    function makeTournament(format = 'bracket') {
        return createTournament({ name: 'Test Cup', format, maxPlayers: 8, entryType: 'free' });
    }

    it('creates a tournament with correct defaults', () => {
        const t = makeTournament();
        expect(t.name).toBe('Test Cup');
        expect(t.format).toBe('bracket');
        expect(t.status).toBe('upcoming');
        expect(t.players).toHaveLength(0);
    });

    it('allows players to join and rejects duplicates', () => {
        const t = makeTournament();
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        const updated = getTournament(t.id);
        expect(updated.players).toHaveLength(2);
        expect(() => joinTournament(t.id, 'Alice')).toThrow('Player already registered');
    });

    it('advanceTournamentRound starts the tournament and generates matchups', () => {
        const t = makeTournament();
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        const advanced = advanceTournamentRound(t.id);
        expect(advanced.status).toBe('active');
        expect(advanced.rounds).toHaveLength(1);
        expect(advanced.rounds[0].matchups.length).toBeGreaterThanOrEqual(1);
    });

    it('getTournamentStandings returns standings for swiss format', () => {
        const t = makeTournament('swiss');
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        advanceTournamentRound(t.id);
        const standings = getTournamentStandings(t.id);
        expect(standings).toHaveLength(2);
        expect(standings[0]).toHaveProperty('wins');
        expect(standings[0]).toHaveProperty('losses');
    });

    it('rejects tournament creation with invalid format', () => {
        expect(() =>
            createTournament({ name: 'Bad', format: 'invalid', maxPlayers: 8, entryType: 'free' })
        ).toThrow('Format must be "bracket" or "swiss"');
    });

    it('bracket with odd players assigns byes correctly', () => {
        const t = makeTournament('bracket');
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        joinTournament(t.id, 'Charlie');
        const advanced = advanceTournamentRound(t.id);
        const round = advanced.rounds[0];
        const byeMatchups = round.matchups.filter(m => m.player2 === null);
        // With 3 players, bracket size is 4, so one player gets a bye
        expect(byeMatchups.length).toBe(1);
        expect(byeMatchups[0].winner).toBe(byeMatchups[0].player1);
    });

    it('swiss pairing avoids repeat matchups when possible', () => {
        const t = makeTournament('swiss');
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        joinTournament(t.id, 'Charlie');
        joinTournament(t.id, 'Dave');

        // Round 1
        const r1 = advanceTournamentRound(t.id);
        const round1Pairs = r1.rounds[0].matchups.map(m => [m.player1, m.player2].sort().join('|'));

        // Resolve round 1 matchups by submitting scores
        for (const matchup of r1.rounds[0].matchups) {
            if (matchup.player2 !== null) {
                submitTournamentScore(t.id, 1, matchup.player1, 8);
                submitTournamentScore(t.id, 1, matchup.player2, 6);
            }
        }

        // Round 2
        const r2 = advanceTournamentRound(t.id);
        const round2Pairs = r2.rounds[1].matchups.map(m => [m.player1, m.player2].sort().join('|'));

        // With 4 players, round 2 should have different pairings than round 1
        const overlap = round2Pairs.filter(p => round1Pairs.includes(p));
        expect(overlap.length).toBe(0);
    });

    it('throws when not enough players to start', () => {
        const t = makeTournament();
        joinTournament(t.id, 'Alice');
        expect(() => advanceTournamentRound(t.id)).toThrow('Not enough players');
    });

    it('throws when joining a full tournament', () => {
        const t = createTournament({ name: 'Small', format: 'bracket', maxPlayers: 2, entryType: 'free' });
        joinTournament(t.id, 'Alice');
        joinTournament(t.id, 'Bob');
        expect(() => joinTournament(t.id, 'Charlie')).toThrow('Tournament is full');
    });
});

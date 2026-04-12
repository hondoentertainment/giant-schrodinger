import { describe, it, expect, beforeEach } from 'vitest';

import {
    getPartyModes,
    createPartyGame,
    joinPartyGame,
    getPartyGame,
    startPartyRound,
    submitPartyAnswer,
    getPartyResults,
    voteForBest,
    getPartyStandings,
    advancePartyRound,
    endPartyGame,
} from './partyMode';

describe('partyMode service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getPartyModes', () => {
        it('returns an array of mode descriptors with required fields', () => {
            const modes = getPartyModes();
            expect(Array.isArray(modes)).toBe(true);
            expect(modes.length).toBeGreaterThan(0);
            modes.forEach((m) => {
                expect(m).toHaveProperty('id');
                expect(m).toHaveProperty('name');
                expect(m).toHaveProperty('minPlayers');
                expect(m).toHaveProperty('maxPlayers');
            });
        });

        it('returns fresh copies so callers cannot mutate internal state', () => {
            const first = getPartyModes();
            first[0].name = 'MUTATED';
            const second = getPartyModes();
            expect(second[0].name).not.toBe('MUTATED');
        });
    });

    describe('createPartyGame', () => {
        it('creates a game with the host as the first player', () => {
            const game = createPartyGame({ hostName: 'Alice', mode: 'round-robin', maxPlayers: 6 });
            expect(game.id).toMatch(/^[A-Z2-9]{4}$/);
            expect(game.hostName).toBe('Alice');
            expect(game.mode).toBe('round-robin');
            expect(game.status).toBe('waiting');
            expect(game.players).toHaveLength(1);
            expect(game.players[0].name).toBe('Alice');
        });

        it('assigns host to team A in team-battle mode', () => {
            const game = createPartyGame({ hostName: 'Host', mode: 'team-battle', maxPlayers: 4 });
            expect(game.players[0].isTeamA).toBe(true);
        });

        it('clamps maxPlayers to the mode maximum', () => {
            const game = createPartyGame({ hostName: 'H', mode: 'team-battle', maxPlayers: 999 });
            expect(game.maxPlayers).toBeLessThanOrEqual(6);
        });

        it('throws when hostName is missing', () => {
            expect(() => createPartyGame({ hostName: '', mode: 'round-robin', maxPlayers: 4 })).toThrow();
        });

        it('throws on unknown mode', () => {
            expect(() => createPartyGame({ hostName: 'Alice', mode: 'nope', maxPlayers: 4 })).toThrow(/Invalid party mode/);
        });

        it('persists the game so getPartyGame returns it', () => {
            const game = createPartyGame({ hostName: 'Alice', mode: 'round-robin', maxPlayers: 4 });
            const fetched = getPartyGame(game.id);
            expect(fetched).not.toBeNull();
            expect(fetched.id).toBe(game.id);
        });
    });

    describe('joinPartyGame', () => {
        it('adds a new player to the roster', () => {
            const game = createPartyGame({ hostName: 'Alice', mode: 'round-robin', maxPlayers: 6 });
            const updated = joinPartyGame(game.id, 'Bob', 'avatar-1');
            expect(updated.players).toHaveLength(2);
            expect(updated.players[1]).toMatchObject({ name: 'Bob', avatar: 'avatar-1', score: 0 });
        });

        it('alternates team assignment in team-battle', () => {
            const game = createPartyGame({ hostName: 'P0', mode: 'team-battle', maxPlayers: 6 });
            joinPartyGame(game.id, 'P1');
            const after2 = joinPartyGame(game.id, 'P2');
            // host (0) -> true; P1 (idx 1) -> false; P2 (idx 2) -> true
            expect(after2.players.map((p) => p.isTeamA)).toEqual([true, false, true]);
        });

        it('throws when gameId not found', () => {
            expect(() => joinPartyGame('NONE', 'Bob')).toThrow(/Game not found/);
        });

        it('throws on duplicate player name', () => {
            const game = createPartyGame({ hostName: 'Alice', mode: 'round-robin', maxPlayers: 4 });
            expect(() => joinPartyGame(game.id, 'Alice')).toThrow(/already taken/);
        });

        it('throws when the game is full', () => {
            const game = createPartyGame({ hostName: 'Host', mode: 'team-battle', maxPlayers: 4 });
            joinPartyGame(game.id, 'P1');
            joinPartyGame(game.id, 'P2');
            joinPartyGame(game.id, 'P3');
            expect(() => joinPartyGame(game.id, 'P4')).toThrow(/full/);
        });
    });

    describe('getPartyGame', () => {
        it('returns null for unknown ids', () => {
            expect(getPartyGame('XXXX')).toBeNull();
        });
    });

    describe('startPartyRound', () => {
        it('throws when fewer than 4 players', () => {
            const game = createPartyGame({ hostName: 'Alice', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'Bob');
            expect(() => startPartyRound(game.id)).toThrow(/at least 4 players/);
        });

        it('creates a round and sets status to playing with 4+ players', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            const updated = startPartyRound(game.id);
            expect(updated.status).toBe('playing');
            expect(updated.rounds).toHaveLength(1);
            expect(updated.currentRound).toBe(1);
        });
    });

    describe('submitPartyAnswer', () => {
        function bootstrap(mode = 'round-robin') {
            const game = createPartyGame({ hostName: 'A', mode, maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            return game.id;
        }

        it('records a new submission', () => {
            const id = bootstrap();
            const updated = submitPartyAnswer(id, 'A', 'my answer');
            const round = updated.rounds[0];
            expect(round.submissions).toHaveLength(1);
            expect(round.submissions[0]).toMatchObject({ playerName: 'A', submission: 'my answer' });
        });

        it('updates an existing submission rather than duplicating', () => {
            const id = bootstrap();
            submitPartyAnswer(id, 'A', 'first');
            const updated = submitPartyAnswer(id, 'A', 'second');
            expect(updated.rounds[0].submissions).toHaveLength(1);
            expect(updated.rounds[0].submissions[0].submission).toBe('second');
        });

        it('transitions to voting in audience mode when everyone submits', () => {
            const id = bootstrap('audience');
            submitPartyAnswer(id, 'A', 'a');
            submitPartyAnswer(id, 'B', 'b');
            submitPartyAnswer(id, 'C', 'c');
            const updated = submitPartyAnswer(id, 'D', 'd');
            expect(updated.status).toBe('voting');
        });

        it('throws for unknown player', () => {
            const id = bootstrap();
            expect(() => submitPartyAnswer(id, 'Zed', 'x')).toThrow(/Player not found/);
        });
    });

    describe('getPartyResults', () => {
        it('returns submissions for the given round', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            submitPartyAnswer(game.id, 'A', 'answer');
            const results = getPartyResults(game.id, 1);
            expect(results).toHaveLength(1);
            expect(results[0].playerName).toBe('A');
        });

        it('throws for unknown round number', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            expect(() => getPartyResults(game.id, 99)).toThrow(/not found/);
        });
    });

    describe('voteForBest', () => {
        function bootstrapAudience() {
            const game = createPartyGame({ hostName: 'A', mode: 'audience', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            submitPartyAnswer(game.id, 'A', 'aa');
            submitPartyAnswer(game.id, 'B', 'bb');
            submitPartyAnswer(game.id, 'C', 'cc');
            submitPartyAnswer(game.id, 'D', 'dd');
            return game.id;
        }

        it('increments votes and awards a point to the voted player', () => {
            const id = bootstrapAudience();
            const updated = voteForBest(id, 1, 'A', 'B');
            const bSubmission = updated.rounds[0].submissions.find((s) => s.playerName === 'B');
            const bPlayer = updated.players.find((p) => p.name === 'B');
            expect(bSubmission.votes).toBe(1);
            expect(bPlayer.score).toBe(1);
        });

        it('prevents self-voting', () => {
            const id = bootstrapAudience();
            expect(() => voteForBest(id, 1, 'A', 'A')).toThrow(/vote for yourself/);
        });

        it('prevents double voting by the same voter', () => {
            const id = bootstrapAudience();
            voteForBest(id, 1, 'A', 'B');
            expect(() => voteForBest(id, 1, 'A', 'C')).toThrow(/already voted/);
        });

        it('throws for unknown voted player', () => {
            const id = bootstrapAudience();
            expect(() => voteForBest(id, 1, 'A', 'Nobody')).toThrow(/No submission found/);
        });
    });

    describe('getPartyStandings', () => {
        it('returns players sorted by score descending', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            const state = getPartyGame(game.id);
            state.players[1].score = 10;
            state.players[2].score = 5;
            localStorage.setItem('vwf_party_games', JSON.stringify({ [game.id]: state }));

            const standings = getPartyStandings(game.id);
            expect(standings.players[0].name).toBe('B');
            expect(standings.players[1].name).toBe('C');
        });

        it('computes team averages in team-battle mode', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'team-battle', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            const state = getPartyGame(game.id);
            // Team A: A (idx 0), C (idx 2); Team B: B (idx 1), D (idx 3)
            state.players[0].score = 10;
            state.players[2].score = 4;
            state.players[1].score = 6;
            state.players[3].score = 8;
            localStorage.setItem('vwf_party_games', JSON.stringify({ [game.id]: state }));

            const standings = getPartyStandings(game.id);
            expect(standings.teams).toBeDefined();
            expect(standings.teams.teamA.averageScore).toBe(7); // (10+4)/2
            expect(standings.teams.teamB.averageScore).toBe(7); // (6+8)/2
        });
    });

    describe('advancePartyRound / endPartyGame', () => {
        it('advancePartyRound restores playing status', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'audience', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            const updated = advancePartyRound(game.id);
            expect(updated.status).toBe('playing');
        });

        it('endPartyGame returns final standings with finished status', () => {
            const game = createPartyGame({ hostName: 'A', mode: 'round-robin', maxPlayers: 4 });
            joinPartyGame(game.id, 'B');
            joinPartyGame(game.id, 'C');
            joinPartyGame(game.id, 'D');
            startPartyRound(game.id);
            const summary = endPartyGame(game.id);
            expect(summary.gameId).toBe(game.id);
            expect(summary.mode).toBe('round-robin');
            expect(summary.standings).toBeDefined();
            expect(summary.finishedAt).toBeDefined();
            expect(getPartyGame(game.id).status).toBe('finished');
        });
    });
});

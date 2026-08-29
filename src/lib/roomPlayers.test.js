import { describe, expect, it } from 'vitest';
import { getActivePlayers, getSpectatorPlayers, isSpectatorPlayer } from './roomPlayers';

describe('roomPlayers', () => {
    const players = [
        { id: '1', player_name: 'Host', is_host: true },
        { id: '2', player_name: 'Ava' },
        { id: '3', player_name: 'Cam', is_spectator: true },
        { id: '4', player_name: 'Drew', role: 'spectator' },
    ];

    it('treats is_spectator and role as watch-only', () => {
        expect(isSpectatorPlayer(players[0])).toBe(false);
        expect(isSpectatorPlayer(players[2])).toBe(true);
        expect(isSpectatorPlayer(players[3])).toBe(true);
    });

    it('keeps only people who can write and vote', () => {
        expect(getActivePlayers(players).map((player) => player.player_name)).toEqual(['Host', 'Ava']);
        expect(getSpectatorPlayers(players).map((player) => player.player_name)).toEqual(['Cam', 'Drew']);
    });
});

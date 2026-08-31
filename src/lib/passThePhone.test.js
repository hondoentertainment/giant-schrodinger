import { describe, expect, it } from 'vitest';
import { canWriteOnThisDevice, getCurrentWriter, PASS_PHONE_DRUMROLL_MS, PASS_PHONE_SECONDS, PASS_PHONE_STARE_MS } from './passThePhone';

describe('passThePhone', () => {
    const players = [
        { id: '1', player_name: 'Alex' },
        { id: '2', player_name: 'Blair' },
    ];

    it('uses a 30-second turn', () => {
        expect(PASS_PHONE_SECONDS).toBe(30);
        expect(PASS_PHONE_STARE_MS).toBe(3000);
        expect(PASS_PHONE_DRUMROLL_MS).toBe(1800);
    });

    it('picks the first writer without a submission', () => {
        expect(getCurrentWriter(players, [{ player_name: 'Alex' }])?.player_name).toBe('Blair');
        expect(getCurrentWriter(players, [])?.player_name).toBe('Alex');
        expect(getCurrentWriter(players, [{ player_name: 'Alex' }, { player_name: 'Blair' }])).toBeNull();
    });

    it('lets the host device write for a couch session', () => {
        expect(canWriteOnThisDevice({
            passThePhone: true,
            currentWriter: { player_name: 'Blair' },
            playerName: 'Alex',
            couchSessions: [{ playerName: 'Blair' }],
        })).toBe(true);
        expect(canWriteOnThisDevice({
            passThePhone: true,
            currentWriter: { player_name: 'Blair' },
            playerName: 'Alex',
            couchSessions: [],
        })).toBe(false);
        expect(canWriteOnThisDevice({ passThePhone: false })).toBe(true);
    });
});

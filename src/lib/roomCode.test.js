import { describe, expect, it } from 'vitest';
import { extractRoomCode } from './roomCode';

describe('extractRoomCode', () => {
    it('uppercases and trims a typed code', () => {
        expect(extractRoomCode(' ab12 ')).toBe('AB12');
    });

    it('pulls a code from a join URL', () => {
        expect(extractRoomCode('https://giant-schrodinger.vercel.app/?join=WATCH1')).toBe('WATCH1');
    });

    it('strips punctuation and caps at 6 characters', () => {
        expect(extractRoomCode('ab-cd-efgh')).toBe('ABCDEF');
    });

    it('returns empty for blank input', () => {
        expect(extractRoomCode('')).toBe('');
        expect(extractRoomCode(null)).toBe('');
    });
});

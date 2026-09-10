import { describe, expect, it } from 'vitest';
import { extractRoomCode, normalizeJoinInput } from './roomCode';

describe('extractRoomCode', () => {
    it('uppercases and trims a typed code', () => {
        expect(extractRoomCode(' ab12 ')).toBe('AB12');
    });

    it('pulls a code from a join URL', () => {
        expect(extractRoomCode('https://giant-schrodinger.vercel.app/?join=WATCH1')).toBe('WATCH1');
        expect(extractRoomCode('https://giant-schrodinger.vercel.app/?join=ABCD')).toBe('ABCD');
    });

    it('does not treat a URL host as a room code', () => {
        expect(extractRoomCode('https://giant-schrodinger.vercel.app/')).toBe('');
        expect(extractRoomCode('https://giant')).toBe('');
    });

    it('strips punctuation and caps at 6 characters', () => {
        expect(extractRoomCode('ab-cd-efgh')).toBe('ABCDEF');
    });

    it('returns empty for blank input', () => {
        expect(extractRoomCode('')).toBe('');
        expect(extractRoomCode(null)).toBe('');
    });
});

describe('normalizeJoinInput', () => {
    it('snaps a pasted invite URL to the room code', () => {
        expect(normalizeJoinInput('https://giant-schrodinger.vercel.app/?join=ABCD')).toBe('ABCD');
    });

    it('keeps an in-progress URL so later join= characters are not lost', () => {
        expect(normalizeJoinInput('https://giant-schrodinger.vercel.app/?jo')).toBe(
            'https://giant-schrodinger.vercel.app/?jo',
        );
    });

    it('still sanitizes a typed code', () => {
        expect(normalizeJoinInput('ab12')).toBe('AB12');
    });
});

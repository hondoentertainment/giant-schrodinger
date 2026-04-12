import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createChallenge,
    getChallenge,
    resolveChallenge,
    getChallengeHistory,
    createChallengeUrl,
    parseChallengeUrl,
    clearChallengeFromUrl,
    getStreakBonus,
} from './challenges';

describe('challenges service', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '';
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('createChallenge', () => {
        it('creates a challenge and stores it in localStorage', () => {
            const c = createChallenge({
                assets: { left: { label: 'A' }, right: { label: 'B' } },
                submission: 'link',
                score: 7,
                playerName: 'Alice',
                themeId: 't1',
            });
            expect(c).not.toBeNull();
            expect(c.id).toBeTruthy();
            expect(c.status).toBe('pending');
            expect(c.challengerResult).toBeNull();
            expect(c.playerName).toBe('Alice');

            const stored = JSON.parse(localStorage.getItem('vwf_challenges'));
            expect(stored).toHaveLength(1);
            expect(stored[0].id).toBe(c.id);
        });

        it('defaults playerName and themeId when missing', () => {
            const c = createChallenge({ assets: {}, submission: 's', score: 5 });
            expect(c.playerName).toBe('Anonymous');
            expect(c.themeId).toBe('default');
        });
    });

    describe('getChallenge', () => {
        it('retrieves a stored challenge by id', () => {
            const c = createChallenge({ submission: 's', score: 5 });
            expect(getChallenge(c.id)).toMatchObject({ id: c.id });
        });

        it('returns null for unknown id', () => {
            expect(getChallenge('nope')).toBeNull();
        });
    });

    describe('resolveChallenge', () => {
        it('sets winner when challenger scores higher', () => {
            const c = createChallenge({ submission: 's', score: 5, playerName: 'Alice' });
            const resolved = resolveChallenge(c.id, { score: 9, playerName: 'Bob', submission: 'x' });
            expect(resolved.status).toBe('resolved');
            expect(resolved.winner).toBe('Bob');
            expect(resolved.challengerResult.score).toBe(9);
        });

        it('sets winner when original score wins', () => {
            const c = createChallenge({ submission: 's', score: 9, playerName: 'Alice' });
            const resolved = resolveChallenge(c.id, { score: 3, playerName: 'Bob' });
            expect(resolved.winner).toBe('Alice');
        });

        it('returns tie on equal scores', () => {
            const c = createChallenge({ submission: 's', score: 5, playerName: 'Alice' });
            const resolved = resolveChallenge(c.id, { score: 5, playerName: 'Bob' });
            expect(resolved.winner).toBe('tie');
        });

        it('returns null for non-existent challenge', () => {
            expect(resolveChallenge('missing', { score: 1 })).toBeNull();
        });
    });

    describe('getChallengeHistory', () => {
        it('returns all stored challenges in unshift order (newest first)', () => {
            const a = createChallenge({ submission: 'a', score: 5 });
            const b = createChallenge({ submission: 'b', score: 6 });
            const history = getChallengeHistory();
            expect(history.map((c) => c.id)).toEqual([b.id, a.id]);
        });

        it('returns empty array when nothing stored', () => {
            expect(getChallengeHistory()).toEqual([]);
        });
    });

    describe('createChallengeUrl / parseChallengeUrl', () => {
        it('roundtrips a challenge through the URL hash', () => {
            const challenge = {
                id: 'abc',
                assets: { left: { label: 'L' }, right: { label: 'R' } },
                score: 8,
                playerName: 'Tester',
                themeId: 'art',
            };
            const url = createChallengeUrl(challenge);
            expect(url).toContain('#challenge=');
            window.location.hash = url.slice(url.indexOf('#'));
            const parsed = parseChallengeUrl();
            expect(parsed).toEqual(challenge);
        });

        it('returns null for no challenge in hash', () => {
            window.location.hash = '';
            expect(parseChallengeUrl()).toBeNull();
        });

        it('returns null on malformed base64', () => {
            window.location.hash = '#challenge=***not-base64***';
            expect(parseChallengeUrl()).toBeNull();
        });

        it('returns null when challenge field is circular', () => {
            const circular = { id: 'x' };
            circular.assets = circular; // picked field, so JSON.stringify throws
            expect(createChallengeUrl(circular)).toBeNull();
        });
    });

    describe('clearChallengeFromUrl', () => {
        it('calls history.replaceState', () => {
            const spy = vi.fn();
            const orig = window.history.replaceState;
            window.history.replaceState = spy;
            try {
                clearChallengeFromUrl();
                expect(spy).toHaveBeenCalled();
            } finally {
                window.history.replaceState = orig;
            }
        });
    });

    describe('getStreakBonus', () => {
        it('returns 1.0 for no streak / missing stats', () => {
            expect(getStreakBonus(null)).toBe(1.0);
            expect(getStreakBonus({})).toBe(1.0);
            expect(getStreakBonus({ currentStreak: 0 })).toBe(1.0);
        });

        it('adds 10% per streak day', () => {
            expect(getStreakBonus({ currentStreak: 3 })).toBeCloseTo(1.3);
        });

        it('caps at 1.5 (5 days)', () => {
            expect(getStreakBonus({ currentStreak: 99 })).toBeCloseTo(1.5);
        });

        it('treats negative streak as zero', () => {
            expect(getStreakBonus({ currentStreak: -5 })).toBe(1.0);
        });
    });
});

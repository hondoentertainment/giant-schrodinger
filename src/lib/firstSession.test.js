import { afterEach, describe, expect, it } from 'vitest';
import {
    consumeAutostartDaily,
    hasCelebratedFirstSession,
    markAutostartDaily,
    markFirstSessionCelebrated,
    peekAutostartDaily,
    shouldCelebrateFirstSession,
} from './firstSession';

describe('firstSession autostart', () => {
    afterEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it('marks and consumes the daily autostart once', () => {
        expect(consumeAutostartDaily()).toBe(false);
        expect(markAutostartDaily()).toBe(true);
        expect(peekAutostartDaily()).toBe(true);
        expect(consumeAutostartDaily()).toBe(true);
        expect(consumeAutostartDaily()).toBe(false);
    });

    it('celebrates the first completed session only once', () => {
        expect(shouldCelebrateFirstSession({ totalRoundsPlayed: 3, sessionRoundCount: 3 })).toBe(true);
        expect(shouldCelebrateFirstSession({ totalRoundsPlayed: 20, sessionRoundCount: 3 })).toBe(false);
        markFirstSessionCelebrated();
        expect(hasCelebratedFirstSession()).toBe(true);
        expect(shouldCelebrateFirstSession({ totalRoundsPlayed: 3, sessionRoundCount: 3 })).toBe(false);
    });
});

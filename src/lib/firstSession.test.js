import { afterEach, describe, expect, it } from 'vitest';
import { consumeAutostartDaily, markAutostartDaily, peekAutostartDaily } from './firstSession';

describe('firstSession autostart', () => {
    afterEach(() => {
        sessionStorage.clear();
    });

    it('marks and consumes the daily autostart once', () => {
        expect(consumeAutostartDaily()).toBe(false);
        expect(markAutostartDaily()).toBe(true);
        expect(peekAutostartDaily()).toBe(true);
        expect(consumeAutostartDaily()).toBe(true);
        expect(consumeAutostartDaily()).toBe(false);
    });
});

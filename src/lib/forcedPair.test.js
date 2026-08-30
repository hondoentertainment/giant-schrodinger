import { afterEach, describe, expect, it } from 'vitest';
import { consumeForcedLine, consumeJudgeChain, markJudgeChain, peekJudgeChain, setForcedLine } from './forcedPair';

describe('forcedPair extras', () => {
    afterEach(() => {
        sessionStorage.clear();
    });

    it('stores a second-chance line', () => {
        setForcedLine('  cold brew firmware  ');
        expect(consumeForcedLine()).toBe('cold brew firmware');
        expect(consumeForcedLine()).toBe('');
    });

    it('tracks a friend-judge chain', () => {
        expect(peekJudgeChain()).toBe(false);
        markJudgeChain();
        expect(peekJudgeChain()).toBe(true);
        expect(consumeJudgeChain()).toBe(true);
        expect(peekJudgeChain()).toBe(false);
    });
});

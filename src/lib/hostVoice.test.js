import { describe, expect, it } from 'vitest';
import { hostCommentary, hostRewrite } from './hostVoice';

describe('hostVoice', () => {
    it('toasts a high score with both prompts', () => {
        const line = hostCommentary({
            submission: 'cold brew firmware',
            leftLabel: 'Coffee',
            rightLabel: 'Robot',
            score: 9,
        });
        expect(line).toMatch(/cold brew firmware/i);
        expect(line).toMatch(/Coffee/);
        expect(line).toMatch(/Robot/);
        expect(line).toMatch(/toast/i);
    });

    it('rewrites their actual line', () => {
        expect(hostRewrite('they both wait', 'A lighthouse', 'An inbox', 'logic'))
            .toMatch(/they both wait/i);
    });
});

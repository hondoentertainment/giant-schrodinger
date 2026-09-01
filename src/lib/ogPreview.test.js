import { describe, expect, it } from 'vitest';
import { buildOgRoundDescription, buildOgRoundTitle, getDefaultOgImage } from './ogPreview';

describe('ogPreview', () => {
    it('builds a Beat-this card from the pair, line, and score', () => {
        expect(buildOgRoundTitle({
            submission: 'cold brew firmware',
            score: 9,
            left: 'Coffee',
            right: 'Robot',
        })).toBe('I scored 9/10 connecting Coffee and Robot!');
        expect(buildOgRoundDescription({
            submission: 'cold brew firmware',
            score: 9,
            left: 'Coffee',
            right: 'Robot',
            judge: 'friend',
        })).toBe('Connection: "cold brew firmware" · Prompts: Coffee × Robot · Score: 9/10 · Judged via friend · Beat this.');
    });

    it('defaults the preview image to the Vercel PNG', () => {
        expect(getDefaultOgImage()).toBe('https://giant-schrodinger.vercel.app/og-image.png');
    });
});

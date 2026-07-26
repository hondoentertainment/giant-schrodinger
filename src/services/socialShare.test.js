import { describe, it, expect } from 'vitest';
import { createShareText, getAssetDisplayName, resolveSharePageUrl } from './socialShare';

describe('socialShare', () => {
    it('prefers label when building asset display names', () => {
        expect(getAssetDisplayName({ label: 'Cat', title: 'Ignored' })).toBe('Cat');
        expect(getAssetDisplayName({ title: 'Fallback Title' })).toBe('Fallback Title');
    });

    it('creates punchy share text with score and asset names', () => {
        const text = createShareText({
            submission: 'midnight karaoke for robots',
            score: 9,
            scoreBand: 'Wild Card',
            commentary: 'This should not work, but it really does.',
            assets: {
                left: { label: 'Disco Ball' },
                right: { label: 'Android' },
            },
        });

        expect(text).toContain('Disco Ball');
        expect(text).toContain('Android');
        expect(text).toContain('9/10');
        expect(text).toContain('#');
    });

    it('includes meme and video labels in share text', () => {
        const text = createShareText({
            submission: 'internet chaos',
            score: 7,
            assets: {
                left: { label: 'Distracted Boyfriend', type: 'meme' },
                right: { label: 'Cat Video', type: 'video' },
            },
        });

        expect(text).toContain('Distracted Boyfriend (Meme)');
        expect(text).toContain('Cat Video (Video)');
    });

    it('includes judge and daily challenge context when provided', () => {
        const text = createShareText({
            submission: 'cosmic breakfast club',
            score: 8,
            judgeMode: 'friend',
            isDailyChallenge: true,
            friendScore: 9,
            assets: {
                left: { label: 'Comet' },
                right: { label: 'Pancake' },
            },
        });

        expect(text).toContain('Friend Judge');
        expect(text).toContain('Daily Challenge');
        expect(text).toContain('Friend score 9/10');
    });

    it('prefers previewUrl for social link targets', () => {
        expect(resolveSharePageUrl({
            previewUrl: 'https://proj.supabase.co/functions/v1/og-tags?roundId=abc',
            pageUrl: 'https://app.example/?judge=abc',
        })).toBe('https://proj.supabase.co/functions/v1/og-tags?roundId=abc');
    });
});

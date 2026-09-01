import { describe, it, expect } from 'vitest';
import { buildDailyRitualShareText, getDailyRitualShareCard } from './dailyRitualShare';

describe('buildDailyRitualShareText', () => {
    it('formats a Wordle-style daily card', () => {
        const text = buildDailyRitualShareText({
            date: 'Aug 22',
            left: 'Morning coffee',
            right: 'A robot hitting snooze',
            submission: 'Both need a jolt to start the day',
            score: 8,
            origin: 'https://example.com',
        });
        expect(text).toContain('Venn Daily — Aug 22');
        expect(text).toContain('Morning coffee × A robot hitting snooze');
        expect(text).toContain('Both need a jolt to start the day');
        expect(text).toContain('8/10');
        expect(text).toContain('Beat this.');
        expect(text).toContain('https://example.com');
    });
});

describe('getDailyRitualShareCard', () => {
    it('includes fusion image and share payload for today\'s collision', async () => {
        const { getDailyRitualShareCard: loadCard } = await import('./dailyRitualShare');
        const card = loadCard({
            origin: 'https://example.com',
            collisions: [{
                isDailyChallenge: true,
                timestamp: '2099-01-01T12:00:00.000Z',
                submission: 'Both need a jolt',
                imageUrl: 'https://example.com/fusion.png',
                judgeMode: 'ai',
                assets: {
                    left: { label: 'Coffee' },
                    right: { label: 'Robot' },
                },
            }],
        });
        expect(card.text).toContain('Venn Daily');
        expect(card.imageUrl).toBe('https://example.com/fusion.png');
        expect(card.shareData.isDailyChallenge).toBe(true);
        expect(card.shareData.assets.left.label).toBeTruthy();
    });
});

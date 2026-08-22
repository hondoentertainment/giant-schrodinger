import { describe, it, expect } from 'vitest';
import { buildDailyRitualShareText } from './dailyRitualShare';

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
        expect(text).toContain('https://example.com');
    });
});

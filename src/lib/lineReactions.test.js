import { describe, expect, it } from 'vitest';
import { countReactions, getMostReactedEntry, reactionsForEntry } from './lineReactions';

describe('lineReactions', () => {
    const submissions = [
        { id: 'a', player_name: 'Alex', submission: 'alpha' },
        { id: 'b', player_name: 'Blair', submission: 'beta' },
    ];
    const reactions = [
        { emoji: '🔥', entryId: 'b' },
        { emoji: '😂', entryId: 'b' },
        { emoji: '🔥', entryId: 'a' },
    ];

    it('counts emojis on one line', () => {
        expect(countReactions(reactionsForEntry(reactions, submissions[1]))).toEqual({
            '🔥': 1,
            '😂': 1,
            '💀': 0,
            '👑': 0,
        });
    });

    it('picks the most-reacted line', () => {
        const most = getMostReactedEntry(submissions, reactions);
        expect(most.entry.submission).toBe('beta');
        expect(most.count).toBe(2);
    });
});

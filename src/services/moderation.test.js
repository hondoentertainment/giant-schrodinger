import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: () => false,
    supabase: {
        rpc: vi.fn(),
    },
}));

import { flagContent, getFlags, getFlaggedCount, removeFlag, clearFlag } from './moderation';

describe('moderation service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('flagContent', () => {
        it('stores a flag entry with reason and timestamp', async () => {
            await flagContent('c1', 'spam');
            const stored = JSON.parse(localStorage.getItem('venn_content_flags'));
            expect(stored).toHaveLength(1);
            expect(stored[0].contentId).toBe('c1');
            expect(stored[0].reason).toBe('spam');
            expect(typeof stored[0].flaggedAt).toBe('number');
        });

        it('appends multiple flags to the same store', async () => {
            await flagContent('c1', 'spam');
            await flagContent('c2', 'offensive');
            expect(getFlags()).toHaveLength(2);
        });
    });

    describe('getFlags', () => {
        it('returns an empty array when nothing stored', () => {
            expect(getFlags()).toEqual([]);
        });

        it('returns an empty array on malformed JSON', () => {
            localStorage.setItem('venn_content_flags', '{not-json');
            expect(getFlags()).toEqual([]);
        });
    });

    describe('getFlaggedCount', () => {
        it('returns the number of flags', async () => {
            expect(getFlaggedCount()).toBe(0);
            await flagContent('c1', 'a');
            await flagContent('c2', 'b');
            expect(getFlaggedCount()).toBe(2);
        });
    });

    describe('removeFlag / clearFlag', () => {
        it('removeFlag removes entries matching contentId', async () => {
            await flagContent('c1', 'a');
            await flagContent('c2', 'b');
            removeFlag('c1');
            const remaining = getFlags();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].contentId).toBe('c2');
        });

        it('clearFlag is an alias for removeFlag', async () => {
            await flagContent('c1', 'a');
            clearFlag('c1');
            expect(getFlags()).toHaveLength(0);
        });

        it('is a no-op when contentId not found', async () => {
            await flagContent('c1', 'a');
            removeFlag('ghost');
            expect(getFlags()).toHaveLength(1);
        });
    });
});

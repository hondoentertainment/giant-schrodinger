import { describe, expect, it } from 'vitest';
import { buildRoomRecapShareData } from './roomRecap';

describe('buildRoomRecapShareData', () => {
    it('builds a Beat-this card from the winning line', () => {
        const shareData = buildRoomRecapShareData({
            room: { scoring_mode: 'ai' },
            assets: { left: { label: 'Coffee' }, right: { label: 'Robot' } },
            submissions: [
                { player_name: 'Alex', submission: 'cold brew firmware', finalScore: 6 },
                { player_name: 'Blair', submission: 'snooze protocol', finalScore: 9 },
            ],
        });

        expect(shareData.submission).toBe('snooze protocol');
        expect(shareData.score).toBe(9);
        expect(shareData.scoreBand).toBe('Blair wins');
        expect(shareData.mediaLabel).toBe('Room recap');
    });

    it('prefers the most-reacted line for the group-chat card', () => {
        const shareData = buildRoomRecapShareData({
            submissions: [
                { id: 'a', player_name: 'Alex', submission: 'quiet one', finalScore: 9 },
                { id: 'b', player_name: 'Blair', submission: 'the roar', finalScore: 6 },
            ],
            assets: { left: { label: 'Coffee' }, right: { label: 'Robot' } },
            reactions: [
                { emoji: '🔥', entryId: 'b' },
                { emoji: '😂', entryId: 'b' },
                { emoji: '💀', entryId: 'b' },
            ],
        });
        expect(shareData.submission).toBe('the roar');
        expect(shareData.scoreBand).toBe('Blair won the room');
        expect(shareData.mediaLabel).toBe('Most reacted');
        expect(shareData.promptPair).toBe('Coffee × Robot');
    });
});

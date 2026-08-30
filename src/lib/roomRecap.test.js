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
        expect(shareData.promptPair).toBe('Coffee × Robot');
    });
});

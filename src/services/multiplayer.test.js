import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    order: vi.fn(),
    eqRound: vi.fn(),
    eqRoom: vi.fn(),
    select: vi.fn(),
    from: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn(),
    removeChannel: vi.fn(),
    channelFactory: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
    supabase: {
        from: mocks.from,
        channel: mocks.channelFactory,
        removeChannel: mocks.removeChannel,
    },
    isBackendEnabled: () => true,
}));

import { getRoundVotes, subscribeToRoom } from './multiplayer';

describe('multiplayer service', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.order.mockResolvedValue({ data: [{ id: 'vote-1' }], error: null });
        mocks.eqRound.mockReturnValue({ order: mocks.order });
        mocks.eqRoom.mockReturnValue({ eq: mocks.eqRound });
        mocks.select.mockReturnValue({ eq: mocks.eqRoom });
        mocks.from.mockReturnValue({ select: mocks.select });

        mocks.subscribe.mockReturnValue(undefined);
        mocks.on.mockImplementation(() => ({ on: mocks.on, subscribe: mocks.subscribe }));
        mocks.channelFactory.mockReturnValue({ on: mocks.on, subscribe: mocks.subscribe });
    });

    it('loads votes for a room round', async () => {
        const votes = await getRoundVotes('room-1', 2);

        expect(mocks.from).toHaveBeenCalledWith('room_votes');
        expect(mocks.select).toHaveBeenCalledWith('*');
        expect(mocks.eqRoom).toHaveBeenCalledWith('room_id', 'room-1');
        expect(mocks.eqRound).toHaveBeenCalledWith('round_number', 2);
        expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: true });
        expect(votes).toEqual([{ id: 'vote-1' }]);
    });

    it('subscribes to vote inserts and cleans up the channel', () => {
        const cleanup = subscribeToRoom('room-1', { onVote: vi.fn() });

        expect(mocks.channelFactory).toHaveBeenCalledWith('room:room-1');
        expect(mocks.on).toHaveBeenCalledWith(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'room_votes', filter: 'room_id=eq.room-1' },
            expect.any(Function)
        );

        cleanup();

        expect(mocks.removeChannel).toHaveBeenCalledWith(expect.any(Object));
    });
});

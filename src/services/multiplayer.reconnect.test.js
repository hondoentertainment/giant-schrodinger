import { describe, it, expect, beforeEach, vi } from 'vitest';

// Build a fake supabase channel with configurable handlers and a controllable subscribe state
function makeFakeChannel() {
    const handlers = {
        postgres: [],    // { event, table, filter, cb }
        system: [],      // { cb }
    };
    const channel = {
        on(kind, config, cb) {
            if (kind === 'postgres_changes') {
                handlers.postgres.push({ ...config, cb });
            } else if (kind === 'system') {
                handlers.system.push({ cb });
            }
            return channel;
        },
        subscribe: vi.fn(() => channel),
        __handlers: handlers,
        __fireSystem(event) {
            handlers.system.forEach((h) => h.cb({ event }));
        },
    };
    return channel;
}

const removeChannelMock = vi.fn();
const channelFactory = vi.fn();

vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => true),
    supabase: {
        channel: (...args) => channelFactory(...args),
        removeChannel: (...args) => removeChannelMock(...args),
    },
}));

import { subscribeToRoom } from './multiplayer';

describe('multiplayer subscribeToRoom / disconnect recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        channelFactory.mockReset();
        removeChannelMock.mockReset();
    });

    it('returns null when backend is disabled', async () => {
        const mod = await import('../lib/supabase');
        mod.isBackendEnabled.mockReturnValueOnce(false);

        const unsub = subscribeToRoom('room-1', {});
        expect(unsub).toBeNull();
    });

    it('creates a channel with room-scoped topic and calls subscribe()', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);

        const unsub = subscribeToRoom('room-123', {});
        expect(channelFactory).toHaveBeenCalledWith('room:room-123');
        expect(channel.subscribe).toHaveBeenCalledTimes(1);
        expect(typeof unsub).toBe('function');
    });

    it('wires postgres_changes handlers for rooms, room_players, and room_submissions', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);

        subscribeToRoom('room-7', {});

        const filters = channel.__handlers.postgres.map((h) => ({
            event: h.event,
            table: h.table,
        }));
        expect(filters).toContainEqual({ event: 'UPDATE', table: 'rooms' });
        expect(filters).toContainEqual({ event: 'INSERT', table: 'room_players' });
        expect(filters).toContainEqual({ event: 'DELETE', table: 'room_players' });
        expect(filters).toContainEqual({ event: 'INSERT', table: 'room_submissions' });
        expect(filters).toContainEqual({ event: 'UPDATE', table: 'room_submissions' });
    });

    it('invokes onDisconnect callback when system event "disconnect" fires', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);
        const onDisconnect = vi.fn();

        subscribeToRoom('room-1', { onDisconnect });
        expect(onDisconnect).not.toHaveBeenCalled();

        channel.__fireSystem('disconnect');
        expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('invokes onDisconnect callback when system event "error" fires', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);
        const onDisconnect = vi.fn();

        subscribeToRoom('room-1', { onDisconnect });

        channel.__fireSystem('error');
        expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('does NOT invoke onDisconnect on unrelated system events', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);
        const onDisconnect = vi.fn();

        subscribeToRoom('room-1', { onDisconnect });

        channel.__fireSystem('connected');
        channel.__fireSystem('subscribed');
        expect(onDisconnect).not.toHaveBeenCalled();
    });

    it('is safe when onDisconnect callback is not provided', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);

        subscribeToRoom('room-1', {});
        expect(() => channel.__fireSystem('disconnect')).not.toThrow();
    });

    it('returned unsubscribe function calls removeChannel', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);

        const unsub = subscribeToRoom('room-1', {});
        unsub();
        expect(removeChannelMock).toHaveBeenCalledWith(channel);
    });

    it('postgres_changes callbacks forward the expected payload property', () => {
        const channel = makeFakeChannel();
        channelFactory.mockReturnValue(channel);
        const onRoomUpdate = vi.fn();
        const onPlayerJoin = vi.fn();
        const onPlayerLeave = vi.fn();
        const onSubmission = vi.fn();
        const onSubmissionUpdate = vi.fn();

        subscribeToRoom('room-1', {
            onRoomUpdate,
            onPlayerJoin,
            onPlayerLeave,
            onSubmission,
            onSubmissionUpdate,
        });

        // Find each handler and fire with a fake payload
        const findHandler = (event, table) =>
            channel.__handlers.postgres.find((h) => h.event === event && h.table === table).cb;

        findHandler('UPDATE', 'rooms')({ new: { id: 'r1', status: 'playing' } });
        expect(onRoomUpdate).toHaveBeenCalledWith({ id: 'r1', status: 'playing' });

        findHandler('INSERT', 'room_players')({ new: { id: 'p1', player_name: 'Alice' } });
        expect(onPlayerJoin).toHaveBeenCalledWith({ id: 'p1', player_name: 'Alice' });

        findHandler('DELETE', 'room_players')({ old: { id: 'p2', player_name: 'Bob' } });
        expect(onPlayerLeave).toHaveBeenCalledWith({ id: 'p2', player_name: 'Bob' });

        findHandler('INSERT', 'room_submissions')({ new: { id: 's1', submission: 'hi' } });
        expect(onSubmission).toHaveBeenCalledWith({ id: 's1', submission: 'hi' });

        findHandler('UPDATE', 'room_submissions')({ new: { id: 's1', score: 7 } });
        expect(onSubmissionUpdate).toHaveBeenCalledWith({ id: 's1', score: 7 });
    });
});

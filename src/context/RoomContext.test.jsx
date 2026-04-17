import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, cleanup } from '@testing-library/react';

// Mock modules BEFORE importing RoomContext.
vi.mock('../lib/supabase', () => ({
    isBackendEnabled: () => true,
    supabase: null,
}));

vi.mock('../services/multiplayer', () => ({
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    getRoomByCode: vi.fn(),
    getRoomPlayers: vi.fn(async () => []),
    leaveRoom: vi.fn(async () => true),
    startRound: vi.fn(),
    setRoomStatus: vi.fn(),
    submitAnswer: vi.fn(async () => true),
    getRoundSubmissions: vi.fn(async () => []),
    getRoomSubmissions: vi.fn(async () => []),
    updateSubmissionScore: vi.fn(),
    fetchRoomState: vi.fn(),
    subscribeToRoom: vi.fn(() => () => {}),
}));

vi.mock('../services/gemini', () => ({
    scoreSubmission: vi.fn(),
}));

vi.mock('../services/customImages', () => ({
    getCustomImages: () => [],
}));

// Mock GameContext so we can track setGameState and supply a stable user.
const setGameStateMock = vi.fn();
vi.mock('./GameContext', () => ({
    useGame: () => ({
        user: { mediaType: 'image', useCustomImages: false },
        setGameState: setGameStateMock,
    }),
}));

// Mock ToastContext with a stable `toast` object to avoid churn in useCallback deps.
const toastMock = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
};
vi.mock('./ToastContext', () => ({
    useToast: () => ({ toast: toastMock }),
}));

import { RoomProvider, useRoom } from './RoomContext';
import { fetchRoomState, leaveRoom } from '../services/multiplayer';

function wrapper({ children }) {
    return <RoomProvider>{children}</RoomProvider>;
}

describe('RoomContext — disconnect auto-exit effect (line 154)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setGameStateMock.mockClear();
        toastMock.info.mockClear();
        toastMock.success.mockClear();
        toastMock.error.mockClear();
        toastMock.warn.mockClear();
        leaveRoom.mockClear();
        fetchRoomState.mockReset();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('does NOT schedule a leave timer while state is "connected"', () => {
        renderHook(() => useRoom(), { wrapper });
        // Initial state is 'connected' — no pending timer should be active.
        expect(vi.getTimerCount()).toBe(0);
    });

    it('schedules exactly one 30s timer when state transitions to "disconnected"', async () => {
        // attemptReconnect without a room code immediately sets state to 'disconnected'.
        const { result } = renderHook(() => useRoom(), { wrapper });

        await act(async () => {
            await result.current.attemptReconnect();
        });

        // One pending setTimeout should exist for the 30s auto-exit.
        expect(vi.getTimerCount()).toBe(1);
        expect(leaveRoom).not.toHaveBeenCalled();
    });

    it('fires leaveCurrentRoom after 30s of "disconnected" and transitions to LOBBY', async () => {
        const { result } = renderHook(() => useRoom(), { wrapper });

        await act(async () => {
            await result.current.attemptReconnect();
        });
        expect(result.current.connectionState).toBe('disconnected');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        // leaveCurrentRoom's side-effects: setGameState('LOBBY') + toast.info('Left the room').
        expect(setGameStateMock).toHaveBeenCalledWith('LOBBY');
        expect(toastMock.info).toHaveBeenCalledWith('Left the room');
    });

    it('uses the LATEST leaveCurrentRoom via ref (ref-sync works correctly)', async () => {
        // Regression test for the fix: the effect no longer depends on
        // leaveCurrentRoom, so the ref-sync effect must keep it current.
        const { result } = renderHook(() => useRoom(), { wrapper });

        // Trigger 'disconnected' — the 30s timer captures the *ref*, not a closure.
        await act(async () => {
            await result.current.attemptReconnect();
        });
        expect(vi.getTimerCount()).toBe(1);

        // Let the timer fire; it should call the latest leaveCurrentRoom,
        // which emits the 'Left the room' toast and transitions to LOBBY.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(toastMock.info).toHaveBeenCalledWith('Left the room');
        expect(setGameStateMock).toHaveBeenCalledWith('LOBBY');
    });

    it('does not leak pending timers when the provider unmounts during "disconnected"', async () => {
        const { result, unmount } = renderHook(() => useRoom(), { wrapper });

        await act(async () => {
            await result.current.attemptReconnect();
        });
        expect(vi.getTimerCount()).toBe(1);

        unmount();

        // Effect cleanup should clearTimeout on the pending 30s timer.
        expect(vi.getTimerCount()).toBe(0);
    });

    it('browser "online" event triggers reconnect (effect wires listener correctly)', async () => {
        // This indirectly validates that the sibling online/offline useEffect (also
        // sensitive to callback-identity churn) keeps a working reconnect handler.
        fetchRoomState.mockResolvedValueOnce(null); // no room => will fall through to 'disconnected'
        const { result } = renderHook(() => useRoom(), { wrapper });

        // Before any disconnect, fire the browser 'online' event.
        await act(async () => {
            window.dispatchEvent(new Event('online'));
            // Let any scheduled microtasks settle.
            await Promise.resolve();
        });

        // attemptReconnect was invoked via the handler; since there is no room,
        // state transitions to 'disconnected' and a timer is scheduled.
        expect(result.current.connectionState).toBe('disconnected');
        expect(vi.getTimerCount()).toBe(1);
    });
});

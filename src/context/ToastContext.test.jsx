import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, renderHook, cleanup } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

const TOAST_DURATION = 4000;

function wrapper({ children }) {
    return <ToastProvider>{children}</ToastProvider>;
}

function TestComponent() {
    const { addToast, removeToast, toasts } = useToast();
    return (
        <div>
            <button onClick={() => addToast('hi')}>Add</button>
            <button onClick={() => toasts[0] && removeToast(toasts[0].id)}>
                RemoveFirst
            </button>
            <ul>
                {toasts.map((t) => (
                    <li key={t.id} data-testid="toast">
                        {t.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}

describe('ToastContext', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Unmount any still-mounted React trees under fake timers so their
        // useEffect cleanups can clear pending timeouts before we swap timers.
        cleanup();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('addToast adds a toast and returns its ID', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        let returnedId;
        act(() => {
            returnedId = result.current.addToast('hello');
        });

        expect(typeof returnedId).toBe('number');
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0]).toMatchObject({
            id: returnedId,
            message: 'hello',
            type: 'error',
        });
    });

    it('auto-dismisses a toast after the duration elapses', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        act(() => {
            result.current.addToast('bye soon');
        });
        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            vi.advanceTimersByTime(TOAST_DURATION);
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('manual removeToast removes the toast', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        let id;
        act(() => {
            id = result.current.addToast('manual bye');
        });
        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            result.current.removeToast(id);
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('manual dismiss clears the pending auto-dismiss timer (leak fix)', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        let id;
        act(() => {
            id = result.current.addToast('leak check');
        });

        // One pending auto-dismiss timer should exist.
        expect(vi.getTimerCount()).toBe(1);

        act(() => {
            result.current.removeToast(id);
        });

        // After manual dismiss, the auto-dismiss timer should have been cleared.
        expect(vi.getTimerCount()).toBe(0);

        // Advancing past the original duration should not crash or re-fire anything.
        expect(() => {
            act(() => {
                vi.advanceTimersByTime(TOAST_DURATION * 2);
            });
        }).not.toThrow();

        expect(result.current.toasts).toHaveLength(0);
    });

    it('multiple toasts with different durations dismiss independently', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        let id1;
        let id2;
        let id3;
        act(() => {
            id1 = result.current.addToast('first');
        });
        act(() => {
            vi.advanceTimersByTime(1000);
            id2 = result.current.addToast('second');
        });
        act(() => {
            vi.advanceTimersByTime(1000);
            id3 = result.current.addToast('third');
        });

        expect(result.current.toasts).toHaveLength(3);

        // Remove the middle one manually; the other two must remain with their
        // own auto-dismiss timers still pending.
        act(() => {
            result.current.removeToast(id2);
        });

        expect(result.current.toasts.map((t) => t.id)).toEqual([id1, id3]);
        // Two timers pending, one was cleared on manual remove.
        expect(vi.getTimerCount()).toBe(2);

        // Advance enough to auto-dismiss the first (added at t=0, duration 4000).
        act(() => {
            vi.advanceTimersByTime(3000); // now at t=5000, past id1's deadline
        });
        expect(result.current.toasts.map((t) => t.id)).toEqual([id3]);

        // Advance enough to auto-dismiss the third (added at t=2000, deadline t=6000).
        act(() => {
            vi.advanceTimersByTime(2000); // now at t=7000
        });
        expect(result.current.toasts).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('provider unmount clears all pending timers', () => {
        const { unmount } = render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        // This needs access to addToast; render with a ref-y component instead.
        // Use renderHook so we can call addToast repeatedly before unmount.
        unmount();

        const { result, unmount: unmountHook } = renderHook(() => useToast(), {
            wrapper,
        });

        act(() => {
            result.current.addToast('a');
            result.current.addToast('b');
            result.current.addToast('c');
        });

        expect(vi.getTimerCount()).toBe(3);

        unmountHook();

        expect(vi.getTimerCount()).toBe(0);

        // Advancing timers after unmount must not throw.
        expect(() => {
            act(() => {
                vi.advanceTimersByTime(TOAST_DURATION * 2);
            });
        }).not.toThrow();
    });

    it('removing a non-existent ID is a safe no-op', () => {
        const { result } = renderHook(() => useToast(), { wrapper });

        act(() => {
            result.current.addToast('present');
        });
        const before = result.current.toasts;

        expect(() => {
            act(() => {
                result.current.removeToast(9999);
            });
        }).not.toThrow();

        // Existing toast untouched; its timer still pending.
        expect(result.current.toasts).toEqual(before);
        expect(vi.getTimerCount()).toBe(1);
    });
});

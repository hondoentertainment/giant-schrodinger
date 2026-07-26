import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    isNotificationEnabled,
    disableNotifications,
    scheduleNotification,
    scheduleStreakReminder,
    scheduleDailyChallengeReminder,
    notifyDailyChallenge,
    notifyFriendChallenge,
} from './notifications';

const PERMISSION_KEY = 'vwf_notifications_enabled';

// Capture the original Notification so we can restore after each test.
const originalNotification = globalThis.Notification;

function installNotification({ permission = 'default', requestResult = 'granted' } = {}) {
    const ctor = vi.fn();
    const mockFn = function Notification(title, options) {
        ctor(title, options);
    };
    mockFn.permission = permission;
    mockFn.requestPermission = vi.fn().mockResolvedValue(requestResult);
    Object.defineProperty(globalThis, 'Notification', {
        value: mockFn,
        writable: true,
        configurable: true,
    });
    // mirror on window for "in window" check
    Object.defineProperty(window, 'Notification', {
        value: mockFn,
        writable: true,
        configurable: true,
    });
    return { ctor, mockFn };
}

function removeNotification() {
    // Force "Notification" not in window by deleting
    delete window.Notification;
    delete globalThis.Notification;
}

describe('notifications service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        if (originalNotification) {
            globalThis.Notification = originalNotification;
            window.Notification = originalNotification;
        } else {
            removeNotification();
        }
    });

    describe('isNotificationSupported', () => {
        it('returns true when Notification and serviceWorker exist', () => {
            installNotification();
            // jsdom navigator does not have serviceWorker by default; stub it
            Object.defineProperty(navigator, 'serviceWorker', {
                value: {},
                configurable: true,
            });
            expect(isNotificationSupported()).toBe(true);
        });

        it('returns false when Notification is missing', () => {
            removeNotification();
            expect(isNotificationSupported()).toBe(false);
        });
    });

    describe('getNotificationPermission', () => {
        it('returns unsupported when Notification missing', () => {
            removeNotification();
            expect(getNotificationPermission()).toBe('unsupported');
        });

        it('returns the current permission state', () => {
            installNotification({ permission: 'denied' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            expect(getNotificationPermission()).toBe('denied');
        });
    });

    describe('requestNotificationPermission', () => {
        it('persists opt-in flag when permission is granted', async () => {
            const { mockFn } = installNotification({ requestResult: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            const result = await requestNotificationPermission();
            expect(result).toBe('granted');
            expect(mockFn.requestPermission).toHaveBeenCalled();
            expect(localStorage.getItem(PERMISSION_KEY)).toBe('true');
        });

        it('does not persist opt-in when permission is denied', async () => {
            installNotification({ requestResult: 'denied' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            const result = await requestNotificationPermission();
            expect(result).toBe('denied');
            expect(localStorage.getItem(PERMISSION_KEY)).toBeNull();
        });

        it('returns unsupported without throwing when unsupported', async () => {
            removeNotification();
            const result = await requestNotificationPermission();
            expect(result).toBe('unsupported');
        });
    });

    describe('isNotificationEnabled / disableNotifications', () => {
        it('returns true only when opt-in flag set and permission granted', () => {
            installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            localStorage.setItem(PERMISSION_KEY, 'true');
            expect(isNotificationEnabled()).toBe(true);
        });

        it('returns false when opt-in flag missing even if granted', () => {
            installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            expect(isNotificationEnabled()).toBe(false);
        });

        it('disableNotifications removes the opt-in key', () => {
            localStorage.setItem(PERMISSION_KEY, 'true');
            disableNotifications();
            expect(localStorage.getItem(PERMISSION_KEY)).toBeNull();
        });
    });

    describe('scheduleNotification', () => {
        it('returns null when notifications are not enabled', () => {
            installNotification({ permission: 'default' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            const id = scheduleNotification('title', 'body', 1000);
            expect(id).toBeNull();
        });

        it('creates a Notification after the delay when document is hidden', () => {
            const { ctor } = installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            localStorage.setItem(PERMISSION_KEY, 'true');
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });

            const id = scheduleNotification('Hello', 'World', 500, 'tag-1');
            expect(id).toBeDefined();

            vi.advanceTimersByTime(500);
            expect(ctor).toHaveBeenCalledWith('Hello', expect.objectContaining({
                body: 'World',
                tag: 'tag-1',
            }));
        });
    });

    describe('scheduleStreakReminder', () => {
        it('does nothing when not enabled', () => {
            installNotification({ permission: 'default' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            expect(scheduleStreakReminder(5)).toBeUndefined();
        });

        it('does nothing when streak is zero', () => {
            installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            localStorage.setItem(PERMISSION_KEY, 'true');
            // Even when enabled, streak of 0 should be a no-op
            expect(scheduleStreakReminder(0)).toBeUndefined();
        });
    });

    describe('scheduleDailyChallengeReminder', () => {
        it('does nothing when not enabled', () => {
            installNotification({ permission: 'default' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            expect(scheduleDailyChallengeReminder()).toBeUndefined();
        });
    });

    describe('notifyDailyChallenge', () => {
        it('does nothing when permission not granted', () => {
            const { ctor } = installNotification({ permission: 'default' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            notifyDailyChallenge();
            expect(ctor).not.toHaveBeenCalled();
        });

        it('creates a Notification when granted', () => {
            const { ctor } = installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            notifyDailyChallenge();
            expect(ctor).toHaveBeenCalledWith(
                'Venn with Friends',
                expect.objectContaining({ tag: 'daily-challenge' })
            );
        });
    });

    describe('notifyFriendChallenge', () => {
        it('includes the friend name in the body', () => {
            const { ctor } = installNotification({ permission: 'granted' });
            Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
            notifyFriendChallenge('Alice');
            expect(ctor).toHaveBeenCalledWith(
                'Venn with Friends',
                expect.objectContaining({ body: expect.stringContaining('Alice') })
            );
        });

        it('does nothing when unsupported', () => {
            removeNotification();
            // Should not throw
            expect(() => notifyFriendChallenge('Bob')).not.toThrow();
        });
    });
});

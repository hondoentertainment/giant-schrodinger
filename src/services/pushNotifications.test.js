import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    isPushSupported,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    getPushSubscription,
    scheduleStreakReminder,
} from './pushNotifications';

const originalNotification = globalThis.Notification;

function installNotification({ permission = 'default', requestResult = 'granted' } = {}) {
    const ctor = vi.fn();
    const mockFn = function Notification(title, options) {
        ctor(title, options);
    };
    mockFn.permission = permission;
    mockFn.requestPermission = vi.fn().mockResolvedValue(requestResult);
    Object.defineProperty(globalThis, 'Notification', {
        value: mockFn, writable: true, configurable: true,
    });
    Object.defineProperty(window, 'Notification', {
        value: mockFn, writable: true, configurable: true,
    });
    return { ctor, mockFn };
}

function removeNotification() {
    delete window.Notification;
    delete globalThis.Notification;
}

function installServiceWorker(registration) {
    Object.defineProperty(navigator, 'serviceWorker', {
        value: {
            ready: Promise.resolve(registration),
        },
        writable: true,
        configurable: true,
    });
}

function removeServiceWorker() {
    delete navigator.serviceWorker;
}

function installPushManager(enable) {
    if (enable) {
        window.PushManager = function PushManager() {};
    } else {
        delete window.PushManager;
    }
}

describe('pushNotifications service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        removeServiceWorker();
        installPushManager(false);
        if (originalNotification) {
            globalThis.Notification = originalNotification;
            window.Notification = originalNotification;
        } else {
            removeNotification();
        }
    });

    describe('isPushSupported', () => {
        it('returns true when serviceWorker and PushManager present', () => {
            installServiceWorker({});
            installPushManager(true);
            expect(isPushSupported()).toBe(true);
        });

        it('returns false when PushManager is missing', () => {
            installServiceWorker({});
            installPushManager(false);
            expect(isPushSupported()).toBe(false);
        });

        it('returns false when serviceWorker is missing', () => {
            removeServiceWorker();
            installPushManager(true);
            expect(isPushSupported()).toBe(false);
        });
    });

    describe('requestNotificationPermission', () => {
        it('returns unsupported when push is unavailable', async () => {
            removeServiceWorker();
            installPushManager(false);
            const result = await requestNotificationPermission();
            expect(result).toBe('unsupported');
        });

        it('returns the permission result when supported', async () => {
            installServiceWorker({});
            installPushManager(true);
            installNotification({ requestResult: 'granted' });
            const result = await requestNotificationPermission();
            expect(result).toBe('granted');
        });

        it('returns denied when user denies', async () => {
            installServiceWorker({});
            installPushManager(true);
            installNotification({ requestResult: 'denied' });
            const result = await requestNotificationPermission();
            expect(result).toBe('denied');
        });
    });

    describe('subscribeToPush', () => {
        it('returns null when unsupported', async () => {
            removeServiceWorker();
            installPushManager(false);
            expect(await subscribeToPush()).toBeNull();
        });

        it('subscribes via pushManager.subscribe with VAPID key and userVisibleOnly', async () => {
            const fakeSubscription = { endpoint: 'https://example/push' };
            const subscribe = vi.fn().mockResolvedValue(fakeSubscription);
            installServiceWorker({ pushManager: { subscribe } });
            installPushManager(true);

            const result = await subscribeToPush();
            expect(result).toBe(fakeSubscription);
            expect(subscribe).toHaveBeenCalledWith(
                expect.objectContaining({ userVisibleOnly: true })
            );
        });
    });

    describe('unsubscribeFromPush', () => {
        it('returns false when unsupported', async () => {
            removeServiceWorker();
            installPushManager(false);
            expect(await unsubscribeFromPush()).toBe(false);
        });

        it('returns false when no subscription exists', async () => {
            const getSubscription = vi.fn().mockResolvedValue(null);
            installServiceWorker({ pushManager: { getSubscription } });
            installPushManager(true);
            expect(await unsubscribeFromPush()).toBe(false);
        });

        it('calls subscription.unsubscribe and returns its boolean', async () => {
            const unsubscribe = vi.fn().mockResolvedValue(true);
            const subscription = { unsubscribe };
            const getSubscription = vi.fn().mockResolvedValue(subscription);
            installServiceWorker({ pushManager: { getSubscription } });
            installPushManager(true);

            const result = await unsubscribeFromPush();
            expect(result).toBe(true);
            expect(unsubscribe).toHaveBeenCalled();
        });
    });

    describe('getPushSubscription', () => {
        it('returns null when unsupported', async () => {
            removeServiceWorker();
            installPushManager(false);
            expect(await getPushSubscription()).toBeNull();
        });

        it('returns the current subscription from pushManager', async () => {
            const subscription = { endpoint: 'x' };
            const getSubscription = vi.fn().mockResolvedValue(subscription);
            installServiceWorker({ pushManager: { getSubscription } });
            installPushManager(true);
            expect(await getPushSubscription()).toBe(subscription);
        });
    });

    describe('scheduleStreakReminder', () => {
        it('returns null when Notification is missing', () => {
            removeNotification();
            expect(scheduleStreakReminder(3)).toBeNull();
        });

        it('returns null when permission is not granted', () => {
            installNotification({ permission: 'default' });
            expect(scheduleStreakReminder(3)).toBeNull();
        });

        it('returns null when the reminder time has already passed', () => {
            installNotification({ permission: 'granted' });
            // Set system time to 10 PM — reminder at 9 PM is in the past
            vi.setSystemTime(new Date('2026-04-12T22:00:00'));
            expect(scheduleStreakReminder(3)).toBeNull();
        });

        it('fires a notification at 9 PM when scheduled earlier', () => {
            const { ctor } = installNotification({ permission: 'granted' });
            vi.setSystemTime(new Date('2026-04-12T08:00:00'));
            const id = scheduleStreakReminder(5);
            expect(id).toBeDefined();
            vi.setSystemTime(new Date('2026-04-12T21:00:01'));
            vi.advanceTimersByTime(13 * 60 * 60 * 1000);
            expect(ctor).toHaveBeenCalledWith(
                'Venn with Friends',
                expect.objectContaining({
                    body: expect.stringContaining('5-day streak'),
                })
            );
        });
    });
});

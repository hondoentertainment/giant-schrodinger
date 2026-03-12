/**
 * Push notification service for Venn with Friends.
 * Handles permission requests, subscription management,
 * and local notification scheduling.
 */

const PERMISSION_KEY = 'vwf_notifications_enabled';

/**
 * Check if push notifications are supported and permitted.
 */
export function isNotificationSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get the current notification permission state.
 */
export function getNotificationPermission() {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Request permission to send notifications.
 */
export async function requestNotificationPermission() {
    if (!isNotificationSupported()) return 'unsupported';
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        localStorage.setItem(PERMISSION_KEY, 'true');
    }
    return permission;
}

/**
 * Check if the user has opted in to notifications.
 */
export function isNotificationEnabled() {
    return localStorage.getItem(PERMISSION_KEY) === 'true' && getNotificationPermission() === 'granted';
}

/**
 * Disable notifications opt-in.
 */
export function disableNotifications() {
    localStorage.removeItem(PERMISSION_KEY);
}

/**
 * Schedule a local notification (doesn't need a push server).
 * Uses setTimeout to show notification at a future time.
 * @param {string} title
 * @param {string} body
 * @param {number} delayMs - delay in milliseconds
 * @param {string} [tag] - notification tag for deduplication
 * @returns {number|null} timeout ID or null if not permitted
 */
export function scheduleNotification(title, body, delayMs, tag = 'venn-scheduled') {
    if (!isNotificationEnabled()) return null;
    return setTimeout(() => {
        if (document.hidden) {
            new Notification(title, {
                body,
                tag,
                icon: '🎯',
            });
        }
    }, delayMs);
}

/**
 * Schedule a streak reminder notification.
 * Shows "Your streak expires in 3 hours!" if user hasn't played today.
 * @param {number} currentStreak - current streak count
 */
export function scheduleStreakReminder(currentStreak) {
    if (!isNotificationEnabled() || currentStreak <= 0) return;
    // Schedule for 9 PM local time
    const now = new Date();
    const reminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0);
    const delay = reminder.getTime() - now.getTime();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        scheduleNotification(
            `Your ${currentStreak}-day streak is at risk!`,
            'Play a round before midnight to keep your streak alive.',
            delay,
            'streak-reminder'
        );
    }
}

/**
 * Schedule a daily challenge reminder.
 * Shows at noon if the daily hasn't been completed.
 */
export function scheduleDailyChallengeReminder() {
    if (!isNotificationEnabled()) return;
    const now = new Date();
    const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const delay = noon.getTime() - now.getTime();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        scheduleNotification(
            'Daily Challenge is live!',
            'Today\'s concepts are waiting. Can you crack them?',
            delay,
            'daily-challenge'
        );
    }
}

// ============================================================
// Push Subscription Management (VAPID-based)
// ============================================================

const PUSH_SUB_KEY = 'vwf_push_subscription';

/**
 * Subscribe to push notifications via the service worker.
 * Requires a VAPID public key set as VITE_VAPID_PUBLIC_KEY.
 * @returns {PushSubscription|null} The push subscription or null
 */
export async function subscribeToPush() {
    if (!isNotificationSupported()) return null;
    const vapidKey = import.meta.env?.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
        console.warn('VAPID public key not set — push subscriptions disabled');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(existing.toJSON()));
            return existing;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(subscription.toJSON()));
        return subscription;
    } catch (err) {
        console.warn('Push subscription failed:', err);
        return null;
    }
}

/**
 * Unsubscribe from push notifications.
 * @returns {boolean} Whether unsubscription succeeded
 */
export async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }
        localStorage.removeItem(PUSH_SUB_KEY);
        return true;
    } catch (err) {
        console.warn('Push unsubscription failed:', err);
        return false;
    }
}

/**
 * Get the current push subscription from localStorage.
 * @returns {Object|null} Subscription JSON or null
 */
export function getPushSubscription() {
    try {
        const sub = localStorage.getItem(PUSH_SUB_KEY);
        return sub ? JSON.parse(sub) : null;
    } catch {
        return null;
    }
}

/**
 * Convert a URL-safe base64 VAPID key to a Uint8Array.
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Schedule a push notification for when a friend beats your score.
 * (Uses local notification as fallback when push server isn't available)
 * @param {string} friendName
 * @param {number} friendScore
 * @param {number} yourScore
 */
export function notifyFriendBeatScore(friendName, friendScore, yourScore) {
    if (!isNotificationEnabled()) return;
    scheduleNotification(
        `${friendName} beat your score!`,
        `They scored ${friendScore}/10 vs your ${yourScore}/10. Can you reclaim your title?`,
        0,
        'friend-beat-score'
    );
}

/**
 * Schedule a tournament starting notification.
 * @param {string} tournamentName
 * @param {number} delayMs
 */
export function notifyTournamentStarting(tournamentName, delayMs = 0) {
    if (!isNotificationEnabled()) return;
    scheduleNotification(
        'Tournament Starting!',
        `${tournamentName} is about to begin. Join now!`,
        delayMs,
        'tournament-start'
    );
}

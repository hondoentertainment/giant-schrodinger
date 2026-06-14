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

/**
 * Send an immediate notification that the daily challenge is live.
 * Useful for triggering when a new daily challenge becomes available.
 */
export function notifyDailyChallenge() {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    new Notification('Venn with Friends', {
        body: 'Daily challenge is live! Earn 1.5x bonus points.',
        icon: '/icon-192.svg',
        tag: 'daily-challenge',
    });
}

/**
 * Send an immediate notification that a friend has challenged the player.
 * @param {string} friendName - The name of the friend who sent the challenge
 */
export function notifyFriendChallenge(friendName) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    new Notification('Venn with Friends', {
        body: `${friendName} just challenged you! Can you beat their score?`,
        icon: '/icon-192.svg',
        tag: 'friend-challenge',
    });
}

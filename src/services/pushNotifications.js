/**
 * Web Push notification service for Venn with Friends.
 * Handles push subscription management via the Push API
 * and local streak reminder scheduling.
 */

/**
 * Check if push notifications are supported in the current browser.
 */
export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission from the user.
 * @returns {Promise<string>} 'granted', 'denied', 'default', or 'unsupported'
 */
export async function requestNotificationPermission() {
    if (!isPushSupported()) return 'unsupported';
    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Subscribe to push notifications using the VAPID public key.
 * @returns {Promise<PushSubscription|null>} The push subscription or null if unsupported.
 */
export async function subscribeToPush() {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });
    return subscription;
}

/**
 * Unsubscribe from push notifications.
 * @returns {Promise<boolean>} True if successfully unsubscribed.
 */
export async function unsubscribeFromPush() {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        return subscription.unsubscribe();
    }
    return false;
}

/**
 * Get the current push subscription, if any.
 * @returns {Promise<PushSubscription|null>}
 */
export async function getPushSubscription() {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
}

/**
 * Schedule a local notification as a streak reminder.
 * Fires at 9 PM local time (3 hours before midnight) if it hasn't passed yet.
 * @param {number} streakDays - Current streak count
 * @returns {number|null} The timeout ID or null if not scheduled.
 */
export function scheduleStreakReminder(streakDays) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return null;

    const now = new Date();
    const reminder = new Date(now);
    reminder.setHours(21, 0, 0, 0);

    if (reminder <= now) return null; // Past 9 PM already

    const delay = reminder - now;
    return setTimeout(() => {
        new Notification('Venn with Friends', {
            body: `Your ${streakDays}-day streak expires at midnight! Play now to keep it alive.`,
            icon: '/icon-192.svg',
            tag: 'streak-reminder',
        });
    }, delay);
}

/**
 * Send push subscription to server for storage.
 * The server needs the subscription object to send push notifications later.
 */
export async function sendSubscriptionToServer(subscription) {
    try {
        const { getSupabase, isBackendEnabled } = await import('../lib/supabase.js');
        if (!isBackendEnabled()) {
            // Store locally as fallback
            localStorage.setItem('vwf_push_subscription', JSON.stringify(subscription));
            return true;
        }
        const supabase = getSupabase();
        const userId = localStorage.getItem('venn_user_id') || 'anonymous';
        await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            subscription: JSON.stringify(subscription),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Full push notification opt-in flow.
 * Requests permission, subscribes, and sends subscription to server.
 * @returns {Promise<{success: boolean, subscription?: PushSubscription, error?: string}>}
 */
export async function enablePushNotifications() {
    if (!isPushSupported()) {
        return { success: false, error: 'Push notifications not supported' };
    }
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
        return { success: false, error: `Permission ${permission}` };
    }
    try {
        const subscription = await subscribeToPush();
        if (subscription) {
            await sendSubscriptionToServer(subscription);
            localStorage.setItem('vwf_push_enabled', 'true');
            return { success: true, subscription };
        }
        return { success: false, error: 'Subscription failed' };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Check if push notifications are currently enabled.
 */
export function isPushEnabled() {
    return localStorage.getItem('vwf_push_enabled') === 'true';
}

/**
 * Disable push notifications and clean up.
 */
export async function disablePushNotifications() {
    await unsubscribeFromPush();
    localStorage.removeItem('vwf_push_enabled');
    localStorage.removeItem('vwf_push_subscription');
}

/**
 * Schedule daily challenge notification.
 * Fires at noon local time if permission granted.
 */
export function scheduleDailyChallengeReminder() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return null;
    const now = new Date();
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    if (noon <= now) return null;
    const delay = noon - now;
    return setTimeout(() => {
        if (document.hidden) {
            new Notification('Venn with Friends', {
                body: 'Today\'s daily challenge is live! Can you crack today\'s concepts?',
                icon: '/icon-192.svg',
                tag: 'daily-challenge',
            });
        }
    }, delay);
}

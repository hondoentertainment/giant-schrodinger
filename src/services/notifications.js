/**
 * Push notification service for Venn with Friends.
 * Handles permission requests, subscription management,
 * and local notification scheduling.
 *
 * Wave 3 (scaffold): Adds Web Push API helpers alongside the existing local
 * notification helpers. The push helpers are all best-effort: when push isn't
 * supported or VITE_VAPID_PUBLIC_KEY is missing they log a warning and return
 * false so anonymous / offline play keeps working.
 *
 * IMPORTANT: we do NOT auto-request notification permission. The client must
 * only call `requestPushPermission()` / `subscribeToPush()` in direct
 * response to an explicit user action (e.g. a "Turn on reminders" toggle).
 * See TODO comments for the UX hookup that still needs to be built.
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
  return (
    localStorage.getItem(PERMISSION_KEY) === 'true' && getNotificationPermission() === 'granted'
  );
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
      "Today's concepts are waiting. Can you crack them?",
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

// ---------------------------------------------------------------------------
// Web Push API scaffolding (Wave 3 growth features)
// ---------------------------------------------------------------------------
//
// STATUS (scaffold):
//  - Done: support-check, permission request, subscribe/unsubscribe,
//    VAPID key conversion, best-effort POST to the `save-push-subscription`
//    Edge Function for storage.
//  - TODO: wire into the UI behind an explicit user opt-in toggle
//    (e.g. a "Turn on reminders" button in profile settings). Do NOT call
//    requestPushPermission() automatically anywhere — browsers will flag the
//    permission as denied forever if we spam the prompt without user intent.
//  - TODO: handle re-subscription on VAPID key rotation and expired
//    subscriptions surfaced via pushsubscriptionchange in the service worker.

/**
 * Does this browser support Web Push? (Not the same as local notifications
 * which only need the Notification API.)
 */
export function isPushSupported() {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

/**
 * Explicit user-gated permission prompt. Callers MUST only invoke this in
 * response to a direct user action (click handler), never on page load.
 * @returns {Promise<NotificationPermission|'unsupported'>}
 */
export async function requestPushPermission() {
  if (!isPushSupported()) {
    console.warn('[push] not supported in this browser');
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('[push] permission request failed:', err);
    return 'denied';
  }
}

/**
 * Convert a base64url VAPID public key to the Uint8Array form expected by
 * PushManager.subscribe(). Returns null on invalid input.
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') return null;
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = typeof atob === 'function' ? atob(base64) : '';
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  } catch (err) {
    console.warn('[push] VAPID key conversion failed:', err);
    return null;
  }
}

/**
 * Register (or reuse) the service worker, subscribe to push with the VAPID
 * public key from VITE_VAPID_PUBLIC_KEY, and POST the subscription to the
 * `save-push-subscription` Edge Function. No-ops (returns false) when push
 * isn't supported or the VAPID key is missing.
 *
 * @returns {Promise<PushSubscription|false>}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    console.warn('[push] subscribe skipped — not supported');
    return false;
  }
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[push] subscribe skipped — VITE_VAPID_PUBLIC_KEY not set');
    return false;
  }
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);
  if (!applicationServerKey) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));

    // Best-effort server-side storage. Swallow errors so a transient
    // network failure doesn't break the local subscription.
    // TODO: retry with exponential backoff on 5xx, dedupe on endpoint.
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const headers = { 'Content-Type': 'application/json' };
        // Pass the anon key as the `apikey` header if available so the
        // Edge Function gateway accepts the request.
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers.apikey = anonKey;
          headers.Authorization = `Bearer ${anonKey}`;
        }
        await fetch(`${supabaseUrl}/functions/v1/save-push-subscription`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ subscription }),
        });
      }
    } catch (err) {
      console.warn('[push] could not persist subscription:', err);
    }

    return subscription;
  } catch (err) {
    console.warn('[push] subscribe failed:', err);
    return false;
  }
}

/**
 * Tear down the current push subscription. Safe to call even if there is no
 * active subscription; returns false on any failure.
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    // TODO: also inform the server so it can prune the row in
    // push_subscriptions. For now we just drop the local subscription.
    return await subscription.unsubscribe();
  } catch (err) {
    console.warn('[push] unsubscribe failed:', err);
    return false;
  }
}

// TODO: when we're ready to attach user_id to the stored subscription, import
// getCurrentUser from ./auth and include the result in the POST body above.
// The Edge Function already accepts the JWT via the Authorization header, so
// the server side can identify the caller once auth is wired into the UI.

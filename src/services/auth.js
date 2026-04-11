/**
 * Supabase Auth service wrapper.
 *
 * STATUS (scaffold):
 *  - Done: safe client accessor, current-user fetch, magic-link sign-in,
 *    sign-out, auth state subscription, availability gate.
 *  - TODO: email verification UI, OAuth providers, session refresh handling
 *    on tab visibility change, account linking to anonymous play data.
 *
 * Design rules:
 *  - Offline-first: every function must safely return null/false when
 *    Supabase is not configured (no VITE_SUPABASE_URL / anon key). Anonymous
 *    play must keep working.
 *  - No duplicate clients: this module imports the shared client from
 *    `src/lib/supabase.js`. Do NOT call `createClient()` here.
 */

import { supabase } from '../lib/supabase';

/**
 * Returns the Supabase auth namespace or null if Supabase isn't configured.
 * Consumers should always null-check.
 */
export function getAuthClient() {
  return supabase ? supabase.auth : null;
}

/**
 * Whether auth is available in this environment. When false, callers should
 * fall back to anonymous behavior.
 */
export function isAuthAvailable() {
  return !!supabase;
}

/**
 * Returns the current user object or null. Never throws.
 */
export async function getCurrentUser() {
  const auth = getAuthClient();
  if (!auth) return null;
  try {
    const { data, error } = await auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch (err) {
    // Network / transient: treat as logged-out so offline play continues.
    console.warn('[auth] getCurrentUser failed:', err);
    return null;
  }
}

/**
 * Start the magic-link sign-in flow. Supabase emails the user a one-time
 * link; there is no password step. Returns `{ ok: boolean, error?: string }`.
 *
 * TODO: wire `emailRedirectTo` once a canonical post-login URL exists.
 */
export async function signInWithMagicLink(email) {
  const auth = getAuthClient();
  if (!auth) {
    return { ok: false, error: 'Auth is not configured in this environment.' };
  }
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email is required.' };
  }
  try {
    const { error } = await auth.signInWithOtp({ email });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'Unknown auth error' };
  }
}

/**
 * Sign out of the current session. No-op when auth is unavailable.
 */
export async function signOut() {
  const auth = getAuthClient();
  if (!auth) return { ok: true };
  try {
    const { error } = await auth.signOut();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'Unknown auth error' };
  }
}

/**
 * Subscribe to auth-state changes. Returns an unsubscribe function. When auth
 * isn't configured the returned unsubscribe is a no-op.
 *
 * @param {(user: object|null) => void} callback
 */
export function onAuthStateChange(callback) {
  const auth = getAuthClient();
  if (!auth) return () => {};
  try {
    const { data } = auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch {
        /* ignore */
      }
    };
  } catch (err) {
    console.warn('[auth] onAuthStateChange failed:', err);
    return () => {};
  }
}

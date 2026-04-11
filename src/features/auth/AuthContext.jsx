/**
 * AuthContext + Provider + useAuth() hook.
 *
 * STATUS (scaffold):
 *  - Done: provider holds { user, loading, signIn, signOut }, syncs with
 *    Supabase auth state, and safely degrades to a noop provider when
 *    Supabase is not configured (so anonymous/offline play keeps working).
 *  - TODO: persist last-signed-in email hint, surface sign-in errors via
 *    ToastContext, hydrate user profile row from `users` table on first
 *    login, and link existing anonymous local-storage stats to the account.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  onAuthStateChange,
  signInWithMagicLink,
  signOut as authSignOut,
  isAuthAvailable,
} from '../../services/auth';

const noop = async () => ({ ok: true });

const AuthContext = createContext({
  user: null,
  loading: false,
  available: false,
  signIn: noop,
  signOut: noop,
});

export function AuthProvider({ children }) {
  const available = isAuthAvailable();
  const [user, setUser] = useState(null);
  // When auth isn't wired we skip the loading state entirely so gated UI
  // renders immediately.
  const [loading, setLoading] = useState(available);

  useEffect(() => {
    if (!available) return undefined;
    let cancelled = false;

    (async () => {
      const current = await getCurrentUser();
      if (!cancelled) {
        setUser(current);
        setLoading(false);
      }
    })();

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!cancelled) setUser(nextUser);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [available]);

  const value = useMemo(
    () => ({
      user,
      loading,
      available,
      signIn: available ? signInWithMagicLink : noop,
      signOut: available ? authSignOut : noop,
    }),
    [user, loading, available]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the auth context. Safe to call even when auth isn't configured —
 * `user` is null and the action functions are no-ops.
 */
export function useAuth() {
  return useContext(AuthContext);
}

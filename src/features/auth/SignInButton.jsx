/**
 * SignInButton — minimal magic-link entry point.
 *
 * STATUS (scaffold):
 *  - Done: shows a sign-in prompt when signed out, user email + sign-out
 *    when signed in, and renders nothing when auth is unavailable so
 *    anonymous-only environments aren't affected.
 *  - TODO: inline email input instead of window.prompt, success/error
 *    toasts via ToastContext, loading spinner, "check your email" state,
 *    localized copy through useTranslation.
 *
 * NOT currently mounted anywhere — App.jsx intentionally doesn't render
 * this yet so anonymous play stays the default. Import it from whichever
 * feature wants to expose sign-in (e.g. a future profile drawer).
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export function SignInButton() {
  const { user, loading, available, signIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!available) return null;
  if (loading) return null;

  const handleSignIn = async () => {
    // Simple prompt for now — replace with an inline input in the real UI.
    const email = typeof window !== 'undefined' ? window.prompt('Email for magic link:') : null;
    if (!email) return;
    setBusy(true);
    const res = await signIn(email);
    setBusy(false);
    if (typeof window !== 'undefined') {
      if (res?.ok) {
        window.alert('Check your email for a sign-in link.');
      } else if (res?.error) {
        window.alert(`Sign-in failed: ${res.error}`);
      }
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/70 truncate max-w-[180px]">{user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={busy}
      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-50"
    >
      {busy ? 'Sending…' : 'Sign in'}
    </button>
  );
}

export default SignInButton;

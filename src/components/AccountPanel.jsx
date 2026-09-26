import React, { useState } from 'react';
import { useAccount } from '../context/AccountContext';

export function AccountPanel({ variant = 'settings' }) {
    const account = useAccount();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [pending, setPending] = useState(false);
    const signedIn = account.status === 'signed-in';

    const sendLink = async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage(null);
        const result = await account.signInWithMagicLink(email);
        setPending(false);
        setMessage(result.ok ? 'Sign-in link sent.' : (result.error || 'Could not send the link.'));
    };

    const google = async () => {
        setPending(true);
        setMessage(null);
        const result = await account.signInWithGoogle();
        setPending(false);
        if (!result.ok) setMessage(result.error || 'Google sign-in failed.');
    };

    const signOut = async () => {
        setPending(true);
        const result = await account.signOut();
        setPending(false);
        if (!result.ok) setMessage(result.error || 'Sign out failed.');
    };

    return (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left" aria-label="Account">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">
                    {variant === 'gate' ? 'Optional account' : 'Account'}
                </h3>
                {account.cloudLabs && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Synced</span>
                )}
            </div>
            <p className="mt-1 text-xs text-white/55">
                Continue without an account. Play is never blocked on sign-in.
                {account.authAvailable
                    ? ' Sign in only to keep progress on another device.'
                    : ' Accounts need Supabase before sign-in works. You can keep playing on this device.'}
            </p>
            {account.notice && (
                <p className="mt-2 text-xs text-amber-100/90">{account.notice}</p>
            )}
            {signedIn ? (
                <div className="mt-3 space-y-2">
                    <p className="text-sm text-white/80">{account.email || 'Signed in'}</p>
                    <p className="text-[11px] text-white/40">
                        {account.syncState === 'error'
                            ? 'Cloud save failed. This device still has your progress.'
                            : account.syncState === 'syncing'
                                ? 'Syncing this device with your account.'
                                : 'Ranked, shop, and tournaments save to this account. Not a public ladder.'}
                    </p>
                    <button
                        type="button"
                        onClick={signOut}
                        disabled={pending}
                        className="text-sm text-white/70 underline min-h-[44px]"
                    >
                        Sign out
                    </button>
                </div>
            ) : account.authAvailable ? (
                <form onSubmit={sendLink} className="mt-3 space-y-2">
                    <label className="block text-[11px] uppercase tracking-wide text-white/40" htmlFor={`account-email-${variant}`}>
                        Email magic link
                    </label>
                    <input
                        id={`account-email-${variant}`}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="game-input w-full min-h-[44px] text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            disabled={pending || !email.trim()}
                            className="wordle-button text-sm min-h-[44px] px-3 disabled:opacity-50"
                        >
                            Email me a link
                        </button>
                        <button
                            type="button"
                            onClick={google}
                            disabled={pending}
                            className="wordle-button text-sm min-h-[44px] px-3"
                        >
                            Google
                        </button>
                    </div>
                </form>
            ) : null}
            {message && <p className="mt-2 text-xs text-white/70">{message}</p>}
            {variant === 'gate' && (
                <p className="mt-2 text-[11px] text-white/40">
                    Play today&apos;s pair above. An account is never required for the first game.
                </p>
            )}
        </section>
    );
}

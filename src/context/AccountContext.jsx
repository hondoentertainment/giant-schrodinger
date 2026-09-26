import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isBackendEnabled } from '../lib/supabase';
import { useGame } from './GameContext';
import { PROGRESS_DIRTY_EVENT } from '../lib/progressEvents';
import { signInWithGoogle, signInWithMagicLink, signOutAccount } from '../services/authAccount';
import { hydrateAccountProgress, pushAccountProgress } from '../services/cloudSync';

const AccountContext = createContext(null);

export const GUEST_ACCOUNT = {
    status: 'guest',
    authAvailable: false,
    cloudLabs: false,
    syncState: 'idle',
    email: null,
    notice: null,
    signInWithMagicLink: async () => ({ ok: false, error: 'Accounts need Supabase.' }),
    signInWithGoogle: async () => ({ ok: false, error: 'Accounts need Supabase.' }),
    signOut: async () => ({ ok: true }),
};

function checkoutQuery() {
    if (typeof window === 'undefined') return { status: null, sessionId: null };
    const params = new URLSearchParams(window.location.search);
    return {
        status: params.get('checkout'),
        sessionId: params.get('session_id'),
    };
}

function clearCheckoutQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function AccountProvider({ children }) {
    const { syncProfile } = useGame();
    const [status, setStatus] = useState('guest');
    const [email, setEmail] = useState(null);
    const [syncState, setSyncState] = useState('idle');
    const [notice, setNotice] = useState(null);
    const userIdRef = useRef(null);
    const hydratedRef = useRef(false);
    const dirtyRef = useRef(false);
    const hydrateLock = useRef(null);
    const syncProfileRef = useRef(syncProfile);
    syncProfileRef.current = syncProfile;

    const applyDecision = useCallback((decision) => {
        if (decision?.snapshot?.profile?.name) {
            syncProfileRef.current(decision.snapshot.profile);
        }
    }, []);

    const hydrate = useCallback(async (session) => {
        const userId = session?.user?.id;
        if (!userId) return null;
        if (hydrateLock.current?.userId === userId && hydratedRef.current) return null;
        if (hydrateLock.current?.userId === userId && hydrateLock.current.promise) {
            return hydrateLock.current.promise;
        }
        const promise = (async () => {
            userIdRef.current = userId;
            setStatus('signed-in');
            setEmail(session.user.email || null);
            setSyncState('syncing');
            try {
                const decision = await hydrateAccountProgress(userId);
                hydratedRef.current = true;
                dirtyRef.current = false;
                applyDecision(decision);
                setSyncState('ready');
                return decision;
            } catch (error) {
                hydratedRef.current = false;
                setSyncState('error');
                setNotice(error?.message || 'Cloud sync is unavailable. This device still keeps your progress.');
                return null;
            }
        })();
        hydrateLock.current = { userId, promise };
        return promise;
    }, [applyDecision]);

    const flush = useCallback(async () => {
        const userId = userIdRef.current;
        if (!userId || !hydratedRef.current || !dirtyRef.current) return;
        dirtyRef.current = false;
        try {
            await pushAccountProgress(userId);
            setSyncState('ready');
        } catch (error) {
            dirtyRef.current = true;
            setSyncState('error');
            setNotice(error?.message || 'Could not save to your account. Progress is still on this device.');
        }
    }, []);

    useEffect(() => {
        if (!isBackendEnabled()) return undefined;

        let cancelled = false;
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (cancelled) return;
            if (!session?.user) {
                userIdRef.current = null;
                hydratedRef.current = false;
                dirtyRef.current = false;
                hydrateLock.current = null;
                setStatus('guest');
                setEmail(null);
                setSyncState('idle');
                return;
            }
            hydrate(session);
        });

        supabase.auth.getSession().then(({ data }) => {
            if (cancelled) return;
            if (data?.session) hydrate(data.session);
        });

        return () => {
            cancelled = true;
            subscription?.subscription?.unsubscribe();
        };
    }, [hydrate]);

    useEffect(() => {
        if (!isBackendEnabled()) return undefined;
        const onDirty = () => {
            if (!hydratedRef.current) return;
            dirtyRef.current = true;
        };
        window.addEventListener(PROGRESS_DIRTY_EVENT, onDirty);
        const timer = window.setInterval(() => {
            flush();
        }, 8000);
        const onHide = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        document.addEventListener('visibilitychange', onHide);
        window.addEventListener('pagehide', flush);
        return () => {
            window.removeEventListener(PROGRESS_DIRTY_EVENT, onDirty);
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onHide);
            window.removeEventListener('pagehide', flush);
        };
    }, [flush]);

    useEffect(() => {
        if (!isBackendEnabled() || status !== 'signed-in') return undefined;
        const { status: checkoutStatus, sessionId } = checkoutQuery();
        if (!checkoutStatus) return undefined;
        clearCheckoutQuery();
        if (checkoutStatus === 'cancel') {
            setNotice('Checkout canceled. Nothing was charged.');
            return undefined;
        }
        if (checkoutStatus !== 'success') return undefined;

        let cancelled = false;
        setNotice('Checking the payment with Stripe. Nothing is granted until the receipt lands.');
        (async () => {
            const userId = userIdRef.current;
            if (!userId) return;
            for (let attempt = 0; attempt < 4; attempt += 1) {
                if (cancelled) return;
                try {
                    const decision = await hydrateAccountProgress(userId);
                    applyDecision(decision);
                    const grants = decision?.snapshot?.stripeEntitlements?.grants || [];
                    const matched = sessionId && grants.some((grant) => grant.id === sessionId);
                    if (matched) {
                        hydratedRef.current = true;
                        dirtyRef.current = false;
                        setSyncState('ready');
                        setNotice('Payment received. It is saved on your account.');
                        return;
                    }
                } catch {
                    // Keep polling until the webhook writes the receipt.
                }
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            if (!cancelled) {
                setNotice('Stripe has not confirmed this payment yet. Your account will update when the receipt arrives. You were not marked as paid early.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [status, applyDecision]);

    const signInEmail = useCallback(async (nextEmail) => {
        if (!isBackendEnabled()) return { ok: false, error: 'Accounts need Supabase.' };
        const result = await signInWithMagicLink(nextEmail);
        if (result.ok) setNotice('Check your email for the sign-in link. You can keep playing on this device.');
        return result;
    }, []);

    const signInGoogle = useCallback(async () => {
        if (!isBackendEnabled()) return { ok: false, error: 'Accounts need Supabase.' };
        return signInWithGoogle();
    }, []);

    const signOut = useCallback(async () => {
        if (!isBackendEnabled()) return { ok: true };
        const result = await signOutAccount();
        if (result.ok) setNotice('Signed out. This device keeps a local copy so you can keep playing.');
        return result;
    }, []);

    const value = useMemo(() => ({
        status,
        authAvailable: isBackendEnabled(),
        cloudLabs: status === 'signed-in' && syncState === 'ready',
        syncState,
        email,
        notice,
        signInWithMagicLink: signInEmail,
        signInWithGoogle: signInGoogle,
        signOut,
    }), [status, syncState, email, notice, signInEmail, signInGoogle, signOut]);

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    return useContext(AccountContext) || GUEST_ACCOUNT;
}

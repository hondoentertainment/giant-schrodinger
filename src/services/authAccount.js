import { supabase } from '../lib/supabase';

export function authRedirectUrl() {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}${window.location.pathname}`;
}

export async function signInWithMagicLink(email) {
    const trimmed = String(email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { ok: false, error: 'Enter a valid email address.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) return { ok: false, error: error.message || 'Could not send the sign-in link.' };
    return { ok: true };
}

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authRedirectUrl() },
    });
    if (error) return { ok: false, error: error.message || 'Google sign-in failed.' };
    return { ok: true };
}

export async function signOutAccount() {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: error.message || 'Sign out failed.' };
    return { ok: true };
}

import { isBackendEnabled } from './supabase';

/**
 * Client-side Gemini is disabled in production when Supabase is configured,
 * so scoring goes through the score-submission edge function only.
 * Set VITE_ALLOW_CLIENT_GEMINI=true to override (local debugging only).
 */
export function isClientGeminiEnabled() {
    if (import.meta.env.VITE_ALLOW_CLIENT_GEMINI === 'true') {
        return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
    }
    if (import.meta.env.DEV) {
        return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
    }
    if (import.meta.env.PROD && isBackendEnabled()) {
        return false;
    }
    return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

export function isProductionBuild() {
    return import.meta.env.PROD;
}

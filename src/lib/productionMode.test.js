import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('productionMode', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('allows client Gemini in dev when key is present', async () => {
        vi.stubEnv('DEV', true);
        vi.stubEnv('PROD', false);
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
        vi.stubEnv('VITE_ALLOW_CLIENT_GEMINI', '');
        vi.stubEnv('VITE_SUPABASE_URL', '');
        const { isClientGeminiEnabled } = await import('./productionMode');
        expect(isClientGeminiEnabled()).toBe(true);
        vi.unstubAllEnvs();
    });

    it('blocks client Gemini in prod when Supabase is configured', async () => {
        vi.stubEnv('DEV', false);
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
        vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
        vi.stubEnv('VITE_ALLOW_CLIENT_GEMINI', '');
        const { isClientGeminiEnabled } = await import('./productionMode');
        expect(isClientGeminiEnabled()).toBe(false);
        vi.unstubAllEnvs();
    });

    it('allows override with VITE_ALLOW_CLIENT_GEMINI', async () => {
        vi.stubEnv('DEV', false);
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
        vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
        vi.stubEnv('VITE_ALLOW_CLIENT_GEMINI', 'true');
        const { isClientGeminiEnabled } = await import('./productionMode');
        expect(isClientGeminiEnabled()).toBe(true);
        vi.unstubAllEnvs();
    });
});

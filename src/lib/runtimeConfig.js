export function isGeminiEnabled() {
    return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

export function getRuntimeStatus() {
    const backendEnabled = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    const geminiEnabled = isGeminiEnabled();

    return {
        backendEnabled,
        geminiEnabled,
        aiScoringMode: geminiEnabled ? 'live' : 'mock',
        fusionImageMode: geminiEnabled ? 'generated' : 'curated',
        multiplayerMode: backendEnabled ? 'live' : 'disabled',
        friendJudgingMode: backendEnabled ? 'persisted' : 'local-only',
    };
}

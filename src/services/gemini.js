import { TIMINGS } from '../lib/timings';
import { GoogleGenAI } from '@google/genai';
import { getFusionImage } from '../data/themes';
import { getAIDifficulty, getDifficultyConfig } from './aiFeatures';
import { createRateLimiter } from '../lib/rateLimit.js';
import { addToOfflineQueue } from './offlineQueue';
import { scoreViaServer } from './serverScoring';

const scoringLimiter = createRateLimiter('scoring', { maxRequests: 1, windowMs: 5000 });

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SCORING_PROMPT = `You are a witty judge for a game where players connect two concepts using a creative phrase.

Given:
- Left concept ({{mediaType}}): {{left}}
- Right concept ({{mediaType}}): {{right}}
- Player's connecting phrase: "{{submission}}"

Score the connection from 1-10 on four criteria (each 1-10):
- wit: Cleverness and humor
- logic: How well it actually connects the two concepts
- originality: Surprise and freshness
- clarity: How clear and understandable the connection is

Respond with ONLY valid JSON, no other text:
{"wit": N, "logic": N, "originality": N, "clarity": N, "relevance": "Highly Logical" or "Absurdly Creative" or "Wild Card", "commentary": "One witty sentence"}`;

function applyDifficulty(result) {
    const config = getDifficultyConfig(getAIDifficulty());
    const strictness = config.scoringStrictness;
    if (strictness === 1.0) return result;

    const adjust = (val) => Math.min(10, Math.max(1, Math.round(val * strictness)));
    const breakdown = {
        wit: adjust(result.breakdown.wit),
        logic: adjust(result.breakdown.logic),
        originality: adjust(result.breakdown.originality),
        clarity: adjust(result.breakdown.clarity),
    };
    const score = Math.min(10, Math.max(1, Math.round(
        (breakdown.wit + breakdown.logic + breakdown.originality + breakdown.clarity) / 4
    )));
    return { ...result, breakdown, baseScore: score, score };
}

function mockScore(submission, asset1, asset2) {
    const breakdown = {
        wit: Math.floor(Math.random() * 4) + 7,
        logic: Math.floor(Math.random() * 4) + 6,
        originality: Math.floor(Math.random() * 4) + 6,
        clarity: Math.floor(Math.random() * 4) + 7,
    };
    const baseScore = Math.round(
        (breakdown.wit + breakdown.logic + breakdown.originality + breakdown.clarity) / 4
    );
    const relevance = Math.random() > 0.5 ? 'Highly Logical' : 'Absurdly Creative';
    const leftLabel = asset1?.label ?? 'Thing A';
    const rightLabel = asset2?.label ?? 'Thing B';
    return {
        baseScore,
        breakdown,
        score: baseScore,
        relevance,
        commentary: `An interesting bridge between ${leftLabel} and ${rightLabel}. '${submission || ''}' is ${relevance.toLowerCase()}!`,
    };
}

export async function scoreSubmission(submission, asset1, asset2, mediaType = 'image') {
    // Try server-side scoring first (anti-cheat)
    try {
        const serverResult = await scoreViaServer(
            submission, asset1?.label, asset2?.label
        );
        if (serverResult?.score != null) {
            return { ...serverResult, scoredServerSide: true };
        }
    } catch {
        // Server scoring unavailable, fall through to client-side
    }

    if (!ai || !submission || !asset1 || !asset2) {
        await new Promise((r) => setTimeout(r, TIMINGS.MOCK_AI_DELAY));
        return applyDifficulty({ ...mockScore(submission, asset1, asset2), isMock: true, scoredServerSide: false });
    }

    if (!scoringLimiter.canProceed()) {
        console.warn('Rate limited — falling back to mock scoring');
        await new Promise((r) => setTimeout(r, 500));
        return applyDifficulty({ ...mockScore(submission, asset1, asset2), isMock: true, errorReason: 'Rate limited — please wait a few seconds' });
    }

    const mediaLabel = mediaType === 'video' ? 'video clip' : mediaType === 'audio' ? 'audio clip' : 'image';

    try {
        const prompt = SCORING_PROMPT.replace(/\{\{left\}\}/g, asset1.label)
            .replace(/\{\{right\}\}/g, asset2.label)
            .replace(/\{\{submission\}\}/g, submission.replace(/"/g, '\\"'))
            .replace(/\{\{mediaType\}\}/g, mediaLabel);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response?.text?.trim();
        if (!text) throw new Error('Empty response');

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        if (!parsed || typeof parsed.wit !== 'number') throw new Error('Invalid format');

        const baseScore = Math.round(
            (parsed.wit + parsed.logic + parsed.originality + parsed.clarity) / 4
        );
        return applyDifficulty({
            baseScore: Math.min(10, Math.max(1, baseScore)),
            breakdown: {
                wit: Math.min(10, Math.max(1, parsed.wit)),
                logic: Math.min(10, Math.max(1, parsed.logic)),
                originality: Math.min(10, Math.max(1, parsed.originality)),
                clarity: Math.min(10, Math.max(1, parsed.clarity)),
            },
            score: Math.min(10, Math.max(1, baseScore)),
            relevance: parsed.relevance || 'Highly Logical',
            commentary: parsed.commentary || `Solid connection between ${asset1.label} and ${asset2.label}!`,
            isMock: false,
            scoredServerSide: false,
        });
    } catch (err) {
        console.warn('Gemini scoring failed, using mock:', err);
        if (!navigator.onLine) {
            addToOfflineQueue({ submission, assets: { left: asset1, right: asset2 }, mediaType });
        }
        await new Promise((r) => setTimeout(r, TIMINGS.PHASE_TRANSITION));
        return applyDifficulty({ ...mockScore(submission, asset1, asset2), isMock: true, scoredServerSide: false, errorReason: 'AI scoring unavailable — using mock scores' });
    }
}

export async function generateFusionImage(theme, submission) {
    if (!ai || !API_KEY) {
        await new Promise((r) => setTimeout(r, TIMINGS.MOCK_AI_DELAY));
        return { ...getFusionImage(theme), isFallback: true };
    }

    try {
        const prompt = submission
            ? `Abstract artistic fusion image visualizing the concept: "${submission}". Surreal, dreamlike, colorful.`
            : `Abstract surreal art, colorful dreamscape, fluid shapes.`;

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: { numberOfImages: 1 },
        });

        const image = response?.generatedImages?.[0];
        const base64 = image?.image?.imageBytes ?? image?.imageBytes;
        const mime = image?.image?.mimeType || 'image/png';

        if (base64) {
            return {
                id: `fusion-${Date.now()}`,
                label: 'AI Fusion',
                url: `data:${mime};base64,${base64}`,
                fallbackUrl: getFusionImage(theme)?.url,
                isFallback: false,
            };
        }
    } catch (err) {
        console.warn('Gemini image gen failed, using curated:', err);
    }

    await new Promise((r) => setTimeout(r, TIMINGS.COUNTDOWN_ANIM));
    return { ...getFusionImage(theme), isFallback: true, errorReason: 'AI image generation failed — using curated image' };
}

import { GoogleGenAI } from '@google/genai';
import { getFusionImage } from '../data/themes';
import { scoreViaServer } from './serverScoring';
import { uploadDataUrl } from './mediaStorage';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SCORING_PROMPT = `You are a witty judge for a game where players connect two concepts using a creative phrase.

Given:
- Left concept ({{leftMedia}}): {{left}}
- Right concept ({{rightMedia}}): {{right}}
- Player's connecting phrase: "{{submission}}"

Score the connection from 1-10 on four criteria (each 1-10):
- wit: Cleverness and humor
- logic: How well it actually connects the two concepts
- originality: Surprise and freshness
- clarity: How clear and understandable the connection is

Respond with ONLY valid JSON, no other text:
{"wit": N, "logic": N, "originality": N, "clarity": N, "relevance": "Highly Logical" or "Absurdly Creative" or "Wild Card", "commentary": "One witty sentence"}`;

function buildFusionPrompt(theme, submission, asset1, asset2) {
    const themeLabel = theme?.label || 'Venn with Friends';
    const themeKeywords = Array.isArray(theme?.keywords) && theme.keywords.length
        ? theme.keywords.slice(0, 4).join(', ')
        : 'bold color, surreal composition, social-first poster energy';
    const leftLabel = getAssetLabel(asset1, 'left concept');
    const rightLabel = getAssetLabel(asset2, 'right concept');
    const conceptLine = submission
        ? `Visualize the phrase "${submission}" as a clever collision between "${leftLabel}" and "${rightLabel}".`
        : `Create a clever visual collision between "${leftLabel}" and "${rightLabel}".`;

    return [
        `Create an instantly shareable hero image for a party game called Venn with Friends.`,
        `Theme: ${themeLabel}. Reference mood: ${themeKeywords}.`,
        conceptLine,
        `The image should feel viral, witty, and poster-worthy rather than generic abstract art.`,
        `Use one bold focal idea, striking contrast, crisp silhouette readability, playful surrealism, premium lighting, and composition that looks great as a social post.`,
        `Avoid text, watermarks, logos, UI, split-screen layouts, stock-photo realism, muddy detail, or bland wallpaper aesthetics.`,
        `Aim for something surprising enough that a friend would screenshot and repost it.`
    ].join(' ');
}

function getAssetLabel(asset, fallbackLabel) {
    if (typeof asset === 'string' && asset.trim()) return asset.trim();
    return asset?.label || asset?.title || asset?.name || fallbackLabel;
}

function hasScorableAsset(asset) {
    return getAssetLabel(asset, '').trim().length > 0;
}

function getFallbackReason(submission, asset1, asset2) {
    if (!submission) return 'Missing submission - using mock scores';
    if (!hasScorableAsset(asset1) || !hasScorableAsset(asset2)) {
        return 'Missing prompt assets - using mock scores';
    }
    if (!ai) return 'AI scoring unavailable - using mock scores';
    return null;
}

function mockScore(submission, asset1, asset2) {
    const leftLabel = getAssetLabel(asset1, 'the first concept');
    const rightLabel = getAssetLabel(asset2, 'the second concept');
    const safeSubmission = submission || 'your connection';
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
    return {
        baseScore,
        breakdown,
        score: baseScore,
        relevance,
        commentary: `An interesting bridge between ${leftLabel} and ${rightLabel}. '${safeSubmission}' is ${relevance.toLowerCase()}!`,
    };
}

function getMediaDescriptor(asset, mediaType = 'image') {
    const type = asset?.type || mediaType;
    if (type === 'video') return 'video clip';
    if (type === 'meme') return 'meme';
    if (type === 'audio') return 'audio clip';
    return 'image';
}

export async function scoreSubmission(submission, asset1, asset2, mediaType = 'image') {
    const fallbackReason = getFallbackReason(submission, asset1, asset2);

    if (!fallbackReason) {
        const serverScore = await scoreViaServer(submission, asset1, asset2);
        if (serverScore) {
            return {
                ...serverScore,
                isMock: false,
                isServerScored: true,
            };
        }
    }

    if (fallbackReason) {
        await new Promise((r) => setTimeout(r, 1500));
        return { ...mockScore(submission, asset1, asset2), isMock: true, errorReason: fallbackReason };
    }

    const leftMedia = getMediaDescriptor(asset1, mediaType);
    const rightMedia = getMediaDescriptor(asset2, mediaType);
    const leftLabel = getAssetLabel(asset1, 'left concept');
    const rightLabel = getAssetLabel(asset2, 'right concept');

    try {
        const prompt = SCORING_PROMPT.replace(/\{\{left\}\}/g, leftLabel)
            .replace(/\{\{right\}\}/g, rightLabel)
            .replace(/\{\{submission\}\}/g, submission.replace(/"/g, '\\"'))
            .replace(/\{\{leftMedia\}\}/g, leftMedia)
            .replace(/\{\{rightMedia\}\}/g, rightMedia);

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
        return {
            baseScore: Math.min(10, Math.max(1, baseScore)),
            breakdown: {
                wit: Math.min(10, Math.max(1, parsed.wit)),
                logic: Math.min(10, Math.max(1, parsed.logic)),
                originality: Math.min(10, Math.max(1, parsed.originality)),
                clarity: Math.min(10, Math.max(1, parsed.clarity)),
            },
            score: Math.min(10, Math.max(1, baseScore)),
            relevance: parsed.relevance || 'Highly Logical',
            commentary: parsed.commentary || `Solid connection between ${leftLabel} and ${rightLabel}!`,
            isMock: false,
        };
    } catch (err) {
        console.warn('Gemini scoring failed, using mock:', err);
        await new Promise((r) => setTimeout(r, 500));
        return { ...mockScore(submission, asset1, asset2), isMock: true, errorReason: 'AI scoring unavailable - using mock scores' };
    }
}

export async function generateFusionImage(theme, submission, asset1 = null, asset2 = null) {
    if (!ai || !API_KEY) {
        await new Promise((r) => setTimeout(r, 1500));
        return { ...getFusionImage(theme), isFallback: true };
    }

    try {
        const prompt = buildFusionPrompt(theme, submission, asset1, asset2);

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: { numberOfImages: 1 },
        });

        const image = response?.generatedImages?.[0];
        const base64 = image?.image?.imageBytes ?? image?.imageBytes;
        const mime = image?.image?.mimeType || 'image/png';

        if (base64) {
            const dataUrl = `data:${mime};base64,${base64}`;
            const uploaded = await uploadDataUrl(dataUrl, {
                folder: 'fusion',
                filename: `fusion-${Date.now()}.png`,
            });

            return {
                id: `fusion-${Date.now()}`,
                label: 'AI Fusion',
                url: uploaded?.url || dataUrl,
                storagePath: uploaded?.storagePath || null,
                fallbackUrl: getFusionImage(theme)?.url,
                isFallback: false,
            };
        }
    } catch (err) {
        console.warn('Gemini image gen failed, using curated:', err);
    }

    await new Promise((r) => setTimeout(r, 800));
    return { ...getFusionImage(theme), isFallback: true, errorReason: 'AI image generation failed - using curated image' };
}

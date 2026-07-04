import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildCorsHeaders,
  getRateLimitKey,
  isRateLimited,
  jsonResponse,
  LIMITS,
  sanitizeText,
} from "../_shared/edgeSecurity.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

const DIFFICULTY_CONFIGS: Record<string, { scoringStrictness: number }> = {
  easy: { scoringStrictness: 1.3 },
  normal: { scoringStrictness: 1.0 },
  hard: { scoringStrictness: 0.7 },
};

const SCORING_PROMPT = `You are a witty judge for a game where players connect two concepts using a creative phrase.

Given:
- Left concept: {{left}}
- Right concept: {{right}}
- Player's connecting phrase: "{{submission}}"

Score the connection from 1-10 on four criteria (each 1-10):
- wit: Cleverness and humor
- logic: How well it actually connects the two concepts
- originality: Surprise and freshness
- clarity: How clear and understandable the connection is

Respond with ONLY valid JSON, no other text:
{"wit": N, "logic": N, "originality": N, "clarity": N, "relevance": "Highly Logical" or "Absurdly Creative" or "Wild Card", "commentary": "One witty sentence"}`;

function clamp(val: number, min = 1, max = 10): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

function applyDifficulty(
  breakdown: Record<string, number>,
  difficulty: string,
): Record<string, number> {
  const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;
  const strictness = config.scoringStrictness;
  if (strictness === 1.0) return breakdown;
  return {
    wit: clamp(breakdown.wit * strictness),
    logic: clamp(breakdown.logic * strictness),
    originality: clamp(breakdown.originality * strictness),
    clarity: clamp(breakdown.clarity * strictness),
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const rateLimitKey = getRateLimitKey(req);
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(req, { error: "Rate limit exceeded. Max 12 submissions per hour." }, 429);
  }

  let body: {
    conceptLeft?: string;
    conceptRight?: string;
    submission?: string;
    difficulty?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, 400);
  }

  const conceptLeft = sanitizeText(body.conceptLeft, LIMITS.concept);
  const conceptRight = sanitizeText(body.conceptRight, LIMITS.concept);
  const submission = sanitizeText(body.submission, LIMITS.submission);
  const difficulty = sanitizeText(body.difficulty || "normal", 20) || "normal";

  if (!conceptLeft || !conceptRight || !submission) {
    return jsonResponse(req, {
      error: "Missing required fields: conceptLeft, conceptRight, submission",
    }, 400);
  }

  if (!GEMINI_API_KEY) {
    return jsonResponse(req, { error: "Server scoring unavailable: missing API key" }, 503);
  }

  const prompt = SCORING_PROMPT
    .replace(/\{\{left\}\}/g, conceptLeft)
    .replace(/\{\{right\}\}/g, conceptRight)
    .replace(/\{\{submission\}\}/g, submission.replace(/"/g, '\\"'));

  try {
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API returned ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed || typeof parsed.wit !== "number") {
      throw new Error("Invalid Gemini response format");
    }

    const rawBreakdown = {
      wit: clamp(parsed.wit),
      logic: clamp(parsed.logic),
      originality: clamp(parsed.originality),
      clarity: clamp(parsed.clarity),
    };

    const breakdown = applyDifficulty(rawBreakdown, difficulty);
    const score = clamp(
      Math.round(
        (breakdown.wit + breakdown.logic + breakdown.originality + breakdown.clarity) / 4,
      ),
    );

    return jsonResponse(req, {
      score,
      breakdown,
      baseScore: score,
      relevance: parsed.relevance || "Highly Logical",
      commentary:
        parsed.commentary ||
        `Solid connection between ${conceptLeft} and ${conceptRight}!`,
      roundId: crypto.randomUUID(),
      isMock: false,
    });
  } catch (err) {
    console.error("Gemini scoring failed:", err);
    return jsonResponse(req, { error: "Scoring failed" }, 502);
  }
});

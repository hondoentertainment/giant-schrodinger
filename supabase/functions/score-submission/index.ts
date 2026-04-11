import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ||
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

// Input length caps (defense-in-depth against prompt-injection bloat and cost spikes)
const MAX_SUBMISSION_LEN = 500;
const MAX_CONCEPT_LEN = 200;

// Simple in-memory rate limiter: key -> timestamp[]
// Two independent windows:
//   - per-user (authHeader prefix or anonymous) — coarse abuse control
//   - per-IP   (x-forwarded-for)                 — per task spec: max 30 / min
// Memory only; resets on cold start. Good enough for a single-function instance.
const userRateMap = new Map<string, number[]>();
const ipRateMap = new Map<string, number[]>();

const USER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const USER_MAX = 12;
const IP_WINDOW_MS = 60 * 1000; // 1 minute
const IP_MAX = 30;

function hitWindow(
  map: Map<string, number[]>,
  key: string,
  windowMs: number,
  max: number
): boolean {
  const now = Date.now();
  const timestamps = map.get(key) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    map.set(key, recent);
    return true;
  }
  recent.push(now);
  map.set(key, recent);
  return false;
}

function isUserRateLimited(userId: string): boolean {
  return hitWindow(userRateMap, userId, USER_WINDOW_MS, USER_MAX);
}

function isIpRateLimited(ip: string): boolean {
  return hitWindow(ipRateMap, ip, IP_WINDOW_MS, IP_MAX);
}

function clamp(val: number, min = 1, max = 10): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

function applyDifficulty(
  breakdown: Record<string, number>,
  difficulty: string
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Identify caller by (1) auth header prefix for per-user limits, (2) forwarded IP for per-IP limits
  const authHeader = req.headers.get("authorization") || "";
  const userId = authHeader.slice(0, 64) || "anonymous";
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";

  if (isIpRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 30 requests per IP per minute." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (isUserRateLimited(userId)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 12 submissions per hour." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const { conceptLeft, conceptRight, submission, difficulty = "normal" } = body;

  if (
    typeof conceptLeft !== "string" ||
    typeof conceptRight !== "string" ||
    typeof submission !== "string" ||
    !conceptLeft.trim() ||
    !conceptRight.trim() ||
    !submission.trim()
  ) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: conceptLeft, conceptRight, submission",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (
    submission.length > MAX_SUBMISSION_LEN ||
    conceptLeft.length > MAX_CONCEPT_LEN ||
    conceptRight.length > MAX_CONCEPT_LEN
  ) {
    return new Response(
      JSON.stringify({
        error: `Input too long (submission ≤ ${MAX_SUBMISSION_LEN}, concept ≤ ${MAX_CONCEPT_LEN})`,
      }),
      {
        status: 413,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server scoring unavailable: missing API key" }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
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
        (breakdown.wit + breakdown.logic + breakdown.originality + breakdown.clarity) / 4
      )
    );

    const roundId = crypto.randomUUID();

    return new Response(
      JSON.stringify({
        score,
        breakdown,
        baseScore: score,
        relevance: parsed.relevance || "Highly Logical",
        commentary:
          parsed.commentary ||
          `Solid connection between ${conceptLeft} and ${conceptRight}!`,
        roundId,
        isMock: false,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Gemini scoring failed:", err);
    return new Response(
      JSON.stringify({ error: "Scoring failed", details: String(err) }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildCorsHeaders,
  getRateLimitKey,
  isRateLimited,
  jsonResponse,
  LIMITS,
  sanitizeText,
} from "../_shared/edgeSecurity.ts";

const GIPHY_API_KEY = Deno.env.get("GIPHY_API_KEY");
const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_TRENDING_URL = "https://api.giphy.com/v1/gifs/trending";
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 120;

type MemeQueryInput = string | { query?: string; fallbackUrl?: string; random?: boolean };

function normalizeQueryInput(input: MemeQueryInput): {
  query: string;
  fallbackUrl: string | null;
  random: boolean;
} {
  if (typeof input === "string") {
    return {
      query: sanitizeText(input, LIMITS.concept),
      fallbackUrl: null,
      random: false,
    };
  }

  return {
    query: sanitizeText(input?.query, LIMITS.concept),
    fallbackUrl: input?.fallbackUrl ? sanitizeText(input.fallbackUrl, 500) : null,
    random: Boolean(input?.random),
  };
}

function buildMemeSearchTerm(query: string): string {
  const trimmed = query.slice(0, LIMITS.concept).trim();
  if (!trimmed) return "reaction meme";
  if (/\bmeme\b/i.test(trimmed)) return trimmed;
  return `${trimmed} meme`;
}

function pickGifUrl(gif: {
  images?: {
    downsized?: { url?: string };
    fixed_height?: { url?: string };
    original?: { url?: string };
  };
}): string | null {
  return (
    gif?.images?.downsized?.url ||
    gif?.images?.fixed_height?.url ||
    gif?.images?.original?.url ||
    null
  );
}

function buildStaticResult(query: string, fallbackUrl: string | null) {
  return {
    url: fallbackUrl,
    fallbackUrl,
    source: "static",
    attribution: null,
    title: query || null,
  };
}

async function fetchGiphyResults(searchTerm: string, random = false): Promise<unknown[]> {
  if (!GIPHY_API_KEY) return [];

  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    limit: random ? "12" : "1",
    rating: "pg-13",
  });

  if (random) {
    const response = await fetch(`${GIPHY_TRENDING_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Giphy trending API returned ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
  }

  params.set("q", searchTerm);
  const response = await fetch(`${GIPHY_SEARCH_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Giphy search API returned ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
}

async function resolveMemeQuery(input: MemeQueryInput) {
  const { query, fallbackUrl, random } = normalizeQueryInput(input);
  const searchTerm = buildMemeSearchTerm(query || "reaction");

  if (!GIPHY_API_KEY) {
    return buildStaticResult(searchTerm, fallbackUrl);
  }

  try {
    const results = await fetchGiphyResults(searchTerm, random);
    const gif = random && results.length > 0
      ? results[Math.floor(Math.random() * results.length)]
      : results[0];
    const url = pickGifUrl(gif as Parameters<typeof pickGifUrl>[0]);

    if (!url) {
      return buildStaticResult(searchTerm, fallbackUrl);
    }

    return {
      url,
      fallbackUrl: fallbackUrl || url,
      source: "giphy",
      attribution: (gif as { user?: { display_name?: string } })?.user?.display_name || "Giphy",
      title: (gif as { title?: string })?.title || query || null,
    };
  } catch {
    return buildStaticResult(searchTerm, fallbackUrl);
  }
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
    return jsonResponse(req, { error: "Rate limit exceeded. Max 120 meme lookups per hour." }, 429);
  }

  let body: {
    query?: string;
    fallbackUrl?: string;
    random?: boolean;
    queries?: MemeQueryInput[];
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, 400);
  }

  if (Array.isArray(body.queries) && body.queries.length > 0) {
    const queries = body.queries.slice(0, 10);
    const results: Record<string, unknown> = {};

    for (const queryInput of queries) {
      const { query } = normalizeQueryInput(queryInput);
      const key = query || JSON.stringify(queryInput);
      results[key] = await resolveMemeQuery(queryInput);
    }

    return jsonResponse(req, { results });
  }

  const query = sanitizeText(body.query, LIMITS.concept);
  if (!query && !body.random) {
    return jsonResponse(req, { error: "Missing query or queries" }, 400);
  }

  const resolved = await resolveMemeQuery({
    query: query || "reaction",
    fallbackUrl: body.fallbackUrl ? sanitizeText(body.fallbackUrl, 500) : null,
    random: Boolean(body.random),
  });

  return jsonResponse(req, resolved);
});

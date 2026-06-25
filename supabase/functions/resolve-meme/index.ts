import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GIPHY_API_KEY = Deno.env.get("GIPHY_API_KEY");
const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_TRENDING_URL = "https://api.giphy.com/v1/gifs/trending";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 120;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(userId, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

type MemeQueryInput = string | { query?: string; fallbackUrl?: string; random?: boolean };

function normalizeQueryInput(input: MemeQueryInput): {
  query: string;
  fallbackUrl: string | null;
  random: boolean;
} {
  if (typeof input === "string") {
    return {
      query: input.trim(),
      fallbackUrl: null,
      random: false,
    };
  }

  return {
    query: String(input?.query || "").trim(),
    fallbackUrl: input?.fallbackUrl ? String(input.fallbackUrl) : null,
    random: Boolean(input?.random),
  };
}

function buildMemeSearchTerm(query: string): string {
  const trimmed = query.slice(0, 120).trim();
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
    const url = pickGifUrl(gif);

    if (!url) {
      return buildStaticResult(searchTerm, fallbackUrl);
    }

    return {
      url,
      fallbackUrl: fallbackUrl || url,
      source: "giphy",
      attribution: gif?.user?.display_name || "Giphy",
      title: gif?.title || query || null,
    };
  } catch {
    return buildStaticResult(searchTerm, fallbackUrl);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const authHeader = req.headers.get("authorization") || "";
  const userId = authHeader.slice(0, 64) || "anonymous";

  if (isRateLimited(userId)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 120 meme lookups per hour." }),
      { status: 429, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  if (Array.isArray(body.queries) && body.queries.length > 0) {
    const queries = body.queries.slice(0, 10);
    const results: Record<string, unknown> = {};

    for (const queryInput of queries) {
      const { query } = normalizeQueryInput(queryInput);
      const key = query || JSON.stringify(queryInput);
      results[key] = await resolveMemeQuery(queryInput);
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const query = String(body.query || "").trim();
  if (!query && !body.random) {
    return new Response(JSON.stringify({ error: "Missing query or queries" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const resolved = await resolveMemeQuery({
    query: query || "reaction",
    fallbackUrl: body.fallbackUrl ? String(body.fallbackUrl) : null,
    random: Boolean(body.random),
  });

  return new Response(JSON.stringify(resolved), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

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

function buildPicsumFallback(query: string): string {
  const slug = String(query || "placeholder")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://picsum.photos/seed/${slug || "venn"}/1080/1080`;
}

function pickPhotoUrl(photo: {
  src?: { large2x?: string; large?: string; medium?: string; original?: string };
}): string | null {
  return (
    photo?.src?.large2x ||
    photo?.src?.large ||
    photo?.src?.medium ||
    photo?.src?.original ||
    null
  );
}

async function searchPexels(query: string, orientation = "squarish"): Promise<{
  url: string | null;
  photographer: string | null;
}> {
  if (!PEXELS_API_KEY) {
    return { url: null, photographer: null };
  }

  const params = new URLSearchParams({
    query: query.slice(0, 120),
    per_page: "1",
    orientation,
  });

  const response = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!response.ok) {
    throw new Error(`Pexels API returned ${response.status}`);
  }

  const data = await response.json();
  const photo = data?.photos?.[0];
  return {
    url: pickPhotoUrl(photo),
    photographer: photo?.photographer || null,
  };
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
      JSON.stringify({ error: "Rate limit exceeded. Max 120 image lookups per hour." }),
      { status: 429, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  let body: { query?: string; queries?: string[]; orientation?: string };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const orientation = body.orientation || "squarish";

  if (Array.isArray(body.queries) && body.queries.length > 0) {
    const queries = body.queries
      .map((q) => String(q || "").trim())
      .filter(Boolean)
      .slice(0, 10);

    const results: Record<string, unknown> = {};

    for (const query of queries) {
      try {
        const { url, photographer } = await searchPexels(query, orientation);
        const fallbackUrl = buildPicsumFallback(query);
        results[query] = {
          url: url || fallbackUrl,
          fallbackUrl,
          photographer,
          source: url ? "pexels" : "picsum",
        };
      } catch {
        results[query] = {
          url: buildPicsumFallback(query),
          fallbackUrl: buildPicsumFallback(query),
          photographer: null,
          source: "picsum",
        };
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const query = String(body.query || "").trim();
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query or queries" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const { url, photographer } = await searchPexels(query, orientation);
    const fallbackUrl = buildPicsumFallback(query);

    return new Response(
      JSON.stringify({
        url: url || fallbackUrl,
        fallbackUrl,
        photographer,
        source: url ? "pexels" : "picsum",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  } catch (err) {
    console.error("resolve-image failed:", err);
    const fallbackUrl = buildPicsumFallback(query);
    return new Response(
      JSON.stringify({
        url: fallbackUrl,
        fallbackUrl,
        photographer: null,
        source: "picsum",
        error: "Image lookup failed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
});

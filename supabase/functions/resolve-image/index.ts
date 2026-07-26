import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildCorsHeaders,
  getRateLimitKey,
  isRateLimited,
  jsonResponse,
  LIMITS,
  sanitizeText,
} from "../_shared/edgeSecurity.ts";

const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 120;

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
    query: query.slice(0, LIMITS.concept),
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
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const rateLimitKey = getRateLimitKey(req);
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(req, { error: "Rate limit exceeded. Max 120 image lookups per hour." }, 429);
  }

  let body: { query?: string; queries?: string[]; orientation?: string };

  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, 400);
  }

  const orientation = sanitizeText(body.orientation || "squarish", 20) || "squarish";

  if (Array.isArray(body.queries) && body.queries.length > 0) {
    const queries = body.queries
      .map((q) => sanitizeText(q, LIMITS.concept))
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

    return jsonResponse(req, { results });
  }

  const query = sanitizeText(body.query, LIMITS.concept);
  if (!query) {
    return jsonResponse(req, { error: "Missing query or queries" }, 400);
  }

  try {
    const { url, photographer } = await searchPexels(query, orientation);
    const fallbackUrl = buildPicsumFallback(query);

    return jsonResponse(req, {
      url: url || fallbackUrl,
      fallbackUrl,
      photographer,
      source: url ? "pexels" : "picsum",
    });
  } catch (err) {
    console.error("resolve-image failed:", err);
    const fallbackUrl = buildPicsumFallback(query);
    return jsonResponse(req, {
      url: fallbackUrl,
      fallbackUrl,
      photographer: null,
      source: "picsum",
      error: "Image lookup failed",
    });
  }
});

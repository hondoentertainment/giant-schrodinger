// Serves dynamic Open Graph meta tags for shared rounds.
// Crawlers (Twitter, Discord, Slack, Facebook) hit this endpoint and
// receive an HTML shell with round-specific og:title / og:description /
// og:image. Real users get an immediate meta-refresh redirect to the SPA.
//
// Invoke: GET /functions/v1/og-tags?roundId=<uuid>
//         GET /functions/v1/og-tags?challengeId=<uuid>

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL =
  Deno.env.get("APP_URL") || "https://hondoentertainment.github.io/giant-schrodinger/";
const DEFAULT_IMAGE =
  Deno.env.get("DEFAULT_OG_IMAGE") ||
  "https://hondoentertainment.github.io/giant-schrodinger/og-image.svg";

// Cache Supabase client between invocations (warm starts only).
let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

// Minimal HTML-escape for user-provided strings going into meta content.
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

type OgData = {
  title: string;
  description: string;
  image: string;
  redirectTo: string;
};

async function fetchRoundOg(roundId: string): Promise<OgData | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("shared_rounds")
    .select("id, assets, submission, image_url")
    .eq("id", roundId)
    .maybeSingle();

  if (error || !data) return null;

  const assets = (data.assets ?? {}) as {
    left?: { label?: string };
    right?: { label?: string };
  };
  const left = assets.left?.label || "Concept A";
  const right = assets.right?.label || "Concept B";
  const submission = (data.submission as string) || "";

  return {
    title: truncate(`${left} \u00D7 ${right} \u2014 Venn with Friends`, 110),
    description: truncate(
      submission
        ? `"${submission}" \u2014 can you beat it?`
        : `Connect ${left} and ${right}. Challenge accepted?`,
      200
    ),
    image: (data.image_url as string) || DEFAULT_IMAGE,
    redirectTo: `${APP_URL}#round=${encodeURIComponent(roundId)}`,
  };
}

async function fetchChallengeOg(challengeId: string): Promise<OgData | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("challenges")
    .select("id, round_id, rounds(concept_left, concept_right, submission, final_score)")
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !data) return null;

  // Supabase returns the embedded row as an object when the FK is 1:1.
  const round = Array.isArray((data as Record<string, unknown>).rounds)
    ? ((data as Record<string, unknown>).rounds as Array<Record<string, unknown>>)[0]
    : ((data as Record<string, unknown>).rounds as Record<string, unknown> | null);
  if (!round) return null;

  const left = (round.concept_left as string) || "Concept A";
  const right = (round.concept_right as string) || "Concept B";
  const submission = (round.submission as string) || "";
  const score = round.final_score != null ? Number(round.final_score) : null;

  return {
    title: truncate(
      score != null
        ? `I scored ${score}/10 connecting ${left} and ${right} \u2014 beat me?`
        : `${left} \u00D7 ${right} \u2014 Challenge accepted?`,
      110
    ),
    description: truncate(
      submission ? `"${submission}" \u2014 can you beat it?` : "Venn with Friends challenge",
      200
    ),
    image: DEFAULT_IMAGE,
    redirectTo: `${APP_URL}#challenge=${encodeURIComponent(challengeId)}`,
  };
}

function defaultOg(): OgData {
  return {
    title: "Venn with Friends \u2014 Can You Beat My Score?",
    description:
      "Connect two random concepts with one witty phrase. Challenge your friends!",
    image: DEFAULT_IMAGE,
    redirectTo: APP_URL,
  };
}

function renderHtml(og: OgData): string {
  const title = escapeHtml(og.title);
  const description = escapeHtml(og.description);
  const image = escapeHtml(og.image);
  const redirect = escapeHtml(og.redirectTo);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${redirect}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${redirect}" />
  <link rel="canonical" href="${redirect}" />
</head>
<body>
  <p>Redirecting to <a href="${redirect}">Venn with Friends</a>\u2026</p>
</body>
</html>`;
}

serve(async (req: Request) => {
  // CORS preflight (crawlers don't preflight, but browsers might during debugging).
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const roundId = url.searchParams.get("roundId");
  const challengeId = url.searchParams.get("challengeId");

  let og: OgData | null = null;
  try {
    if (roundId) {
      og = await fetchRoundOg(roundId);
    } else if (challengeId) {
      og = await fetchChallengeOg(challengeId);
    }
  } catch (err) {
    console.error("og-tags fetch failed:", err);
  }

  const finalOg = og || defaultOg();
  const html = renderHtml(finalOg);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // 5 minute CDN cache, 1 hour stale-while-revalidate.
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

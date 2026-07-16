// Serves dynamic Open Graph meta tags for shared judge/challenge links.
// e.g. /og-tags?roundId=abc123 returns HTML with custom OG tags

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const DEFAULT_APP_URL = Deno.env.get('APP_URL') || 'https://giant-schrodinger.vercel.app';
const DEFAULT_IMAGE = `${DEFAULT_APP_URL.replace(/\/$/, '')}/og-image.svg`;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function fetchSharedRound(publicToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !publicToken) return null;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_round_by_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_public_token: publicToken }),
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return payload || null;
}

function buildRoundTitle(round: Record<string, unknown>) {
  const submission = String(round.submission || 'a clever connection');
  const score = round.score ?? round.finalScore;
  const left = (round.assets as { left?: { label?: string } })?.left?.label;
  const right = (round.assets as { right?: { label?: string } })?.right?.label;
  if (left && right && score) {
    return `I scored ${score}/10 connecting ${left} and ${right}!`;
  }
  return `"${submission}" — can you beat my Venn score?`;
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const roundId = url.searchParams.get('roundId')?.trim() || '';
  const challengeId = url.searchParams.get('challengeId')?.trim() || '';

  let title = 'Venn with Friends — Can You Beat My Score?';
  let description = 'Connect two random concepts with one witty phrase. Challenge your friends!';
  let image = DEFAULT_IMAGE;
  let redirectTarget = DEFAULT_APP_URL;

  if (roundId) {
    const round = await fetchSharedRound(roundId);
    if (round) {
      title = buildRoundTitle(round);
      description = String(round.submission || description);
      image = String(round.imageUrl || round.image_url || DEFAULT_IMAGE);
      redirectTarget = `${DEFAULT_APP_URL.replace(/\/$/, '')}/?judge=${encodeURIComponent(roundId)}`;
    } else {
      redirectTarget = `${DEFAULT_APP_URL.replace(/\/$/, '')}/?judge=${encodeURIComponent(roundId)}`;
    }
  }

  if (challengeId) {
    title = 'Can you beat my Daily Venn score?';
    description = 'Accept the challenge and connect two prompts with one phrase.';
    redirectTarget = `${DEFAULT_APP_URL.replace(/\/$/, '')}/?challenge=${encodeURIComponent(challengeId)}`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(redirectTarget)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(title)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectTarget)}" />
  <title>${escapeHtml(title)}</title>
</head>
<body>Redirecting to Venn with Friends…</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=300',
    },
  });
});

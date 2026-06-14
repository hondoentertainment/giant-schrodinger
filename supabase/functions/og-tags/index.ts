// Serves dynamic Open Graph meta tags for shared links
// e.g., /og-tags?roundId=abc123 returns HTML with custom OG tags

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const roundId = url.searchParams.get('roundId');
  const challengeId = url.searchParams.get('challengeId');

  // Default OG data
  let title = 'Venn with Friends — Can You Beat My Score?';
  let description = 'Connect two random concepts with one witty phrase. Challenge your friends!';
  let image = 'https://hondoentertainment.github.io/giant-schrodinger/og-image.svg';

  if (roundId) {
    // Fetch round data from Supabase
    // Customize title: "I scored 8.5/10 connecting Pizza and Quantum Physics!"
    // Customize description with the actual submission
  }

  if (challengeId) {
    // Fetch challenge data
    // "Can you beat my 8.5? Challenge accepted!"
  }

  // Return HTML page with OG tags that redirects to the app
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=https://hondoentertainment.github.io/giant-schrodinger/#round=${roundId || ''}" />
</head>
<body>Redirecting...</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
});

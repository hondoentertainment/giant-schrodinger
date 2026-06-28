#!/usr/bin/env node
/**
 * Prints Supabase edge function deploy commands for hosted rehearsal.
 */
console.log(`
Supabase edge function deploy (run from giant-schrodinger/)

Prerequisites:
  npm i -g supabase
  supabase login
  supabase link --project-ref YOUR_PROJECT_REF

Set secrets (once per project):
  supabase secrets set PEXELS_API_KEY=... GIPHY_API_KEY=... GEMINI_API_KEY=...
  supabase secrets set APP_URL=https://giant-schrodinger.vercel.app

Deploy functions:
  supabase functions deploy resolve-image
  supabase functions deploy resolve-meme
  supabase functions deploy score-submission
  supabase functions deploy og-tags

Verify:
  npm run check:supabase-rpcs
  npm run rehearsal:preflight:fast
`);

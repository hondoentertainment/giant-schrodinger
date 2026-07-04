# Production Test Report

Report date: July 4, 2026

Repository: https://github.com/hondoentertainment/giant-schrodinger

Production URL: https://giant-schrodinger.vercel.app

Latest smoke-passed app commit: `446a30e feat(prod): harden security, moderation, PWA, and server-only AI scoring`

## Deployment Status

- Vercel deployment: production alias live
- Production alias: https://giant-schrodinger.vercel.app
- GitHub `main`: synced at `446a30e`

## Automated Verification (July 4, 2026)

- `npm run verify:release`: passed (688 unit tests, 32 E2E, build)
- `npm run smoke:production`: passed against https://giant-schrodinger.vercel.app
- `PRODUCTION_URL=https://giant-schrodinger.vercel.app npm run test:e2e:rehearsal`: 3/3 passed
- Production build on Vercel: passed (CSP/security headers active via `vercel.json`)

## Shipped in 446a30e

- Server-only Gemini scoring gate when Supabase is configured
- Vercel CSP + security headers; hidden source maps
- Edge function CORS allowlists + input sanitization
- Content moderation RPCs + gallery report button
- PWA manifest per-host build; SW v2 + offline page
- Privacy/Terms pages; production-smoke CI workflow

## Remaining Hosted Rehearsal (requires your credentials)

Run `npm run launch:gate` for all automated checks, then complete manual steps:

1. Apply `supabase/schema.sql` (includes `content_reports` + moderation RPCs).
2. Set Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Deploy edge functions + secrets — see `.github/SECRETS.template.md`.
4. Optional: `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY` after telemetry validation.
5. Two-browser checks — `PRODUCTION_REHEARSAL.md` §4–6:
   - Friend judging link → second browser → gallery feedback
   - Multiplayer manual vote → same winner on both browsers
   - Disconnect/reconnect + late join during results

## Known Live Limitations

| Area | Status | Notes |
|------|--------|-------|
| Supabase schema + RPCs | **Blocked — no local creds** | `rehearsal:status` shows missing `VITE_SUPABASE_*` |
| Friend judging persistence | Requires live Supabase | Cross-browser judgement needs backend env vars |
| Multiplayer vote authority | Requires live Supabase | Two-browser finalize is the launch gate |
| Server AI scoring | Requires edge function | `score-submission` + `GEMINI_API_KEY` secret |
| OG link previews | Requires `og-tags` + secrets | `APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Ranked / shop / tournaments | Local preview only | Device-local until cloud sync |
| Observability | Optional | Sentry/PostHog env vars not configured locally |

Configure GitHub secrets per `.github/SECRETS.template.md` to enable `production-smoke.yml` and `hosted-rehearsal.yml` on every `main` push.

## Current Launch Gate

Frontend code, CI, GitHub sync, and Vercel production deploy are **complete**. The remaining gate is **credential-backed Supabase setup + manual two-browser rehearsal**.

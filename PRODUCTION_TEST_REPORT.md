# Production Test Report

Report date: July 13, 2026

Repository: https://github.com/hondoentertainment/giant-schrodinger

Production URL: https://giant-schrodinger.vercel.app

## Deployment Status

- Vercel deployment: production alias live
- Production alias: https://giant-schrodinger.vercel.app
- GitHub `main`: `13afad6` (configure scripts + Vitest stability)

## Automated Verification

- `npm run verify:release`: passed (688 unit tests, 33 E2E, build) — prior pass July 4
- Failing unit timeouts fixed: Gemini env isolation in Vitest + faster Round userEvent
- `npm run launch:gate`: automated portion passes when prod is up; backend probes skip without Supabase

## Shipped / shipping

### Production hardening (`446a30e`)

- Server-only Gemini scoring gate when Supabase is configured
- Vercel CSP + security headers; hidden source maps
- Edge CORS allowlists + input sanitization
- Content moderation RPCs + gallery report button
- PWA SW v2 + offline page; Privacy/Terms pages

### Launch automation (`8125ba4` + this commit)

- `npm run launch:gate`, `setup:backend`, `sync:env`, `check:vercel-env`
- `npm run configure:supabase` — local + Vercel Supabase env
- `npm run configure:github-secrets` — GitHub Actions secrets
- Real edge deploy when CLI linked (`deploy:edge-functions`)
- Env loading: `.env.local` overrides empty `.env` placeholders
- Vitest: clear invalid Gemini key unless `VITEST_USE_GEMINI=1`

## Remaining Hosted Rehearsal (requires your credentials)

1. Create Supabase project → apply `supabase/schema.sql`.
2. `VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npm run configure:supabase`
3. `npm run configure:github-secrets`
4. `supabase link` + edge secrets → `npm run deploy:edge-functions`
5. Rotate Gemini key if Google returns `API_KEY_INVALID`
6. Two-browser checks — `PRODUCTION_REHEARSAL.md` §4–6

## Known Live Limitations

| Area | Status | Notes |
|------|--------|-------|
| Supabase schema + RPCs | **Blocked — no creds** | Missing `VITE_SUPABASE_*` locally and on Vercel |
| Friend judging / multiplayer | Requires live Supabase | Launch gate |
| Server AI scoring | Requires edge + valid `GEMINI_API_KEY` | Current Vercel Gemini key reported invalid by Google |
| OG previews | Requires `og-tags` + secrets | |
| Ranked / shop / tournaments | Local preview only | |
| Observability | Optional | Sentry/PostHog not configured |

## Current Launch Gate

Frontend, CI workflows, and launch automation are ready. Remaining gate: **Supabase credentials + schema/edge deploy + manual two-browser rehearsal**.

# GitHub Actions & Vercel secrets template

Configure these in **GitHub → Settings → Secrets and variables → Actions** and in **Vercel → Project → Environment Variables**.

## Required for hosted rehearsal CI

| Secret | Where | Purpose |
|--------|-------|---------|
| `PRODUCTION_URL` | GitHub | e.g. `https://giant-schrodinger.vercel.app` |
| `VITE_SUPABASE_URL` | GitHub + Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | GitHub + Vercel | Supabase anon key |

## Optional live services

| Secret | Where | Purpose |
|--------|-------|---------|
| `VITE_GEMINI_API_KEY` | GitHub + Vercel | Client fusion images in dev; prefer server scoring in prod |
| `VITE_SENTRY_DSN` | Vercel | Client error monitoring |
| `VITE_POSTHOG_KEY` | Vercel | Product analytics |
| `VITE_POSTHOG_HOST` | Vercel | PostHog ingest host |

## Supabase Edge Function secrets (dashboard only — never `VITE_*`)

| Secret | Purpose |
|--------|---------|
| `GEMINI_API_KEY` | `score-submission` server-side AI scoring |
| `PEXELS_API_KEY` | `resolve-image` stock photos |
| `GIPHY_API_KEY` | `resolve-meme` GIF lookup |
| `APP_URL` | OG previews + CORS allowlist seed |
| `ALLOWED_ORIGINS` | Comma-separated extra CORS origins |
| `SUPABASE_URL` | `og-tags` RPC lookups |
| `SUPABASE_ANON_KEY` | `og-tags` RPC lookups |

## CI-only (Sentry releases)

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Upload source maps from CI |
| `SENTRY_ORG` | Sentry org slug |
| `SENTRY_PROJECT` | Sentry project slug |

## Production safety flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_ALLOW_CLIENT_GEMINI` | unset/false in prod | Override to allow client-side Gemini when debugging |

## After configuring secrets

```bash
npm run rehearsal:status
npm run rehearsal:preflight
PRODUCTION_URL=https://giant-schrodinger.vercel.app npm run test:e2e:rehearsal
```

Apply `supabase/schema.sql` (includes content report RPCs + `analytics_events` insert policy) before enabling moderation backend / Supabase analytics inserts.

Observability wiring in the app:

- `VITE_SENTRY_DSN` → `SentryReporter` via `initErrorMonitoring()`; `reportAppError()` also bridges into `logError()`
- `VITE_POSTHOG_KEY` (+ optional `VITE_POSTHOG_HOST`) → `initTelemetry()` registers PostHog capture
- Without those keys, events stay in localStorage + console (dev) + optional Supabase `analytics_events` inserts

# Deployment Guide

This repo is set up for static frontend deployment, with GitHub Pages as the primary documented path and Vercel as a secondary option.

## Current deployment assets in the repo

- GitHub Pages workflow: `.github/workflows/deploy.yml`
- Vercel config: `vercel.json`
- Vite config with host-aware base path: `vite.config.js`

## Recommended path: GitHub Pages

### 1. Confirm repository settings

- Repository Pages source should be set to `GitHub Actions`
- Default branch should include the workflow file

### 2. Optional secrets

Add these only if you want live services in production:

- `VITE_GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If no secrets are configured, the app still deploys and remains playable in local/mock mode for supported features.

### 3. Workflow behavior

The existing workflow currently does this on pushes to `main`:

1. `npm ci`
2. install Playwright Chromium
3. `npm run verify:release`
4. deploy `dist/` to GitHub Pages

## Local preflight before shipping

Run these locally before pushing:

```bash
npm run verify:release
npm run preview
```

Preview default URL:

- `http://localhost:4173/`

Playwright release verification starts its own strict preview server on `http://localhost:4174/` by default so it cannot accidentally reuse another local app on Vite's default port. Override with `PLAYWRIGHT_PORT` when needed, or set `PLAYWRIGHT_BASE_URL` to test an already-hosted environment.

When built for GitHub Pages, the app uses the `/giant-schrodinger/` base path. When built on Vercel, `vite.config.js` detects `VERCEL` and uses `/` so the production alias works at the domain root.

To smoke-test the Vercel production URL after deploy:

```bash
npm run smoke:production
```

Override the target with `PRODUCTION_URL` when needed.

## Production-readiness checks

### Functional checks

- Landing/lobby loads without console errors
- Solo round can be completed end to end
- Reveal screen shows score and/or fallback output correctly
- Share-for-judging link can be generated
- Multiplayer room creation/join works if Supabase is configured

### Failure-state checks

- No Gemini key: mock scoring and curated image fallback still work
- No Supabase keys: solo play still works and multiplayer is clearly marked unavailable
- Broken/expired judging link shows a recoverable error state

### Build checks

- `npm run verify:release` passes
- No missing asset errors in preview

## Backend hardening for production

Before you rely on Supabase in production, apply `supabase/schema.sql`. The current production path expects:

- share and judgement writes to go through RPCs instead of open anonymous inserts
- multiplayer room/session writes to go through token-validated RPCs
- manual multiplayer scoring to persist votes and finalized results in backend state

If the SQL migration has not been applied yet, the app can still fall back to older behavior, but that mode should be treated as compatibility-only rather than production-safe.

## Observability

The app emits structured telemetry through:

- `window.__VWF_TELEMETRY__` as either an array or function sink
- the browser event `vwf:telemetry`

This keeps the frontend vendor-neutral while making it easy to plug in Sentry, PostHog, or another monitor later.

## Vercel option

`vercel.json` is already present.

Typical deploy flow:

```bash
vercel
vercel --prod
```

Use Vercel if you want preview deployments and simpler SPA hosting behavior.

## Troubleshooting

### Assets 404 on GitHub Pages

- Check that Pages is deploying from the workflow
- Confirm repo name still matches `/giant-schrodinger/`
- Confirm the workflow is building in CI, not from a local custom command

### Workflow fails on tests

- Run `npm run test` locally first
- If E2E is failing, inspect Playwright configuration and environment assumptions

### Live app loads but multiplayer does not work

- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in deployment secrets
- Confirm Supabase tables and realtime policies are set up

## Release checklist

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) as the canonical ship/no-ship checklist.
For a full launch rehearsal, use [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md).

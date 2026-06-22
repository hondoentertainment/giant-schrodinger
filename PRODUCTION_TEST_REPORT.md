# Production Test Report

Report date: June 22, 2026

Repository: https://github.com/hondoentertainment/giant-schrodinger

Production URL: https://giant-schrodinger.vercel.app

Latest verified commit: `419e721 feat(launch): improve social workflow and release readiness`

## Deployment Status

- Vercel deployment: `dpl_4JJ6ZQGiuU44e8h2XckvdYMht3rN`
- Deployment target: production
- Deployment status: Ready
- Production alias: https://giant-schrodinger.vercel.app
- Deployment URL: https://giant-schrodinger-byrxs3uhi-hondo4185-5820s-projects.vercel.app

## Automated Verification

- `npm run verify:release`: passed before production deploy
- Unit/component tests: 51 files, 595 tests passed
- Desktop E2E: 26 passed, 1 intentionally skipped
- Production build: passed
- Lint: passed

## Post-Deploy Fix

The first live smoke attempt against the Vercel root URL exposed a host-specific base-path issue. GitHub Pages needs `/giant-schrodinger/`, while Vercel production serves from `/`.

Fix applied:

- `vite.config.js` now uses `/` when `process.env.VERCEL` is set.
- GitHub Pages keeps `/giant-schrodinger/`.
- `npm run smoke:production` verifies that the Vercel root URL loads the app shell.

## Remaining Hosted Rehearsal

These checks require live service credentials and cannot be fully completed from local/mock mode alone:

- Apply `supabase/schema.sql` to the target Supabase project.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.
- Configure `VITE_GEMINI_API_KEY` if live AI judging is part of launch.
- Verify friend judging persistence with a second browser.
- Verify multiplayer room create/join/vote/finalize across two browsers.
- Confirm telemetry events through `window.__VWF_TELEMETRY__` or the `vwf:telemetry` event.

## Current Launch Gate

Code, local release verification, GitHub sync, and Vercel deployment are complete. The remaining launch gate is the credential-backed live rehearsal for Supabase and optional Gemini behavior.

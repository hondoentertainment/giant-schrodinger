# Production Test Report

Report date: June 22, 2026

Repository: https://github.com/hondoentertainment/giant-schrodinger

Production URL: https://giant-schrodinger.vercel.app

Latest smoke-passed app commit: `2499e7c fix(deploy): support Vercel root production smoke`

## Deployment Status

- Vercel deployment: `dpl_7Z3XDYjLFSerCj2Ueck8tGaukudp`
- Deployment target: production
- Deployment status: Ready
- Production alias: https://giant-schrodinger.vercel.app
- Deployment URL: https://giant-schrodinger-qlkff21ie-hondo4185-5820s-projects.vercel.app
- Inspect URL: https://vercel.com/hondo4185-5820s-projects/giant-schrodinger/7Z3XDYjLFSerCj2Ueck8tGaukudp

## Automated Verification

- `npm run verify:release`: passed before production deploy
- Unit/component tests: 51 files, 595 tests passed
- Desktop E2E: 26 passed, 1 intentionally skipped
- Production build: passed
- Lint: passed
- `npm run smoke:production`: passed against https://giant-schrodinger.vercel.app

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

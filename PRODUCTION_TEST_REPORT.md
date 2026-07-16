# Production Test Report

Report date: July 15, 2026 (evening rehearsal pass)

Repository: https://github.com/hondoentertainment/giant-schrodinger

Production URL: https://giant-schrodinger.vercel.app

**Product status:** [PRD.md](PRD.md) · [ROADMAP.md](ROADMAP.md)

## Deployment Status

- Vercel deployment: production alias live
- Production alias: https://giant-schrodinger.vercel.app
- Supabase project: `venn-with-friends` (`fnjshhjwoximddoggdrk`, us-west-2)

## Automated Verification

| Check | Result |
|---|---|
| `npm run launch:gate` (env/RPC/edge/smoke/deployed E2E) | **Passed** |
| Hosted two-browser multiplayer (`e2e/hosted-two-browser.spec.js`) | **Passed** — create/join/submit/vote/finalize |
| Hosted friend-judge share (second browser) | **Passed** |
| Supabase RPC probe | **Passed** |
| Edge functions | **Passed** (`og-tags` 200; others 405 on GET as expected) |
| Production smoke | **Passed** |

## Shipped this pass

- Supabase project + schema + pgcrypto wrappers + edge functions
- Local / Vercel / GitHub secrets wired
- Multiplayer UX + telemetry + gallery share polish
- Hosted rehearsal CI hardened
- New `e2e/hosted-two-browser.spec.js` + `npm run test:e2e:hosted`

## Remaining (optional)

1. `npm run rehearsal:telemetry` during a live browser session (observability sink)
2. Set `PEXELS_API_KEY` / `GIPHY_API_KEY` edge secrets for richer stock/meme lookup
3. Commit/push so GitHub Pages + Actions pick up the latest docs/tests

## Known Live Limitations

| Area | Status | Notes |
|------|--------|-------|
| Supabase schema + RPCs | **Live** | Project `fnjshhjwoximddoggdrk` |
| Friend judging / multiplayer | **Verified live** | Two-browser Playwright rehearsal passed |
| Server AI scoring | Edge deployed | Live Gemini path exercised in friend-judge flow |
| OG previews | Edge deployed | `og-tags` with image dimensions/alt |
| Ranked / shop / tournaments | Local preview only | Product decision locked until Phase 9 |
| Observability | Optional | Sentry/PostHog not configured |

## Current Launch Gate

**Cleared for launch candidate.** Optional polish remains (telemetry sink check, Pexels/Giphy secrets).

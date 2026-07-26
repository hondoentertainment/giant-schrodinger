# Production Test Report

Report date: July 18, 2026

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
| `npm run launch:gate` (env/RPC/edge/smoke/deployed E2E) | **Passed** (July 15) |
| Hosted two-browser multiplayer (`e2e/hosted-two-browser.spec.js`) | **Passed** |
| Hosted friend-judge share (second browser) | **Passed** |
| Supabase RPC probe | **Passed** |
| Edge functions | **Passed** (`og-tags` redeployed July 18 with richer meta) |
| `analytics_events` INSERT RLS | **Applied** July 18 (no `users` FK) |

## Shipped since soft-launch clear

- End-user retention/share/gallery/MP polish (July 17)
- `reportAppError` → Sentry/`logError` bridge
- `trackRoundComplete` + session funnel events
- Richer lobby profile summary + streak-at-risk CTA
- `analytics_events` table + anon INSERT policy
- OG tags: site_name, richer descriptions, challenge copy

## Remaining (optional — needs external keys)

1. Set Vercel `VITE_SENTRY_DSN` / `VITE_POSTHOG_KEY` (code already wired)
2. Set Supabase edge secrets via `npm run configure:edge-secrets` (`PEXELS_API_KEY` / `GIPHY_API_KEY`)
3. Optional Sentry map upload: GitHub secrets `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`
4. Optional Discord: `DISCORD_PUBLIC_KEY` + interactions URL → `…/functions/v1/discord-bot`
5. `npm run rehearsal:telemetry` to confirm sink status + browser checklist

## Known Live Limitations

| Area | Status | Notes |
|------|--------|-------|
| Supabase schema + RPCs | **Live** | Project `fnjshhjwoximddoggdrk` |
| Friend judging / multiplayer | **Verified live** | Two-browser Playwright rehearsal passed |
| Server AI scoring | Edge deployed | Live Gemini path exercised in friend-judge flow |
| OG previews | Edge redeployed | Richer title/description/site_name |
| Analytics inserts | **Live** | Anon INSERT allowed; reads locked down |
| Ranked / shop / tournaments | Local preview only | Product decision locked until Phase 9 |
| Observability dashboards | Optional | Needs PostHog/Sentry project keys |

## Current Launch Gate

**Cleared for launch candidate.** Remaining items require third-party API keys, not more product code.

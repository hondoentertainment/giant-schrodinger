# Venn with Friends Roadmap

**Last updated:** July 18, 2026  
**Source of truth for product intent:** [PRD.md](PRD.md)

This roadmap turns the PRD into an implementation plan. Soft-launch gate is cleared; code for observability/retention is shipped — enable sinks with API keys when ready.

## Current Product Status

| Area | Status | Notes |
|---|---|---|
| Solo play | Shipped | Profile, rounds, daily challenge, scoring, reveal, summary |
| AI scoring | Shipped with fallback | Gemini optional; null/missing assets → mock |
| Fusion images | Shipped with fallback | Curated art without Gemini |
| Friend judging | Shipped | Eager share links from reveal; local fallback without Supabase |
| Gallery/history | Shipped | Personal archive; daily/week/friend/highlight filters |
| Realtime multiplayer | Shipped | Rooms, vote recovery, reconnect, pending-voter UX |
| Moderation (lightweight) | Shipped | Content reports + dashboard |
| Progression / retention | Shipped | Streaks, next-unlock progress, daily share CTA |
| Ranked / shop / tournaments | Local preview | Device-only; `LocalPreviewBadge` |
| Production readiness | Soft-launch candidate | Hosted rehearsal + launch gate passed; optional PostHog/Sentry |

## Phase status summary

| Phase | Status |
|---|---|
| 1 Stabilization & Truthfulness | **Complete** |
| 2 Production Readiness | **Complete for soft launch** — see [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md) |
| 3 Social Scoring Foundation | **Complete enough for launch** — copy + gallery clarity shipped |
| 4 Multiplayer Authority | **Complete enough for launch** — hosted two-browser rehearsal passed |
| 5 Share Loop Optimization | **Complete enough for launch** |
| 6 Gallery, Identity, Retention | **Complete enough for launch** |
| 8 Content Expansion | **Started** — Summer Heat theme/pack; media APIs optional |
| 9–10 Accounts / Community | **Later** |

---

## Phase 1: Stabilization and Truthfulness

**Status: complete**

- Automated scoring/ErrorBoundary coverage
- Docs aligned (no Party Mode / community gallery overclaims)
- First-session lobby and reveal next-actions instrumented

Hygiene: run `npm run verify:release` before release candidates.

---

## Phase 2: Production Readiness

**Status: complete for soft launch**

Done:

1. Hosted Supabase project + schema + edge functions
2. Hosted two-browser multiplayer + friend-judge rehearsal (`npm run test:e2e:hosted`)
3. Launch gate script wired

Code complete; enable with keys (not launch blockers):

- Set `VITE_POSTHOG_KEY` / `VITE_SENTRY_DSN` on Vercel (`reportAppError` already bridges to Sentry)
- Set `PEXELS_API_KEY` / `GIPHY_API_KEY` edge secrets for richer stock/meme lookup
- Confirm events in PostHog/Sentry dashboards (`npm run rehearsal:telemetry`)

Runbook: [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) · status: [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md)

---

## Phase 3: Social Scoring Foundation

**Status: complete enough for launch**

Canonical model: [JUDGE_MODEL.md](JUDGE_MODEL.md)

Shipped polish: AI / Manual / Friend / room-vote clarity in lobby + onboarding; friend chips in gallery; session summary feedback.

---

## Phase 4: Multiplayer Authority

**Status: complete enough for launch**

Shipped: RPCs, reconnect, ConnectionBanner, host-exit, pending voter names, aligned vote counts.

---

## Phase 5: Share Loop Optimization

**Status: complete enough for launch**

Shipped: reveal CTAs, eager `createJudgeShareLinks`, preview URLs, daily/session share lines, gallery save-card, richer `og-tags` meta (redeployed).

---

## Phase 6: Gallery, Identity, and Retention

**Status: complete enough for launch**

Shipped:

1. Gallery daily filter + friend chips + richer share metadata
2. Lobby next-unlock + avg/friend/highlight stats + streak-at-risk banner
3. Daily challenge share CTA + 1.5× bonus + session best-line invite
4. Funnel events: `round_complete`, `first_round_complete`, `session_complete`, `streak_at_risk`, etc.

Next (post soft-launch): accounts, graduate local-preview modes, community surfaces only if intentional.

---

## Deferred / local-preview product decision (July 15, 2026)

Until Phase 9 cloud sync ships, these modes stay **local-preview only** (device progress, `LocalPreviewBadge` in lobby + screens):

| Mode | Decision |
|---|---|
| Ranked / Elo | Stay local-preview — do not imply global ladders |
| Shop / battle pass | Stay local-preview — no Stripe |
| Tournaments | Stay local-preview |
| Async challenge chains | Stay local-preview |
| AI Battle / AI Settings | Stay local-preview / experimental |

They remain playable for fun on-device. Do not remove them; do not market them as cloud-synced competitive features.

## Deferred

Wait until soft-launch learnings settle:

- Native mobile apps ([MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) is aspirational)
- Monetization / Stripe
- Heavy account infrastructure (Phase 9)
- Large-scale public matchmaking
- Public community gallery / Party Mode UI
- Net-new game modes unrelated to the connection mechanic

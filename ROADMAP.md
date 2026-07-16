# Venn with Friends Roadmap

**Last updated:** July 14, 2026  
**Source of truth for product intent:** [PRD.md](PRD.md)

This roadmap turns the PRD into an implementation plan. Near-term focus: prove live multiplayer, keep social scoring trustworthy, and stay honest about local-preview vs shipped.

## Current Product Status

| Area | Status | Notes |
|---|---|---|
| Solo play | Shipped | Profile, rounds, daily challenge, scoring, reveal, summary |
| AI scoring | Shipped with fallback | Gemini optional; null/missing assets → mock |
| Fusion images | Shipped with fallback | Curated art without Gemini |
| Friend judging | Shipped; live persistence needs Supabase | Early share from reveal; local fallback |
| Gallery/history | Shipped | Personal archive; filters; not a public community feed |
| Realtime multiplayer | Shipped in code; needs hosted proof | Rooms, vote recovery, reconnect, spectator |
| Moderation (lightweight) | Shipped | Content reports + dashboard |
| Progression / retention | Shipped | Streaks, achievements, unlocks, weekly events |
| Ranked / shop / tournaments | Local preview | Device-only; `LocalPreviewBadge` |
| Production readiness | In progress | Automation ready; Supabase credentials are the gate |

## Phase status summary

| Phase | Status |
|---|---|
| 1 Stabilization & Truthfulness | **Complete** |
| 2 Production Readiness | **Highest priority** — hosted rehearsal |
| 3 Social Scoring Foundation | **Mostly complete** — polish after live proof |
| 4 Multiplayer Authority | **Code complete** — verify live |
| 5 Share Loop Optimization | **Mostly complete locally** |
| 6 Gallery, Identity, Retention | **In progress** |
| 7–10 Content / Accounts / Community | **Later** (spectator + moderation already partial) |

---

## Phase 1: Stabilization and Truthfulness

**Status: complete**

Completed:

- Automated tests for `scoreSubmission()` and `ErrorBoundary` passing
- Null/label-less prompt assets fall back to mock scoring explicitly
- README + PRD feature registries separate no-key / Gemini / Supabase behavior
- First-session lobby, coaching, and reveal next actions instrumented
- Docs aligned July 2026 (removed Party Mode / community gallery overclaims)

Ongoing hygiene:

- Run `npm run verify:release` before release candidates
- Update PRD/README when live-service requirements change

---

## Phase 2: Production Readiness

**Priority: highest · Status: in progress**

Next steps:

1. Hosted rehearsal with real Supabase credentials and schema applied ([SETUP_BACKEND.md](SETUP_BACKEND.md))
2. Verify solo, friend-judging, and multiplayer on the deployed site
3. Confirm telemetry for profile, first submission, friend-judge share, room create/join, vote finalize, AI fallback, error boundary
4. Fix invalid Gemini key on Vercel if Google returns `API_KEY_INVALID`

Exit criteria:

- Deployed environment accessible
- Core solo and share flows work live
- Multiplayer manual voting verified across two browsers (including rejoin around reveal/results)

Runbook: [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) · status: [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md)

---

## Phase 3: Social Scoring Foundation

**Priority: high after hosted rehearsal · Status: mostly complete**

Canonical model: [JUDGE_MODEL.md](JUDGE_MODEL.md)

Remaining:

1. Playtest copy for AI / manual / friend clarity after live traffic
2. Audit `judgements.js`, `votes.js`, `share.js`, and reveal UI for naming drift
3. Surface judged results more clearly in gallery and session summaries

Exit criteria: manual and friend scoring are clear; judged rounds durable when Supabase is configured.

---

## Phase 4: Multiplayer Authority

**Priority: high · Status: code complete — needs live proof**

Shipped in schema/client:

- `cast_room_vote` / `finalize_room_votes` / `advance_room_state`
- Reconnect resync, ConnectionBanner, host-exit handling

Remaining:

1. Live verification of RPCs across two browsers
2. Expand regression for late joins, reconnects, host exits
3. Improve messaging for disconnected / waiting / finalizing / recovered states

---

## Phase 5: Share Loop Optimization

**Priority: medium · Status: mostly complete locally**

Done locally: reveal CTAs, copy confirmation, recommended next-move, gallery friend-judgement detail.

Remaining: richer share-card / OG assets once link flow is stable on hosted env (`og-tags` edge function).

---

## Phase 6: Gallery, Identity, and Retention

**Priority: medium · Status: in progress**

Next:

1. Richer gallery metadata and share-card generation
2. Stronger profile surfaces (best scores, favorite themes, streak highlights)
3. Deeper daily challenge rewards beyond completion tracking
4. More themed content after reliability is proven (ties to Phase 8)

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

Wait until hosted verification and social scoring are solid:

- Native mobile apps ([MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) is aspirational)
- Monetization / Stripe
- Heavy account infrastructure (Phase 9)
- Large-scale public matchmaking
- Public community gallery / Party Mode UI
- Net-new game modes unrelated to the connection mechanic

Local-preview modes (ranked, shop, tournaments, async) stay labeled until Phase 9 cloud sync is intentional.

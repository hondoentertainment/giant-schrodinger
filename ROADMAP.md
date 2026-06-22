# Venn with Friends Roadmap

Last updated: June 19, 2026

This roadmap turns the PRD into an implementation plan. The near-term focus is launch readiness: stabilize the current product, prove live multiplayer, and make the social loop trustworthy before adding new game modes.

## Current Product Status

| Area | Status | Notes |
|---|---|---|
| Solo play | Shipped | Profile creation, configurable rounds, daily challenge, scoring, reveal, and summary flows are implemented. |
| AI scoring | Shipped with fallback | Gemini scoring is optional. Missing API keys, missing submissions, or unusable prompt assets fall back to mock scoring. |
| Fusion images | Shipped with fallback | Gemini image generation is optional and falls back to curated fusion art. |
| Friend judging | Shipped, live persistence depends on Supabase | Share links work locally; manual-mode users can ask a friend before self-scoring; backend persistence requires Supabase configuration. |
| Gallery/history | Shipped and improved | Local-first saved creations include highlights, friend-feedback filters, details, and reshare copy actions. |
| Realtime multiplayer | Shipped, needs hosted proof | Supabase-backed rooms, synchronized phases, vote recovery, reveal-phase connection status, and reconnect resync exist but still need repeatable live rehearsal. |
| Progression and retention | Shipped and wired | Streaks, achievements, unlocks, daily completion, weekly events, next-goal nudges, and ranked services exist. |
| Production readiness | In progress | README, deployment docs, release checklist, e2e tests, `npm run verify:release`, and GitHub Pages workflow are present. Hosted verification remains the main gap. |

## Phase 1: Stabilization and Truthfulness

Goal: keep the shipped app trustworthy and documented.

Status: mostly complete.

Completed or verified:

- Automated tests for `scoreSubmission()` and `ErrorBoundary` are passing.
- `scoreSubmission()` now handles null or label-less prompt assets through explicit mock fallback.
- README includes a feature status matrix that separates no-key, Gemini, and Supabase behavior.
- First-session lobby, onboarding, round coaching, and reveal next actions are simplified and instrumented.
- Share/judge, gallery, retention, and accessibility polish improvements are wired into live app paths.

Remaining work:

- Run the full test suite and production build after each stabilization pass.
- Keep README and PRD updated when a feature changes live-service requirements.
- Use `npm run verify:release` as the repeatable local and CI preflight.
- Document any hosted-only limitations found during release rehearsal.

## Phase 2: Production Readiness

Goal: make the app launchable in a real hosted environment.

Priority: highest.

Next implementation steps:

1. Complete a hosted rehearsal with real Supabase credentials and schema applied.
2. Verify solo, friend-judging, and multiplayer room flows on the deployed site.
3. Confirm telemetry for profile creation, first-round submission, friend-judge sharing, room creation, joins, vote finalization, AI fallback, and error-boundary catches.
4. Add any missing release-checklist steps discovered during rehearsal.

Exit criteria:

- Deployed environment is accessible.
- Core solo and share flows work on the live site.
- Multiplayer manual voting is verified across two browsers, including join/rejoin around reveal and results.

## Phase 3: Social Scoring Foundation

Goal: make non-AI judging consistent and explainable.

Priority: high after hosted rehearsal.

Next implementation steps:

1. Continue refining the canonical product model for AI judge, manual judge, and friend judge based on playtesting.
2. Audit `src/services/judgements.js`, `src/services/votes.js`, `src/services/share.js`, and multiplayer reveal UI for naming or behavior drift after hosted rehearsal.
3. Persist shared-round outcomes through one consistent model when Supabase is available.
4. Surface judged results more clearly in gallery/history and session summaries.

Exit criteria:

- Manual and friend scoring behavior is clear to users.
- Judged rounds can be trusted as durable results when backend services are configured.

## Phase 4: Multiplayer Authority

Goal: make multiplayer outcomes shared and deterministic.

Priority: high.

Next implementation steps:

1. Verify secure Supabase RPCs for submitting votes and finalizing results.
2. Expand regression coverage for late joins, reconnects, host exits, and result finalization.
3. Improve room-state messaging for disconnected, waiting, finalizing, and recovered states.
4. Ensure all clients converge on the same reveal, winner, and standings data.

Exit criteria:

- Players in the same room see the same winners and standings.
- Vote finalization can recover from common reconnect and timing edge cases.

## Phase 5: Share Loop Optimization

Goal: turn strong rounds into repeatable invites and friend judgements.

Priority: medium.

Next implementation steps:

1. Improve post-reveal share CTAs and copied-link confirmation. Done locally with reveal workflow guidance and contextual share metadata.
2. Add clearer prompts for requesting friend judgement after high-scoring rounds. Done locally with recommended next-move guidance.
3. Make shared results more useful in gallery/history. Done locally with friend judgement detail and copied-share context.
4. Explore richer share-card or screenshot-friendly output once the link flow is stable.

Exit criteria:

- Sharing feels like part of the core loop, not an optional utility.
- More completed rounds create friend judgements or multiplayer invites.

## Phase 6: Gallery, Identity, and Retention

Goal: make returning valuable.

Priority: medium.

Next implementation steps:

1. Expand gallery detail views with richer metadata and share-card generation.
2. Improve profile surfaces for best scores, favorite themes, streaks, and milestones.
3. Expand daily challenge framing and rewards beyond completion tracking. In progress locally with completion count, best score, and share-ready daily summary.
4. Add more themed prompt content once reliability and social loops are stable.

Exit criteria:

- Returning users have meaningful history to browse.
- Progression feels motivating rather than decorative.

## Deferred

These should wait until reliability, hosted verification, and social scoring are stronger:

- Native mobile apps.
- Monetization.
- Heavy account infrastructure.
- Large-scale public matchmaking.
- Net-new game modes unrelated to the core connection mechanic.

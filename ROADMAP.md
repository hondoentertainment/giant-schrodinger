# Venn with Friends Roadmap

**Last updated:** September 26, 2026  
**Source of truth for product intent:** [PRD.md](PRD.md)

This roadmap turns the PRD into an implementation plan. Soft-launch gate is cleared. Redesign v2, mobile alignment, and UX rounds #16/#17 are on main. The top-game sprint adds a Capacitor iOS shell (unsigned), premium feel, and install/share hardening. Observability/media sinks and Apple signing still need the owner.

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
| Ranked / shop / tournaments | Cloud for signed-in players | Guests stay device-only. Not a public global ladder. Stripe web checkout when keys exist |
| Production readiness | Soft-launch candidate | Hosted rehearsal + launch gate passed; Vercel + Pages auto-deploy. PostHog/Sentry/Pexels/Giphy keys still missing |
| Native iOS shell | In-repo, unsigned | Capacitor `com.hondoentertainment.vennwithfriends`; TestFlight is owner-held. See [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) |

## Phase status summary

| Phase | Status |
|---|---|
| 1 Stabilization & Truthfulness | **Complete** |
| 2 Production Readiness | **Complete for soft launch** — see [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md) |
| 3 Social Scoring Foundation | **Complete enough for launch** — copy + gallery clarity shipped |
| 4 Multiplayer Authority | **Complete enough for launch** — hosted two-browser rehearsal passed |
| 5 Share Loop Optimization | **Complete enough for launch** |
| 6 Gallery, Identity, Retention | **Complete enough for launch** |
| 8 Content Expansion | **Shipped enough for launch** — seasonal theme/pack rotation + weekly recap; media APIs optional |
| 9 Accounts & cloud progress | **In this PR** — optional Supabase Auth, per-domain sync, cloud Labs, Stripe Checkout. Owner still applies the migration, Auth providers, and Stripe secrets |
| Soft-launch UX + top-game shell | **Shipped in code** — #16 ease-of-use, #17 wrap/share/gallery, Capacitor/PWA/haptics sprint |

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

Shipped: RPCs, reconnect, ConnectionBanner, host-exit, pending voter names, aligned vote counts, live Watch the Game / spectator join.

---

## Phase 5: Share Loop Optimization

**Status: complete enough for launch**

Shipped: reveal CTAs, eager `createJudgeShareLinks`, preview URLs, daily share PNG card, gallery save-card, richer `og-tags` meta (redeployed).

---

## Phase 6: Gallery, Identity, and Retention

**Status: complete enough for launch**

Shipped:

1. Gallery daily filter + friend chips + richer share metadata
2. Lobby next-unlock + avg/friend/highlight stats + streak-at-risk banner
3. Daily challenge share CTA + 1.5× bonus + session best-line invite
4. Funnel events: `round_complete`, `first_round_complete`, `session_complete`, `streak_at_risk`, `high_score_share_prompt_shown`, etc.
5. Weekly recap share card in gallery
6. Short first-session onboarding (one example + play)

Next (post soft-launch): enable PostHog/Sentry/Pexels/Giphy with real keys; owner TestFlight; accounts; graduate local-preview modes only if intentional. See [TOP_GAME_CHECKLIST.md](TOP_GAME_CHECKLIST.md).

---

## Phase 9: Accounts, cloud Labs, and web Stripe

**Status: in this PR — owner deploy still required**

Shipped in code:

1. Optional Supabase Auth (email magic link and Google OAuth). Create Profile → Play today's pair still works with no account.
2. `player_progress` synced for profile, streaks/unlocks, gallery, ranked Elo, shop inventory, tournaments, achievements, and daily history.
3. Merge rule: **cloud wins per domain when both sides have data**. Empty cloud domains keep local progress and upload. While signed in, this device pushes the snapshot (last write wins). `stripe_entitlements` is server-owned.
4. Signed-in Labs (ranked, shop, tournaments) drop the device-only badge. Copy says the data is the player's account, not a public ladder. Guests keep local preview. AI Battle, AI Settings, and challenge links stay device-only.
5. Stripe Checkout + webhook for coin packs and the $4.99 battle pass. Missing keys disable checkout with "Purchases unavailable". No fake purchase-complete state.

Owner steps (no keys in git):

1. Apply `supabase/migrations/20260926000017_cloud_player_progress.sql` and `supabase/migrations/20260926000018_align_schema_snapshot.sql` (both are in `supabase/schema.sql`). New projects can paste `schema.sql` once instead. The alignment file drops old anon write policies; room and share writes stay on the RPCs.
2. Supabase Auth → URL configuration: allow `https://giant-schrodinger.vercel.app` and local dev. Enable Email and, if you want the button, Google.
3. Set edge secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Set Vercel `VITE_STRIPE_PUBLISHABLE_KEY`.
4. Deploy `create-checkout-session` and `stripe-webhook` (`npm run deploy:edge-functions`). Webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`.
5. Stripe Dashboard → webhook event `checkout.session.completed`.

App Store / TestFlight builds still need Apple IAP later. This PR is web Stripe for Vercel only.

## Still deferred

- App Store / TestFlight submit (shell is ready; signing is owner-held — [store/OWNER_STEPS.md](store/OWNER_STEPS.md))
- Apple In-App Purchase for the iOS shell
- Large-scale public matchmaking and a real global ladder
- Public community gallery / Party Mode UI
- Net-new game modes unrelated to the connection mechanic
- Advertising Labs as a worldwide competitive field

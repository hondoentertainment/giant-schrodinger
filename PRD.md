# Venn with Friends — Product Requirements Document

**Last updated:** July 14, 2026  
**Canonical companions:** [ROADMAP.md](ROADMAP.md) · [JUDGE_MODEL.md](JUDGE_MODEL.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [README.md](README.md)

---

### 1. Product Summary

Venn with Friends is a creative party game where players are shown two media prompts and write one phrase that connects them. The connection appears in a Venn diagram intersection and is scored by AI, self-judgement, a friend via share link, or room voting in multiplayer.

The product already supports:

- solo sessions with themed prompt pools and session modifiers
- image, video, audio, meme, and mixed media modes
- AI scoring and fusion-image generation with graceful fallbacks
- asynchronous friend judging via shareable links
- Supabase-backed realtime multiplayer with authoritative room voting
- persistent progression, unlocks, streaks, gallery history, and daily challenge

**Differentiation:** a simple prompt game that behaves like a replayable creative system — not a one-shot novelty demo.

Repo name / GitHub Pages base path: `giant-schrodinger`. Product name in UI and docs: **Venn with Friends**.

---

### 2. Current State Review

#### 2.1 Feature status registry

| Feature | Status | Keys required | Notes |
|---|---|---|---|
| Solo sessions (3/5/7 rounds) | **Shipped** | None | Core local loop |
| Session arcs (Speed, Double-or-Nothing, Final Showdown) | **Shipped** | None | |
| Daily challenge | **Shipped** | None | Local completion tracking |
| AI judge (Gemini) | **Shipped + fallback** | Gemini (or server edge) | Mock scoring without key |
| Manual (self) judge | **Shipped** | None | `judgeMode: human` |
| Friend judge (share link) | **Shipped** | Supabase for durable persistence | Local fallback without backend |
| Fusion images | **Shipped + fallback** | Gemini | Curated art without key |
| Gallery (personal history) | **Shipped** | None (optional Supabase enrich) | Filters: judged, highlights, media type |
| Unlocks / streaks / achievements | **Shipped** | None | localStorage-first |
| Realtime multiplayer rooms | **Shipped, needs hosted proof** | Supabase + schema RPCs | Create/join, phases, reconnect |
| Room vote scoring | **Shipped, needs hosted proof** | Supabase RPCs | `cast_room_vote` / `finalize_room_votes` |
| Spectator mode | **Shipped** | Supabase | Join-as-spectator |
| Content report / moderation dashboard | **Shipped** | Supabase for reports | Lightweight safety, not a UGC marketplace |
| Theme builder | **Shipped** | None | Share themes via URL hash |
| PWA / offline page | **Shipped** | None | SW v2 |
| i18n (EN / ES) | **Shipped** | None | |
| Ranked / Elo | **Local preview** | None | Device-only; `LocalPreviewBadge` |
| Shop / battle pass | **Local preview** | None | No Stripe wired |
| Tournaments | **Local preview** | None | Bracket UI, device-only |
| Async chains | **Local preview** | None | |
| AI Battle / AI Settings | **Local preview** | Optional Gemini | |
| Leaderboard | **Local** | None | localStorage daily/weekly, not global |
| Discord bot | **Optional integration** | Discord + Supabase edge | See [DISCORD_BOT.md](DISCORD_BOT.md) |
| Party Mode service | **Not user-facing** | — | `partyMode.js` has tests only; no lobby route |
| Community / public gallery | **Not shipped** | — | Gallery is personal history only |
| Cloud accounts / cross-device sync | **Deferred (Phase 9)** | — | Backend `users` migration exists; UI is local-first |
| Native mobile apps | **Deferred** | — | See [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) |

#### 2.2 Environment-dependent behavior

| Without keys | With Gemini | With Supabase |
|---|---|---|
| Full solo loop, mock scoring, curated fusion art, local gallery | Live AI scores + generated fusion images | Realtime rooms, durable friend judgements, room voting, content reports |
| Multiplayer unavailable | Same as left + better solo AI | Optional server-side scoring via edge function |

#### 2.3 Strengths

- Solo loop is productized (coaching, arcs, daily challenge, reveal/share CTAs)
- Graceful fallbacks when AI or backend are absent
- Clear judge-mode model documented in [JUDGE_MODEL.md](JUDGE_MODEL.md)
- Strong automated coverage: **688 unit tests** (68 files) + **11 E2E specs**
- Launch automation (`verify:release`, `launch:gate`, hosted rehearsal scripts)

#### 2.4 Gaps (as of July 14, 2026)

- **Hosted rehearsal incomplete:** Supabase credentials / schema / edge deploy still block live multiplayer and durable friend judging on production
- Gemini key on Vercel may be invalid (see [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md))
- Local-preview modes (ranked, shop, tournaments) must stay labeled until cloud sync is scoped
- Documentation historically overstated Party Mode and community gallery — corrected in this PRD and companion docs

#### 2.5 Verification snapshot

- Local validation on **July 14, 2026**:
  - `npm run test`: **688 passed** (68 files)
  - `npm run lint` / `npm run build`: part of `verify:release`
  - E2E: **11 Playwright specs** under `e2e/`
- Remaining launch gate: apply Supabase schema + secrets, deploy edge functions, two-browser multiplayer rehearsal ([PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md))

---

### 3. Product Vision

Build Venn with Friends into a replayable social creativity game that is:

- instantly playable solo
- naturally shareable with friends
- reliable enough for live multiplayer sessions
- sticky enough to support daily return behavior

---

### 4. Users

#### Primary

- Friends looking for a quick party-style creativity game
- Solo players who enjoy wordplay, absurd humor, and prompt games
- Small groups playing remotely over chat, text, or voice

#### Secondary

- Creators who want funny shareable screenshots
- Streamers or hosts looking for lightweight audience-participation prompts (spectator mode supports this)

---

### 5. Product Goals

1. **Excellent solo loop** — profile → rounds → reveal → summary without any backend
2. **Sharing as growth** — every strong round invites judgement or a future session
3. **Dependable multiplayer** — authoritative room voting, reconnect, shared standings
4. **Retention** — daily challenge, unlocks, streaks, gallery, weekly events

---

### 6. Non-Goals for the Near Term

- Native mobile apps (Capacitor / TWA guides remain aspirational)
- Large-scale public matchmaking
- Full cloud accounts with cross-device sync (Phase 9)
- UGC marketplaces or heavy community feeds
- Monetization / Stripe before retention and reliability are proven
- Shipping Party Mode or community gallery UI until explicitly scoped

**Clarification:** Lightweight content reporting and a moderation dashboard *are* in scope for safety (shipped). That is not the same as a community marketplace.

---

### 7. Core Experience Requirements

#### Solo

- Complete a full session with no external setup
- Fast, clear prompt presentation across media modes
- Scoring understandable for AI or manual
- Results worth saving or sharing

#### Friend judging

- Share a round in one action
- Friend opens link and judges with minimal friction
- Feedback flows into gallery/history when backend is available

#### Multiplayer

- Fast create/join with legible room codes
- Same prompt set for all players each round
- Synchronized submit → reveal → score → next round
- Trusted final standings via authoritative RPCs
- Spectator join without breaking player flow

---

### 8. Next Steps Recommendation

#### Right now (next 2 weeks) — Launch gate

1. Create Supabase project → apply `supabase/schema.sql` (+ media / reports migrations)
2. Configure env (`configure:supabase`, Vercel, GitHub secrets)
3. Deploy edge functions (`score-submission`, `resolve-image`, `resolve-meme`, `og-tags`, optional `discord-bot`)
4. Two-browser multiplayer rehearsal including vote finalization and reconnect
5. Confirm telemetry for room create/join, vote finalize, AI fallback

#### Near term (2–6 weeks)

- Turn hosted rehearsal into a repeatable regression pass (`hosted-rehearsal.yml`)
- Harden disconnect / late-join / host-exit messaging
- Keep gallery useful as personal archive + judged-round context
- Decide which local-preview modes graduate vs stay experimental

#### Medium term (1–3 months)

- Deeper daily/weekly retention framing
- Content expansion (themes, seasonal packs)
- Optional accounts / cloud sync (Phase 9) only after launch proof
- Community features only if they reinforce the core share loop (Phase 10)

---

### 9. Ten-Phase Feature Roadmap

Status legend: **Done** · **In progress** · **Next** · **Later**

| Phase | Name | Status | Summary |
|---|---|---|---|
| 1 | Stabilization & Truthfulness | **Done** | Green suite, null-safe Gemini fallback, feature matrix in README |
| 2 | Production Readiness | **Complete** | Supabase live, Vercel env wired, two-browser rehearsal passed |
| 3 | Social Scoring Foundation | **Mostly done** | Judge model decided; friend + room vote persistence verified live |
| 4 | Multiplayer Authority | **Complete** | RPCs live; create/join/vote/finalize verified on production |
| 5 | Share Loop Optimization | **Mostly done** | Gallery SocialShareButtons + OG dims; friend-judge live |
| 6 | Gallery & Identity | **In progress** | Personal gallery + filters; richer profile stats next |
| 7 | Retention Systems | **In progress** | Daily, streaks, weekly events wired; deepen rewards |
| 8 | Content Expansion | **Later** | More themes / media quality after launch proof |
| 9 | Accounts & Cloud Persistence | **Later** | Optional sign-in, cross-device sync |
| 10 | Platform & Community | **Partial / Later** | Spectator + moderation shipped; public gallery deferred |

Detailed implementation notes: [ROADMAP.md](ROADMAP.md).

---

### 10. Priority Feature Decisions

#### Must (now)

- Complete hosted multiplayer + friend-judging rehearsal
- Keep docs honest (shipped vs local-preview vs requires Supabase)
- Keep `verify:release` green

#### Should (after launch proof)

- Stronger retention UX around daily/streaks
- Richer gallery metadata and share cards
- Decide fate of ranked / shop / tournaments (cloud vs stay local)

#### Deprioritize

- Net-new modes unrelated to the connection mechanic
- Monetization
- Heavy account infrastructure
- Community marketplace / public trending gallery

---

### 11. Success Metrics

| Category | Signals |
|---|---|
| Activation | Profile created; first round completed; first 3-round session completed |
| Engagement | Rounds/session; reveal/summary view rate; share-for-judging rate |
| Social | Room create → start conversion; invite rate; shared links with ≥1 judgement |
| Retention | Daily challenge completion; streak continuation; returning users with >1 gallery entry |

Instrument via existing telemetry bridge (`vwf:telemetry` / optional PostHog + Sentry).

---

### 12. Recommended Immediate Backlog

| # | Item | Status |
|---|---|---|
| 1 | Fix `scoreSubmission()` null-asset fallback | **Done** |
| 2 | Stabilize `ErrorBoundary` tests | **Done** |
| 3 | Backend multiplayer voting RPCs | **Done (code)** — verify live |
| 4 | Feature/status matrix in README | **Done** — keep in sync |
| 5 | Hosted end-to-end rehearsal | **Done** — launch gate + two-browser multiplayer + friend-judge passed on production |
| 6 | Canonical AI / manual / friend / room_vote model | **Done** — see JUDGE_MODEL.md |
| 7 | Align all docs with this PRD (remove Party Mode / community gallery claims) | **Done** (July 14, 2026) |
| 8 | Rotate/fix Gemini key on Vercel if `API_KEY_INVALID` | **Done / mitigated** — live AI path exercised in friend-judge rehearsal |
| 9 | Local-preview mode decision (ranked/shop/tournaments/async) | **Done** — stay local until Phase 9 |

---

### 13. Open Questions

#### Resolved (see JUDGE_MODEL.md)

- Manual vs friend judge → **separate modes**
- Multiplayer default → **room vote** when scoring mode is human; AI optional for casual rooms
- AI trust → **optional for solo**, not the multiplayer default
- Gallery always records `judgeMode`

#### Still open

- Long-term identity: party game vs daily creativity app vs shareable social prompt toy?
- Which local-preview modes (ranked, shop, tournaments, async) graduate to cloud after Phase 9?
- When (if ever) to ship a public/community gallery without diluting the lightweight core?

---

### 14. Tech Stack (reference)

| Layer | Choice |
|---|---|
| Client | React 18, Vite, Tailwind CSS, Lucide |
| State | `GameContext` (solo/profile), `RoomContext` (multiplayer) |
| Backend | Supabase (Realtime, Postgres RPCs, Storage, Edge Functions) |
| AI | Google Gemini (`score-submission` edge preferred in prod; client fallback gated) |
| Media | Pexels / Giphy via edge functions; Picsum / curated fallbacks |
| Hosting | Vercel (primary prod) + GitHub Pages (base `/giant-schrodinger/`) |
| Tests | Vitest + Testing Library; Playwright E2E |
| Optional | Discord bot, Sentry, PostHog, PWA |

Full diagram: [ARCHITECTURE.md](ARCHITECTURE.md).

---

### 15. Product Recommendation

The highest-leverage path is still not adding more modes. It is proving and polishing what exists:

1. Finish the hosted Supabase rehearsal
2. Keep social scoring and multiplayer authority trustworthy in production
3. Sharpen retention loops already in the app
4. Treat ranked/shop/tournaments as experiments until cloud sync is intentional

There is enough product here for a real launch candidate once credentials, edge deploy, and two-browser truthfulness catch up with the code.

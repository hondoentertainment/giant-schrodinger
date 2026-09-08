# Next Steps

**Last updated:** September 8, 2026 (Venn side selection)

This file is a chronological work log. For current product priorities, use **[PRD.md](PRD.md)** and **[ROADMAP.md](ROADMAP.md)**. For live launch blockers, use **[PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md)**.

## Current (September 8, 2026)

Venn diagram side selection (still no invented keys):

- Tapping a circle or its caption selects ("spotlights") that side: it comes forward with an accent ring, the other side dims, the lens glow softens. Tap again to clear.
- Captions are the accessible controls (`aria-pressed`, keyboard focus); the circle is a pointer-only hit-area so screen readers hear one button per side. `←` / `→` select, `Esc` clears, a polite live region announces the change.
- A pointer tap never steals focus from the answer input (mobile keyboard stays open). Play / mute / Giphy controls sit above the hit-area and keep working.
- Selection is scoped to the pairing, so every round opens level. Reduced motion disables the transitions.
- Telemetry: `venn_side_selected` with `side`, `via` (`circle` | `caption` | `keyboard`), `mediaType`.
- Strings in `round.side*` / `round.spotlight*` (EN + ES). Shared by solo, daily, friend-judge, challenge, multiplayer, and AI Battle rounds via `VennDiagram`.
- Tests: 9 new unit cases in `VennDiagram.test.jsx`; `solo-flow.spec.js` covers pointer hit-testing, caption toggle, keyboard, and focus retention.

### Recommended next (in order)

1. **Ship the colorblind toggle the docs already promise.** `EXPECTED_BEHAVIORS.md §14`, `MANUAL_TESTING_GUIDE.md`, and `FAST_TRACK_CHECKLIST.md` describe a settings toggle; today only `VennDiagram` reads `localStorage.venn_colorblind` and nothing writes it. Add a "High-contrast Venn colors" switch under Create Profile → More options, make `VennDiagram` read it reactively (state + `storage` event, not a render-time `localStorage.getItem`), and cover it in `e2e/accessibility.spec.js`. Small.
2. **Fix same-type pairs in Memes & Videos.** `buildMemesVideosAssets` flips two independent coins for left/right, so about half of "memes & videos" rounds are meme+meme or video+video, and `pickDiversePair` only runs for image mode. Bias the second pick toward the opposite type (~75%) and add a unit test alongside the existing `selectRoundAssets` mixed-type case. Small.
3. **Peek sheet on the selected side.** At 375px each circle is still ~200px. A second tap on an already-selected circle (or long-press) could open a full-bleed sheet with the media, label, and badge, dismissed by tap or `Esc`, reusing `useFocusTrap`. Track it as `venn_side_peeked`. Medium.
4. **High-contrast ring under forced colors.** The selected ring is alpha-blended accent color; under `forced-colors: active` (Windows High Contrast) it can vanish. Add a `@media (forced-colors: active)` rule that switches `.venn-circle--selected` to a solid `outline`. Small.
5. **Read the new telemetry before adding more UI.** Once `VITE_POSTHOG_KEY` exists, check selection rate per round, `via` split on mobile vs desktop, and whether rounds with a selection score higher. If `caption` dominates on mobile, enlarge the circle hit-area instead of adding a hint. No code until then.
6. **Selection-aware coaching.** When a first-session player keeps one side selected for a while, surface one line from `contextualTips.js` ("Name what they share, not what each one is"). Needs copy; the hook point is `Round.jsx`, not `VennDiagram`. Small, after (5).
7. **Mobile Safari e2e for the hit-area.** The new spec runs on Desktop Chrome; add the same click path to the `Mobile Safari` project so touch regressions on the hit-area are caught, and consider a `visual-smoke` snapshot of the selected state. Small.
8. **Only if it earns its place: spectator sync.** `MultiplayerRound` uses the same component, so a room could broadcast the writer's selected side to spectators as a pass-the-phone tell. Medium; skip unless the room rehearsal asks for it.

## Prior (September 2, 2026)

Public-face leftover (still no invented keys):

- `#daily` starts today's pair when a profile already exists; `#friends` still opens rooms
- `npm run check:public-face` confirms live OG, robots, sitemap, and hosted `og-tags`
- Hosted `og-tags` should match source: `og-image.png` + **Beat this.**

## Prior (September 1, 2026)

One public face (still no invented keys):

- Canonical URL, OG, Twitter, JSON-LD, robots, and sitemap point at `https://giant-schrodinger.vercel.app`
- Real `og-image.png` + home-screen PNGs; install shortcuts are **Today's pair** and **Play with friends**
- Landing shows today's pair mood; More options stay out of the first paint
- GitHub Pages share links rewrite to Vercel; OG copy ends with **Beat this.**

## Prior (August 31, 2026)

Closed the three live drop funnels (still no invented keys):

- First session: **Play today's pair** writes a name and opens today's puzzle; **Join Lobby** stays for rooms
- Reveal: one Friend Judge CTA under the host voice; skip vs share is tracked
- Room create: pass-the-phone on by default; add the next writer on this phone; invite is the waiting-room CTA until two people are in

## Prior (August 30, 2026)

World-class game pass (still no invented keys):

- Thin dailies rewritten; weekly drops are named episodes (`Week of leftover sparklers`)
- Pass-the-phone is a show: 3s stare, peek lock, drumroll into reveal
- Reactions attach to a line; recap card prefers the night's most-reacted line
- First-session mobile keeps the pair on screen; **Say it like that — your turn** is the rewrite CTA
- Roast, rewrite, and mock Gemini share one host voice

Shipped this pass (no new API keys):

- Synced room reactions, pass-the-phone turns, room recap cards, second-chance rewrite, Friend Judge chain, today's-pair stamp, weekly editorial drop
- Hosted `join_room_spectator` + `is_spectator` applied; `score-submission` redeployed with host-voice rewrite
- Daily rounds use today's theme so every player sees the same pair mood
- Live lobby **Watch the Game** + `?join=CODE&watch=1` spectator join (`join_room_spectator` live on hosted Supabase)
- Unused lobby `sections/` copies removed — live lobby is only `Lobby.jsx`
- Waiting-room invite was already one-tap; join links now auto-join when a profile exists
- Daily complete share builds a PNG card (Web Share or download) instead of text only
- Friend Judge thanks screen shows the pair before **Your turn — play this pair**

Shipped since the July log:

- Seasonal theme/pack rotation (Summer / Autumn / Winter) and weekly recap share card
- Venn diagram collision entrance, glowing lens, and idle float
- Vendor-split bundles + lazy Gemini SDK (main chunk ~103 KB gzipped)
- Vercel Git auto-deploy; duplicate `giant-schrodinger-*` projects removed
- First-session onboarding cut to one example + play
- High-score reveal now leads with a Friend Judge share prompt (`high_score_share_prompt_shown`)
- Experimental modes (ranked/shop/tournaments/AI Battle) hidden behind **Show extras**
- Reveal scoring now includes a plain-language reason, rewrite hint, and **Practice score** label
- Friend Judge is a 20-second score + optional line, then **Your turn — play this pair**
- 36 curated pairs for first rounds and the daily ritual; daily share is a Wordle-style card
- Room codes are larger; writers still thinking are named during play

Still blocked on credentials (code is wired; do not invent keys):

- `VITE_POSTHOG_KEY` / `VITE_SENTRY_DSN` on Vercel + GitHub
- `PEXELS_API_KEY` / `GIPHY_API_KEY` as Supabase edge secrets

Canonical production URL: `https://giant-schrodinger.vercel.app` (custom domain skipped).

This log tracks remaining work after the memes & videos mode pass and world-class implementation. The app is locally feature-complete for solo play, friend judging, gallery/history, retention, accessibility polish, and Supabase-backed multiplayer code paths.

## Completed (Memes & Videos Pass)

- Per-side meme/video mixed media mode (`MEMES_VIDEOS`) with badges, captions, and asset selection.
- Smarter round asset picking with session dedup and recent-history avoidance.
- Custom meme/video uploads with storage usage bar (16MB cap).
- Daily challenge ~35% memes/videos days with lobby badge.
- Gallery media-type filter; saved collisions store `mediaType`.
- Share text and share cards include meme/video labels via `formatAssetForShare`.
- i18n strings for memes/videos mode in `en.json` and `es.json`.
- Unit tests: `mediaType`, `VennDiagram`, `customImages` meme/video, `dailyChallenge` mediaType, `socialShare` labels, gallery filter.
- E2E smoke: `e2e/memes-videos-flow.spec.js`.
- Hosted rehearsal automation (see below).

## Completed (Meme API Pass)

- Giphy-backed meme lookup via Supabase edge function `resolve-meme` (`GIPHY_API_KEY` server secret).
- Client service `memeResolve.js` with 7-day cache, batch lookup, and static Unsplash fallback.
- Round asset resolution enriches meme sides in `resolveSelectedAssets()` before play.
- Meme assets carry `searchQuery` for theme-aware GIF search terms.
- Giphy attribution badge on API-resolved memes in `VennDiagram`.
- Unit tests: `memeResolve`, `assetSelection.resolveSelectedAssets`, Giphy attribution in `VennDiagram`.

## Completed (YouTube Video Inclusion)

- YouTube URL parsing and privacy-enhanced embed playback in Venn circles.
- Custom library support via `addCustomYoutubeVideo` (watch, youtu.be, Shorts, bare IDs).
- YouTube add UI in Memes & Videos and pure Videos mode custom managers.
- Custom video pool selection for Videos mode when "Use my videos" is enabled.
- Unit tests: `youtube`, `customImages` YouTube, `VennDiagram` embed, `assetSelection` custom video pool.
- E2E: YouTube URL inputs visible in memes/videos and video profile modes.

## Completed Local Preflight

- Use `npm run verify:release` for release preflight.
- The command runs lint, unit tests, desktop E2E, and production build in the same order used by the GitHub Pages workflow.
- Local Playwright workers are capped for stability on file-syncing workspaces.
- Reconnect snapshot recovery and reveal-phase connection controls have focused unit coverage.
- Share text now carries judge-mode, daily-challenge, and friend-score context.
- Gallery share/detail views surface friend judgement results as part of the saved artifact.
- Saved collisions now retain prompt-pair, judge-mode, and daily-mode metadata for richer gallery artifacts.
- Daily challenge cards show completion count, best score, and share-ready completion framing.
- Daily Venn is visible during the first-session path and still routes through onboarding.
- Onboarding/profile copy separates AI Judge, Manual Judge, and Friend Judge.
- Multiplayer UI explicitly calls out the Supabase/schema live-room launch gate when backend services are missing.

## Completed Rehearsal Automation

Scripts (load `.env.local` automatically):

| Command | Purpose |
|---------|---------|
| `npm run check:hosted-env` | Validate Supabase/Gemini env vars |
| `npm run check:supabase-rpcs` | Probe launch-gate Supabase RPCs |
| `npm run rehearsal:preflight` | Env + RPC + full `verify:release` |
| `npm run rehearsal:preflight:fast` | Env + RPC only (skip verify) |
| `npm run smoke:production` | Quick deployed landing smoke |
| `npm run rehearsal:checklist` | Print manual two-browser checklist |
| `npm run init:env` | Create `.env.local` from `.env.example` |
| `npm run check:edge-functions` | Probe deployed Supabase edge functions |
| `npm run rehearsal:run` | Full pipeline: preflight + smoke + deployed E2E |
| `npm run rehearsal:status` | Local env readiness summary (no network) |
| `npm run launch:gate` | Automated launch gate (status, RPC/edge probes, smoke, deployed E2E) |
| `npm run setup:backend` | Backend setup orchestrator + env sync guide |
| `npm run sync:env` | Merge Vercel production `VITE_*` into `.env.local` |
| `npm run check:vercel-env` | Verify required vars on Vercel production |
| `npm run configure:supabase` | Write Supabase creds to `.env.local` + Vercel |
| `npm run configure:github-secrets` | Set GitHub Actions secrets (`PRODUCTION_URL`, optional Supabase) |
| `PRODUCTION_URL=… npm run test:e2e:rehearsal` | Deployed memes/videos + status E2E |

See [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) for the manual launch gate.

## Completed (Balanced Roadmap Pass)

- Canonical judge model documented in [JUDGE_MODEL.md](JUDGE_MODEL.md); shared helpers in `src/lib/judgeMode.js`.
- Telemetry bridge to analytics + optional PostHog via `VITE_POSTHOG_KEY`; Sentry via existing `VITE_SENTRY_DSN`.
- Multiplayer sync messaging (`roomSyncState`, enhanced `ConnectionBanner`) and hosted-rehearsal CI workflow.
- Post-reveal share CTAs prioritize friend judging on high scores; share cards show judge mode.
- OG link previews implemented in `supabase/functions/og-tags`; `getOgShareUrl()` in share service.
- Gallery: best-of-week filter, download share card, unified judge labels.
- Lobby progress panel (best score, streak, favorite theme, weekly daily stats).
- Local preview badges on shop, ranked, and tournaments.
- New themes: Cosmic Drift and Kitchen Chaos.
- PWA install prompt deferred until after first round played.
- Tests: ConnectionBanner, Shop, ThemeBuilder, TournamentLobby, judgeMode, initTelemetry, profile summary.
- Updated [TESTING_SETUP_SUMMARY.md](TESTING_SETUP_SUMMARY.md) and README known-live-limitations section.

## Completed (Follow-Up Pass)

- Host-exit recovery: `roomClosureReason` banner when host leaves; late-join toast on mid-round join.
- i18n wired for lobby progress, gallery filters, local preview badge, and connection banner.
- `createJudgeShareLinks()` pairs playable URL with OG preview URL; Reveal telemetry tracks preview availability.
- Local preview badges on Shop and Ranked panels.
- Rehearsal helpers: `npm run deploy:edge-functions`, `npm run rehearsal:telemetry`.
- Mobile submit button test updated for touch-target CTA.

## Completed (Rehearsal Tooling Pass)

- `npm run init:env` bootstraps `.env.local` from `.env.example`.
- `npm run check:edge-functions` probes resolve-image, resolve-meme, score-submission, og-tags.
- `npm run rehearsal:run` chains preflight, production smoke, deployed E2E, checklist, and telemetry guide.
- RPC probe includes `get_shared_round_by_token` (OG previews).
- Social share uses `previewUrl` for Facebook/LinkedIn/Web Share when available.
- RoomContext test covers host-leave closure state.

## Completed (Media Loading Pass)

- Shared media pipeline in `src/lib/mediaLoad.js`: blur placeholders, Giphy preview URLs, responsive srcset, deduped preload cache.
- `resolveSelectedAssets()` resolves Pexels images and Giphy memes **in parallel**.
- `loadSelectedAssets()` / `loadRoundAssets()` resolve + warm browser cache before display.
- `MediaLoadingShell` component for consistent spinners + blur-up across Venn circles.
- **Images:** Pexels/Unsplash/Picsum blur placeholders; responsive srcset for Pexels + Unsplash.
- **Memes:** Progressive load (200w Giphy preview → full GIF); blur fallback from static URL.
- **Videos:** YouTube posters auto-filled; lazy iframe mount with poster blur; native video uses `preload="metadata"` + poster shell.
- Round shows "Sharpening media…" badge while API resolve + preload completes.
- Gallery cards use blur-up placeholders during lazy load.

## Completed (Media Wiring + Rehearsal Status Pass)

- `useResolvedRoundAssets` hook shared across judge, challenge, and multiplayer round surfaces.
- CDN `preconnect` hints in `index.html` + runtime `initMediaHints()` (includes Supabase when configured).
- i18n for `round.sharpeningMedia` and `round.loadingRound` (EN + ES).
- `npm run rehearsal:status` — local summary of env readiness without network.
- Judge/challenge/multiplayer flows use the same resolve + preload pipeline as solo rounds.

## Completed (Production Hardening Pass)

- Server-only Gemini scoring gate via `src/lib/productionMode.js` (client Gemini disabled in prod when Supabase is configured).
- Shared edge security module: CORS allowlist (`APP_URL` / `ALLOWED_ORIGINS`), rate limits, input sanitization.
- Vercel security headers + CSP in `vercel.json`; hidden source maps in production builds.
- Content moderation: `content_reports` table + `report_content` / `list_content_reports` RPCs; gallery report button; backend-aware moderation service.
- PWA: build-time manifest generation per host base path; SW v2 with offline fallback; base-path-aware SW registration.
- Privacy Policy + Terms pages with footer links on all solo/multiplayer layouts.
- CI: `.github/workflows/production-smoke.yml` (daily + on main push); `.github/SECRETS.template.md`.
- Updated `DEPLOYMENT.md`, `.env.example`, RPC probe for moderation functions.

## Next Hosted Rehearsal (requires your credentials)

See [SETUP_BACKEND.md](SETUP_BACKEND.md) for the full checklist. Summary:

1. Create a Supabase project and run `supabase/schema.sql`.
2. Run `npm run configure:supabase` with your URL + anon key (or set manually).
3. Apply edge secrets and `npm run deploy:edge-functions`.
4. Sync CI secrets: `npm run configure:github-secrets`.
5. Rotate invalid Gemini key in Google Cloud + Vercel if scoring fails.
6. Run `npm run launch:gate` then `npm run rehearsal:run`.
7. Complete manual checks in PRODUCTION_REHEARSAL.md §4–6; update PRODUCTION_TEST_REPORT.md.
8. Optional: set `VITE_SENTRY_DSN` / `VITE_POSTHOG_KEY` after telemetry validation.

## Manual Live Checks

- Verify solo play with Gemini enabled.
- Verify solo fallback behavior with Gemini unavailable.
- Play a memes & videos round (custom uploads + stock pool).
- Generate a friend-judging link and submit a judgement from another browser.
- Create and join a multiplayer room across two browsers.
- Verify manual voting, results finalization, reconnect, and late join during reveal/results.
- Confirm telemetry events arrive through `window.__VWF_TELEMETRY__` or `vwf:telemetry`.

## Product Follow-Ups After Rehearsal

- Document any hosted-only limitation found during live testing (see README and PRODUCTION_TEST_REPORT Known Live Limitations).
- Tighten copy or recovery states for disconnects, host exits, and late joins if rehearsal exposes confusion.
- Optional production monitors: set `VITE_SENTRY_DSN` and/or `VITE_POSTHOG_KEY` after confirming telemetry events in rehearsal.
- Judge mode canonical decisions are documented in [JUDGE_MODEL.md](JUDGE_MODEL.md).

## Do Not Prioritize Yet

- Native mobile apps.
- Monetization tuning.
- Large-scale public matchmaking.
- Net-new game modes unrelated to the core connection mechanic.

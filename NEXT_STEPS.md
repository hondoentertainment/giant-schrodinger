# Next Steps

This file tracks remaining work after the memes & videos mode pass and world-class implementation. The app is locally feature-complete for solo play, friend judging, gallery/history, retention, accessibility polish, and Supabase-backed multiplayer code paths.

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

## Next Hosted Rehearsal (requires your credentials)

1. Run `npm run rehearsal:status` to see what's configured.
2. Fill `.env.local` from `.env.example` (`npm run init:env` if missing).
2. Apply `supabase/schema.sql` in the Supabase SQL editor.
3. Set Supabase Edge Function secrets: `PEXELS_API_KEY`, `GIPHY_API_KEY`, `GEMINI_API_KEY`.
4. Deploy edge functions: `resolve-image`, `resolve-meme`, `score-submission`, `og-tags` (`npm run deploy:edge-functions` for CLI steps).
5. Run `npm run rehearsal:preflight` (or `npm run rehearsal:run` for the full automated pipeline).
6. Deploy from `main` with GitHub secrets or Vercel env vars set.
7. Run `npm run smoke:production` and `PRODUCTION_URL=… npm run test:e2e:rehearsal`.
8. Run `npm run rehearsal:telemetry` then complete manual checks in PRODUCTION_REHEARSAL.md sections 4–6.

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

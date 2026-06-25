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
| `PRODUCTION_URL=… npm run test:e2e:rehearsal` | Deployed memes/videos + status E2E |

See [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) for the manual launch gate.

## Next Hosted Rehearsal (requires your credentials)

1. Fill `.env.local` from `.env.example`.
2. Apply `supabase/schema.sql` in the Supabase SQL editor.
3. Set Supabase Edge Function secrets: `PEXELS_API_KEY`, `GIPHY_API_KEY`, `GEMINI_API_KEY`.
4. Deploy edge functions: `resolve-image`, `resolve-meme`, `score-submission`.
5. Run `npm run rehearsal:preflight`.
6. Deploy from `main` with GitHub secrets or Vercel env vars set.
7. Run `npm run smoke:production` and `PRODUCTION_URL=… npm run test:e2e:rehearsal`.
8. Complete manual checks in PRODUCTION_REHEARSAL.md sections 4–6.

## Manual Live Checks

- Verify solo play with Gemini enabled.
- Verify solo fallback behavior with Gemini unavailable.
- Play a memes & videos round (custom uploads + stock pool).
- Generate a friend-judging link and submit a judgement from another browser.
- Create and join a multiplayer room across two browsers.
- Verify manual voting, results finalization, reconnect, and late join during reveal/results.
- Confirm telemetry events arrive through `window.__VWF_TELEMETRY__` or `vwf:telemetry`.

## Product Follow-Ups After Rehearsal

- Document any hosted-only limitation found during live testing.
- Tighten copy or recovery states for disconnects, host exits, and late joins if rehearsal exposes confusion.
- Consider a hosted analytics or error-monitoring sink once the telemetry event list is confirmed.

## Do Not Prioritize Yet

- Native mobile apps.
- Monetization tuning.
- Large-scale public matchmaking.
- Net-new game modes unrelated to the core connection mechanic.

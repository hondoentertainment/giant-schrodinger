# Next Steps

This file tracks the remaining work after the world-class implementation pass. The app is locally feature-complete for solo play, friend judging, gallery/history, retention, accessibility polish, and Supabase-backed multiplayer code paths.

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

## Next Hosted Rehearsal

These steps require deployed environment access and real service credentials:

1. Apply `supabase/schema.sql` to the target Supabase project.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment host.
3. Configure `VITE_GEMINI_API_KEY` if live AI judging is part of the launch.
4. Deploy from `main`.
5. Run `npm run verify:release` locally before or during the release candidate.
6. Follow `PRODUCTION_REHEARSAL.md` on the deployed site.

## Manual Live Checks

- Verify solo play with Gemini enabled.
- Verify solo fallback behavior with Gemini unavailable.
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

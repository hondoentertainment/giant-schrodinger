# Production Rehearsal

Run this once before the first public launch and again before any major release.

## 1. Backend migration

1. Apply `supabase/schema.sql` in the Supabase SQL editor.
2. Confirm the new RPCs exist:
   - `create_room_session`
   - `join_room_session`
   - `create_shared_round`
   - `submit_round_judgement`
   - `cast_room_vote`
   - `finalize_room_votes`
3. Confirm the old anonymous write policies are gone and only read policies remain.

## 2. Secrets and hosting

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the target host.
2. Set `VITE_GEMINI_API_KEY` if live AI judging is part of the launch.
3. Deploy a fresh build from `main`.

## 3. Core smoke test

1. Run `npm run lint`
2. Run `npm run test`
3. Run `npm run test:e2e:desktop`
4. Run `npm run build`
5. Open the deployed site and confirm the runtime status card reflects the expected services.

## 4. Live product rehearsal

1. Solo flow with Gemini enabled:
   - Complete a round and confirm live AI scoring and image generation.
2. Solo flow without Gemini:
   - Confirm mock scoring and curated image fallback messaging.
3. Friend judging:
   - Generate a share link.
   - Open it in another browser.
   - Submit a judgement.
   - Confirm feedback appears back in the original session/gallery.
4. Multiplayer with at least two browsers:
   - Create room.
   - Join room.
   - Start round.
   - Submit answers from both players.
   - Vote from both players in manual mode.
   - Finalize results and confirm both browsers show the same winner.
   - Refresh or join from a third browser during results and confirm it hydrates the current round instead of dropping into the lobby.
   - Advance to the next round and confirm room sync still works.

## 5. Observability check

1. Add a temporary sink in the browser console:
   ```js
   window.__VWF_TELEMETRY__ = [];
   ```
2. Exercise solo, judging, and multiplayer flows.
3. Confirm structured entries appear for:
   - `multiplayer_room_created`
   - `multiplayer_room_joined`
   - `multiplayer_votes_finalized`
   - `ai_mock_score_fallback` when Gemini is unavailable
   - `fusion_image_fallback` when image generation falls back
4. If you wire a production monitor later, point it at the `vwf:telemetry` browser event or `window.__VWF_TELEMETRY__` sink.

## 6. Launch gate

Do not ship if any of these fail:

- Secure Supabase RPCs are missing
- Multiplayer manual voting produces different winners across browsers
- Friend judging links fail to resolve
- Lint, tests, e2e, or build are red
- Runtime status card disagrees with the deployed environment

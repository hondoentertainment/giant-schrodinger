#!/usr/bin/env node
/**
 * Prints browser console steps to validate telemetry during hosted rehearsal.
 */
console.log(`
Telemetry validation (browser devtools)

1. Open the deployed site and paste in the console:

   window.__VWF_TELEMETRY__ = [];
   window.addEventListener('vwf:telemetry', (e) => window.__VWF_TELEMETRY__.push(e.detail));

2. Exercise flows:
   - Solo round complete
   - Friend-judge share created
   - Multiplayer room create/join/vote finalize

3. Inspect captured events:

   window.__VWF_TELEMETRY__.map((e) => e.name)

Expected event names include:
   - first_session_round_submitted
   - friend_judge_share_created
   - multiplayer_room_created
   - multiplayer_room_joined
   - multiplayer_votes_finalized

4. Optional production sinks (Vercel env):
   - VITE_POSTHOG_KEY + VITE_POSTHOG_HOST
   - VITE_SENTRY_DSN

After confirming events, run: npm run rehearsal:checklist
`);

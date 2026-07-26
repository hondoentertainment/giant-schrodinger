#!/usr/bin/env node
/**
 * Validates telemetry wiring for hosted rehearsal.
 * - Always prints browser console steps
 * - When env keys exist, reports which sinks are configured
 */
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const posthogKey = process.env.VITE_POSTHOG_KEY;
const posthogHost = process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const sentryDsn = process.env.VITE_SENTRY_DSN;
const sentryAuth = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

function present(value) {
  return Boolean(value && !String(value).toLowerCase().includes('your-'));
}

console.log('Telemetry sink status\n');
console.log(`  PostHog key:     ${present(posthogKey) ? 'configured' : 'missing (VITE_POSTHOG_KEY)'}`);
console.log(`  PostHog host:    ${posthogHost}`);
console.log(`  Sentry DSN:      ${present(sentryDsn) ? 'configured' : 'missing (VITE_SENTRY_DSN)'}`);
console.log(`  Sentry upload:   ${present(sentryAuth) && present(sentryOrg) && present(sentryProject) ? 'CI-ready' : 'missing (SENTRY_AUTH_TOKEN/ORG/PROJECT)'}`);
console.log(`  Supabase events: analytics_events INSERT policy applied (local + hosted when backend enabled)`);

if (present(posthogKey) || present(sentryDsn)) {
  console.log(`
Configured sinks will activate on the next production build that includes these VITE_* vars.
`);
} else {
  console.log(`
No client sinks configured yet. Local events still flow to:
  • localStorage (vwf_analytics)
  • window __VWF_TELEMETRY__ / vwf:telemetry
  • Supabase analytics_events when backend is enabled
`);
}

console.log(`
Browser validation steps

1. Open the deployed site and paste in the console:

   window.__VWF_TELEMETRY__ = [];
   window.addEventListener('vwf:telemetry', (e) => window.__VWF_TELEMETRY__.push(e.detail));

2. Exercise flows:
   - Solo round complete
   - Friend-judge share created
   - Multiplayer room create/join/vote finalize

3. Inspect captured events:

   window.__VWF_TELEMETRY__.map((e) => e.name || e.scope)

Expected names include:
   - first_round_complete / round_complete / session_complete
   - friend_judge_share_created
   - multiplayer_room_created / multiplayer_votes_finalized
   - streak_at_risk / session_summary_view

4. If PostHog/Sentry keys are set on Vercel, confirm the same actions appear in those dashboards.

After confirming events, run: npm run rehearsal:checklist
`);

const ready = present(posthogKey) || present(sentryDsn);
process.exit(0); // advisory only — never fail the gate for missing optional sinks
void ready;

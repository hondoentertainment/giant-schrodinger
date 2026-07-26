#!/usr/bin/env node
/**
 * Prints the manual hosted rehearsal checklist for copy/paste into PRODUCTION_TEST_REPORT.md
 */
console.log(`
Venn with Friends — Manual Hosted Rehearsal Checklist
=====================================================

Automated preflight: npm run rehearsal:preflight
Deployed smoke:       npm run smoke:production
Deployed E2E:         PRODUCTION_URL=https://your-site npm run test:e2e:rehearsal

Manual checks (two browsers):
[ ] Solo with Gemini — live AI score + fusion image
[ ] Solo without Gemini — mock score + fallback art messaging
[ ] Memes & videos round (stock + optional custom upload)
[ ] Friend-judge link opened in incognito; judgement persists
[ ] Multiplayer create/join, submit, vote, finalize — same winner both browsers
[ ] Reconnect during reveal/results; late join hydrates current phase
[ ] Telemetry events in window.__VWF_TELEMETRY__ or vwf:telemetry

Document any failures in PRODUCTION_TEST_REPORT.md → Known Live Limitations.
`);

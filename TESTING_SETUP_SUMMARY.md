# Testing & Deployment Setup - Summary

**Last updated:** July 14, 2026  
**Authoritative live status:** [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md)

## Test Infrastructure

### Automated Tests

| Suite | Count (July 14, 2026) | Runner |
|---|---|---|
| Unit / integration | **688 tests** across **68 files** | Vitest + Testing Library |
| E2E | **11 spec files** | Playwright |

**Unit/Integration** covers core flows, multiplayer helpers, media/memes, social/share, retention, telemetry, judge mode, ConnectionBanner, Shop/Ranked shells, and Gemini fallbacks.

**Playwright E2E specs**:

- `e2e/solo-flow.spec.js` — Full solo round from lobby to results
- `e2e/multiplayer-flow.spec.js` — Room creation, joining, gameplay
- `e2e/multiplayer-disconnect.spec.js` — Reconnect scenarios
- `e2e/judge-share.spec.js` — Share link generation and judge interface
- `e2e/memes-videos-flow.spec.js` — Memes & videos mode
- `e2e/responsive.spec.js` — Mobile and tablet layout breakpoints
- `e2e/accessibility.spec.js` — Focus management, ARIA labels, keyboard nav
- `e2e/error-paths.spec.js` — Error handling
- `e2e/visual-smoke.spec.js` — Visual regression smoke
- `e2e/deployed-rehearsal.spec.js` — Production URL checks
- `e2e/legal-pages.spec.js` — Privacy / Terms pages
- `e2e/hosted-two-browser.spec.js` — Live multiplayer + friend-judge across two browsers (`PRODUCTION_URL`)

### Running Tests

```bash
npm run test              # Unit tests (688+)
npm run test:coverage     # With coverage report
npm run test:e2e:desktop  # Desktop E2E
npm run test:e2e:rehearsal # Deployed smoke E2E
npm run test:e2e:hosted   # Two-browser production rehearsal
npm run verify:release    # Lint + unit + E2E + build (release gate)
npm run launch:gate       # Hosted env + RPC + edge + smoke + rehearsals
npm run rehearsal:preflight  # Hosted env + RPC + verify:release
```

### Hosted Rehearsal CI

When GitHub secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `PRODUCTION_URL` are set, `.github/workflows/hosted-rehearsal.yml` runs env/RPC preflight and deployed E2E on `main`.

### Manual QA

- [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) — Launch gate checklist
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) — Step-by-step flows
- [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) — Pre-release QA
- [FAST_TRACK_CHECKLIST.md](FAST_TRACK_CHECKLIST.md) — 15-minute smoke
- [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) — Feature expectations

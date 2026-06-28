# Testing & Deployment Setup - Summary

## Test Infrastructure

### Automated Tests

The project has **600+ tests across 60+ test files** (see latest `PRODUCTION_TEST_REPORT.md` for the authoritative count):

**Unit/Integration Tests (Vitest + React Testing Library)** — includes core flows, multiplayer, media/memes, social/share, retention systems, telemetry, judge mode helpers, ConnectionBanner, and Shop shell tests.

**Playwright E2E Tests (10 spec files)**:
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

### Running Tests

```bash
npm run test              # Unit tests
npm run test:coverage     # With coverage report
npm run test:e2e:desktop  # Desktop E2E
npm run verify:release    # Lint + unit + E2E + build (release gate)
npm run rehearsal:preflight  # Hosted env + RPC + verify:release
```

### Hosted Rehearsal CI

When GitHub secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `PRODUCTION_URL` are set, `.github/workflows/hosted-rehearsal.yml` runs env/RPC preflight and deployed E2E on `main`.

### Manual QA

- [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) — Launch gate checklist
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) — Step-by-step flows
- [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) — Pre-release QA

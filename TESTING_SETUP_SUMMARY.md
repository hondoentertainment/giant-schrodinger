# Testing & Deployment Setup - Summary

## Test Infrastructure

### Automated Tests

The project has **179 tests across 21 test files**:

**Unit/Integration Tests (16 files, Vitest + React Testing Library)**:
- `src/components/ErrorBoundary.test.jsx`
- `src/hooks/useFocusTrap.test.jsx`
- `src/lib/scoreBands.test.js`
- `src/services/promptPacks.test.js`
- `src/services/achievements.test.js`
- `src/services/ranked.test.js`
- `src/services/asyncPlay.test.js`
- `src/services/customImages.test.js`
- `src/services/judgements.test.js`
- `src/services/gemini.test.js`
- `src/services/storage.test.js`
- `src/services/stats.test.js`
- `src/services/tournaments.test.js`
- `src/services/shop.test.js`
- `src/services/share.test.js`
- `src/services/share.security.test.js`
- `src/features/round/Round.test.jsx`
- `src/features/lobby/Lobby.test.jsx`
- `src/features/reveal/Reveal.test.jsx`
- `src/features/judge/JudgeRound.test.jsx`
- `src/features/gallery/Gallery.test.jsx`

**Playwright E2E Tests (5 spec files)**:
- `e2e/solo-flow.spec.js` -- Full solo round from lobby to results
- `e2e/multiplayer-flow.spec.js` -- Room creation, joining, gameplay
- `e2e/judge-share.spec.js` -- Share link generation and judge interface
- `e2e/responsive.spec.js` -- Mobile and tablet layout breakpoints
- `e2e/accessibility.spec.js` -- Focus management, ARIA labels, keyboard nav

### Running Tests

```bash
# Unit and integration tests
npm run test

# Playwright E2E (desktop)
npm run test:e2e:desktop

# Lint
npm run lint
```

---

## CI/CD Workflows

Two GitHub Actions workflows are configured in `.github/workflows/`:

### deploy.yml (on push to main)
1. Checks out code
2. Installs dependencies (`npm ci`)
3. Runs unit tests (`npm run test`)
4. Installs Playwright browsers
5. Runs E2E tests (`npm run test:e2e:desktop`)
6. Builds production bundle (`npm run build`)
7. Deploys to GitHub Pages

### lighthouse.yml (on pull requests to main)
1. Checks out code, installs, builds
2. Runs Lighthouse CI against thresholds in `lighthouse.config.js`
3. Uploads Lighthouse artifacts

---

## Configuration

### Vite
- `base: '/giant-schrodinger/'` set for GitHub Pages
- Code splitting produces 13 lazy chunks
- Production build: 149 KB gzipped main chunk

### Build Verification
```bash
npm run build    # Should complete with 0 errors
npm run preview  # Preview at http://localhost:4173/giant-schrodinger/
```

---

## Current Stats

| Metric | Value |
|--------|-------|
| Unit/integration tests | 179 |
| Test files | 21 (16 unit + 5 E2E) |
| ESLint errors | 0 |
| Main chunk (gzipped) | 149 KB |
| Lazy chunks | 13 |
| Features | 93 across 5 phases |

---

## Documentation

- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) -- Step-by-step manual testing
- [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) -- Comprehensive QA checklist
- [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) -- Feature specifications
- [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) -- Performance targets and actuals
- [DEPLOYMENT.md](DEPLOYMENT.md) -- Deployment instructions

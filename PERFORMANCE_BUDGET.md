# Performance Budget

## Targets

| Metric | Budget | Status |
|--------|--------|--------|
| Main bundle (gzipped) | < 210 KB | 149 KB -- within budget |
| First Contentful Paint (3G) | < 2.5s | Measured via Lighthouse CI |
| Lighthouse Performance | > 85 | Measured via CI on PRs |
| Lighthouse Accessibility | > 90 | Measured via CI on PRs |
| Lighthouse Best Practices | > 95 | Measured via CI on PRs |
| Lighthouse SEO | > 90 | Measured via CI on PRs |

## Current Actuals

| Metric | Value |
|--------|-------|
| Main chunk (gzipped) | 149 KB |
| Lazy-loaded chunks | 13 |
| Total code-split output | Main + 13 lazy chunks |
| ESLint errors | 0 |

## Lighthouse CI

Lighthouse CI runs on every pull request to `main` via `.github/workflows/lighthouse.yml`. Thresholds are configured in `lighthouse.config.js`.

The CI workflow:
1. Builds the production bundle
2. Runs Lighthouse against the built output
3. Uploads artifacts with the full Lighthouse report
4. Fails the PR check if scores fall below configured thresholds

## Code Splitting Strategy

The build uses Vite's automatic code splitting. Each feature directory under `src/features/` is lazy-loaded, producing separate chunks for:
- Ranked mode
- Tournament brackets
- Community gallery
- Shop and battle pass
- Achievement panels
- And other feature modules

This keeps the initial load fast while deferring heavier features until they are needed.

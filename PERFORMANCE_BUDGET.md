# Performance Budget

## Budgets (enforced)

These gates are hard-failed on pull requests by `.github/workflows/bundle-budget.yml`
(bundle size) and `.github/workflows/lighthouse.yml` (runtime metrics).

### Bundle size (gzipped)

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| Main chunk (`index-*.js`) | <= 170 KB | `scripts/check-bundle-size.mjs` |
| Any single lazy chunk | <= 50 KB | `scripts/check-bundle-size.mjs` |
| Total JS (sum gzipped) | <= 300 KB | `scripts/check-bundle-size.mjs` |

### Lighthouse (error-level assertions)

| Metric | Budget |
|--------|--------|
| Largest Contentful Paint (LCP) | <= 3500 ms |
| First Contentful Paint (FCP) | <= 2500 ms |
| Total Blocking Time (TBT) | <= 300 ms |
| Cumulative Layout Shift (CLS) | <= 0.1 |
| Performance score | >= 0.85 |
| Accessibility score | >= 0.90 |
| Best Practices score | >= 0.90 |

The following Lighthouse rules are intentionally disabled because they require
a real backend/CDN or are not meaningful against a `staticDistDir` build:
`uses-http2`, `unused-javascript`, `render-blocking-resources`,
`uses-long-cache-ttl`, `is-on-https`, `csp-xss`.

## Actuals (as of commit 0d3c13fadc7db2a88400d101b4253df045f77ccb)

| Metric | Value | Budget | Headroom |
|--------|-------|--------|----------|
| Main chunk (gzipped) | 146.42 KB | 170 KB | ~14% |
| Largest lazy chunk (`Shop`, gzipped) | 4.85 KB | 50 KB | ~90% |
| Total JS (gzipped) | 181.47 KB | 300 KB | ~40% |
| Lazy-loaded chunks | 18 | n/a | n/a |
| ESLint errors | 0 | 0 | n/a |

## Lighthouse CI

Lighthouse CI runs on every pull request to `main` via
`.github/workflows/lighthouse.yml`. Thresholds are configured in
`lighthouse.config.js` (all assertions are `error` level, so a failing metric
fails the PR check).

The CI workflow:
1. Builds the production bundle
2. Runs Lighthouse against the built output (3 runs, median)
3. Uploads artifacts with the full Lighthouse report (plus a
   `temporaryPublicStorage` link commented on the PR)
4. Fails the PR check if any assertion in `lighthouse.config.js` is violated

## Bundle budget CI

`.github/workflows/bundle-budget.yml` installs dependencies, runs `npm run
build`, then runs `npm run check:bundle`. The script (`scripts/check-bundle-size.mjs`)
gzips every `dist/assets/*.js` file using Node's built-in `zlib`, compares each
size to the budgets above, prints a table, and exits non-zero on any
violation.

## Code Splitting Strategy

The build uses Vite's automatic code splitting. Each feature directory under
`src/features/` is lazy-loaded, producing separate chunks for:
- Ranked mode
- Tournament brackets
- Community gallery
- Shop and battle pass
- Achievement panels
- And other feature modules

This keeps the initial load fast while deferring heavier features until they
are needed.

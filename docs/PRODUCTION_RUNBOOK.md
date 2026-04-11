# Production Runbook — Venn with Friends

On-call reference for the Venn with Friends PWA. Keep this document short,
factual, and actionable. If you're reading it at 2 a.m., you should find the
exact command or dashboard link you need in under 30 seconds.

## On-call essentials

When something breaks, check these in order:

1. **Sentry** — crash / exception traffic and release health.
   _TODO: paste project URL_ `https://sentry.io/organizations/<org>/projects/venn-with-friends/`
2. **PostHog** — traffic + funnel anomalies, session counts, event volume.
   _TODO: paste project URL_ `https://us.posthog.com/project/<id>`
3. **Supabase Dashboard** — database, auth, storage, Edge Function logs.
   _TODO: paste project URL_ `https://supabase.com/dashboard/project/<ref>`
4. **GitHub Actions** — latest deploy workflow runs, Lighthouse CI results,
   failing e2e runs. `https://github.com/<org>/giant-schrodinger/actions`
5. **Browser DevTools** on production — verify service worker version,
   manifest, cache state (Application tab → Service Workers / Storage).

## Escalation

- Primary on-call: _TBD_
- Secondary on-call: _TBD_
- Supabase account owner: _TBD_
- Domain / DNS owner: _TBD_
- Incident channel: `#venn-incidents` _TBD_ in Slack / Discord

## Common incidents

### 1. Scoring endpoint returning 429 (rate limit)

**Symptom:** users report "Scoring is down" or Sentry shows a spike of 429s
from the `score-submission` Edge Function.

**Cause:** either per-IP (30/min) or per-user (12/hour) rate limit hit. See
`supabase/functions/score-submission/index.ts`.

**Action:**
1. Check Supabase → Edge Functions → `score-submission` → Logs for the
   offending IP/user prefix.
2. If it's legitimate spike, bump `USER_MAX` / `IP_MAX` + redeploy the
   function. Monitor cost.
3. If it's abuse, add the prefix to a blocklist (follow-up task) and leave
   limits alone.
4. Confirm the client is surfacing a friendly "Slow down" toast, not a
   generic error.

### 2. Main bundle size regression

**Symptom:** Lighthouse CI job fails the performance budget gate, or
`npm run build` reports the main chunk over the warning threshold.

**Action:**
1. Run `npm run build` locally and inspect `dist/assets/*.js` sizes.
2. Identify the new dependency with `npx source-map-explorer dist/assets/*.js`
   (or similar).
3. Either lazy-load the offending feature (wrap with `React.lazy`) or
   register its vendor chunk in `vite.config.js` `manualChunks`.
4. If the regression is unavoidable, update the Lighthouse budget with a
   justification in the PR description.

### 3. Supabase RLS policy blocking legitimate users

**Symptom:** users report "can't save" or Sentry logs `new row violates
row-level security policy` errors.

**Action:**
1. Reproduce by running the failing query in the Supabase SQL editor while
   impersonating the user (`set request.jwt.claim.sub = '<user-uuid>';`).
2. Compare against the migration that introduced the policy
   (`supabase/migrations/*.sql`).
3. Fix via a new migration (`supabase/migrations/<timestamp>_fix_...sql`);
   never edit an applied migration in place.
4. Apply with `supabase db push` and verify in staging before production.

### 4. Sentry noise: errors flooding after a deploy

**Symptom:** Sentry alert channel going off repeatedly immediately after a
release; the same fingerprint dominates.

**Action:**
1. Open the Sentry issue, confirm the release tag matches the latest deploy.
2. If it's a known false positive (third-party script, extension noise):
   add the pattern to `ignoreErrors` / `denyUrls` in
   `src/services/errorMonitoring.js`. Redeploy.
3. If it's a real regression: follow "Deploy rollback" below, then fix on a
   branch.

### 5. PWA stuck on old build (service worker cache)

**Symptom:** users report "I don't see the new feature / fix" even after
hard refresh; screenshot shows stale copy.

**Action:**
1. Verify the deployed `public/sw.js` on the live site returned a new hash
   (DevTools → Network → `sw.js`).
2. Bump `CACHE_NAME` (e.g. `venn-v1` → `venn-v2`) in `public/sw.js`. The
   activate handler already wipes caches whose key doesn't match.
3. Ask affected users to close all tabs and reopen (service worker
   `skipWaiting` / `clients.claim` will promote the new SW on next nav).
4. For truly stuck users, DevTools → Application → Service Workers →
   "Unregister" is the nuclear option.

## Monitoring links

- Sentry: _TODO paste URL_
- PostHog dashboard: _TODO paste URL_
- Lighthouse CI: _TODO paste URL_ (GitHub Actions workflow output)
- Supabase project: _TODO paste URL_
- Status page: _TODO — none yet, create if incidents become frequent_

## Deploy rollback

There is no blue/green — we roll back by reverting the offending commit.

```sh
git revert <sha>         # creates a new commit that undoes <sha>
git push origin main     # triggers the deploy workflow
```

Notes:
- The Lighthouse budget gate runs on every PR. A rollback revert PR must
  still pass it; if the revert itself breaks the budget, escalate rather
  than merging with the budget override.
- Database migrations are NOT automatically reversed — if the bad commit
  introduced a migration, write a compensating migration instead of
  `git revert`-ing the SQL file.

## Feature flag / kill switches

_TODO: we currently have no runtime feature flag service. First thing to add
when we outgrow env vars: a simple `feature_flags` table in Supabase with a
boolean-per-row shape, fetched on app boot and cached in localStorage, with
a 5-minute staleness window. That gives us a kill switch for each growth
feature (auth, push, ranked, etc.) without shipping a new build._

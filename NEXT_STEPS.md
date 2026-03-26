# Next Steps: From Feature-Complete to Production-Ready

## Where You Are Now (March 2026)

**Venn with Friends** has come a long way. The previous roadmap's 19 items are all implemented:

- Core game loop with AI scoring, difficulty settings, and time bonuses
- 7+ game modes (solo, multiplayer, AI battle, tournaments, challenges, daily, async chains)
- Progression systems (streaks, 25+ achievements, battle pass, leaderboards)
- Social features (share cards, quick judge, friend judging, challenge links)
- Personalization (theme builder, shop, custom images, prompt packs)
- UX polish (OG tags, streak counter on lobby, daily countdown, connection explanations)
- Infrastructure (offline mode indicator, error boundary, PWA, sound/haptics)

**All 151 tests pass. Production build succeeds (492 KB gzipped to 137 KB). The game is feature-rich.**

**What's standing between you and a confident launch is code quality, production infrastructure, and the viral loop actually working end-to-end with real users.**

---

## Tier 1: Ship-Blocking (Fix Before Launch)

### 1. Fix 8 ESLint errors
The linter reports 8 errors that should be zero for a production codebase:
- `MAX_STREAK_MULTIPLIER` unused in `battlePass.js`
- `getThemeById` unused import in `dailyChallenge.js`
- `_tiers` unused in `shop.js` (2 occurrences)
- `getOwnedItems` unused in `shop.test.js`
- `byeCount` unused in `tournaments.js`
- `beforeEach` undefined in `test/setup.js` (needs vitest global import)

**Action:** Remove unused variables, add missing import in test setup. These are 10-minute fixes.

### 2. Bundle is a single 492 KB chunk
Everything ships in one JS file. First paint is blocked until the entire app downloads and parses. On a 3G connection, that's 4+ seconds of white screen.

**Action:** Add route-based code splitting. Lazy-load feature modules (`React.lazy` + `Suspense`):
- `features/tournament/` — heavy, rarely accessed
- `features/creator/ThemeBuilder` — niche feature
- `features/ai/AIBattle` — optional mode
- `features/analytics/` — admin-only
- `features/challenge/` — linked entry only

Target: main chunk under 200 KB gzipped.

### 3. OG image is a placeholder
The Open Graph image is a `placehold.co` URL. When someone shares the game on Twitter/Discord/iMessage, they see a generic placeholder instead of a branded preview. This kills the viral loop before it starts.

**Action:** Design a real 1200x630 OG image with the game's branding, a sample Venn diagram, and a "Can you beat my score?" CTA. Host it in the repo's `public/` directory.

### 4. PWA manifest points to non-existent file
`index.html` references `/manifest.json` but no manifest file exists in `public/`. The PWA install prompt won't work.

**Action:** Create `public/manifest.json` with app name, icons, theme color, and display mode. Add at least a 192x192 and 512x512 icon.

### 5. `errorMonitoring.js` listeners never clean up
Global `error` and `unhandledrejection` listeners are added in `errorMonitoring.js` but never removed. In development with hot reload, these stack up.

**Action:** Return a cleanup function from `initErrorMonitoring()` and call it in the App component's useEffect cleanup.

---

## Tier 2: Production Readiness (This Week)

### 6. Component test coverage is zero
All 16 test files cover services and utilities. Not a single component (Lobby, Round, Reveal, JudgeRound) has tests. The most critical user flows are untested.

**Action:** Add integration tests for:
- Full round flow: concept display -> text input -> submit -> score reveal
- Judge flow: load shared URL -> quick judge -> submit
- Lobby: streak display renders, daily challenge button works
- Error boundary: recovery button resets state

Use Testing Library (already installed) + MSW (already configured).

### 7. Deploy to GitHub Pages
The GitHub Actions workflow exists (`.github/workflows/deploy.yml`) and the production build works, but GitHub Pages isn't enabled in the repo settings.

**Action:** Enable GitHub Pages (Source: GitHub Actions) in repository settings. Push to trigger deployment. Verify the app loads at `https://hondoentertainment.github.io/giant-schrodinger/`.

### 8. Real Supabase backend for production
The offline mode indicator is good, but the game needs a real backend for any meaningful multiplayer, leaderboard, or social feature to work. Without it, every user is playing in isolation.

**Action:**
- Create a Supabase project
- Set up tables for: users, rounds, leaderboards, challenges, rooms
- Add Row Level Security policies
- Configure environment variables in GitHub Actions secrets
- Document the schema in `SETUP.md`

### 9. Rate-limit Gemini API calls
`scoreSubmission` calls the Gemini API on every round with no throttling. A single user spamming rounds could burn through API quota.

**Action:** Add client-side rate limiting (max 1 API call per 5 seconds) and a server-side proxy via Supabase Edge Functions that enforces per-user quotas.

---

## Tier 3: Growth & Retention (This Month)

### 10. Dynamic OG tags for shared links
The static OG tags show the same preview for every link. Challenge and judge URLs should show the actual score, concept pair, and player name in the preview card.

**Action:** This requires server-side rendering or a serverless function that returns custom HTML for shared URLs. Use Supabase Edge Functions or Cloudflare Workers to serve dynamic `<meta>` tags based on the URL parameters.

### 11. Onboarding flow for new players
First-time users land on a lobby with 15+ buttons and no guidance. The `OnboardingModal` exists but only shows on first visit and doesn't guide through an actual round.

**Action:** Add a guided first-round experience:
- Auto-start a tutorial round with curated "easy" concepts
- Show tooltips explaining the Venn diagram and scoring
- Celebrate the first score with extra fanfare
- Then show the full lobby

### 12. Push notifications (complete the loop)
The service worker is registered but push subscriptions aren't implemented. The notification triggers are defined in `notifications.js` but don't fire.

**Action:** Implement web push via the Push API:
- Streak expiration warnings (3 hours before midnight)
- Daily challenge availability
- Friend challenge received
- Use Supabase Edge Functions as the push server

### 13. Analytics pipeline
`trackEvent` calls exist throughout the codebase but data goes nowhere. Without analytics, you can't measure retention, virality, or funnel drop-off.

**Action:** Wire `trackEvent` to a lightweight analytics service (Plausible, PostHog, or Supabase's built-in analytics). Priority metrics:
- DAU/WAU/MAU
- Round completion rate
- Share rate (shares per session)
- D1/D7 retention
- Daily challenge participation rate

### 14. Error monitoring in production
The `ErrorBoundary` catches React errors and `errorMonitoring.js` catches global errors, but both just `console.error`. In production, errors are invisible.

**Action:** Integrate Sentry (free tier). Wire the existing error boundary and global handlers to report to Sentry with user context (anonymous ID, game mode, round number).

---

## Tier 4: Competitive Edge (This Quarter)

### 15. Accessibility audit
The app has some a11y basics (skip link, focus trap, ARIA labels on some buttons) but lacks:
- ARIA live regions for score announcements
- Keyboard navigation through all game modes
- Screen reader announcements for timer countdown
- Color contrast verification (purple-on-dark may fail WCAG AA)
- Reduced motion support for animations

**Action:** Run axe-core in tests, add `prefers-reduced-motion` media queries, ensure all interactive elements are keyboard-navigable.

### 16. Internationalization (i18n)
All strings are hardcoded in English. For a viral game, supporting Spanish, Portuguese, French, and Japanese would significantly expand the addressable market.

**Action:** Extract all user-facing strings to a translation file. Use a lightweight i18n library (e.g., `react-intl` or a simple JSON-based approach). Start with 2-3 languages.

### 17. Discord bot integration
`/venn challenge @friend` — play directly in Discord. This is still the highest-leverage distribution channel for this type of game. The game's social mechanics (challenge links, judging) map perfectly to Discord interactions.

### 18. Leaderboard anti-cheat
With mock scoring enabled by default (no API key), any user can submit fake scores. The leaderboard has no server-side validation.

**Action:** All scoring must happen server-side (Supabase Edge Function calling Gemini). Client submissions should send the concept pair + connection text, and the server returns the score. Never trust client-reported scores.

### 19. Performance optimization
- Multiple `setInterval` timers run independently (countdown, daily timer, etc.) — consolidate into a single tick
- Large components like `Lobby.jsx` and `App.jsx` should be split into smaller components to reduce re-render scope
- Add `React.memo` to pure display components (score cards, stat displays)
- Consider `useDeferredValue` for non-critical UI updates during gameplay

---

## What NOT to Build Yet

- **Native mobile app** — PWA is sufficient until 10k+ DAU
- **Monetization optimization** — shop and battle pass exist; don't tune revenue before retention
- **Seasonal ranked mode** — needs critical mass for matchmaking
- **Video export/replay** — cool but doesn't drive growth
- **AI-generated concept images** — the placeholder images work; focus on gameplay first
- **More game modes** — 7+ modes is already too many for a new user to understand; polish what exists

---

## Priority Order

```
Week 1:  Fix lint errors (#1), add OG image (#3), create manifest.json (#4)
Week 1:  Code-split the bundle (#2), fix error monitor cleanup (#5)
Week 2:  Deploy to GitHub Pages (#7), component tests (#6)
Week 2:  Set up Supabase backend (#8), rate-limit API (#9)
Week 3:  Onboarding flow (#11), dynamic OG tags (#10)
Week 4:  Push notifications (#12), analytics (#13), Sentry (#14)
Month 2: Accessibility (#15), anti-cheat scoring (#18), performance (#19)
Month 3: i18n (#16), Discord bot (#17)
```

The game's feature set is genuinely impressive for a solo project. The gap now isn't features — it's the infrastructure that makes features *trustworthy* in production: real backend, real monitoring, real analytics, and a viral loop that works with actual hosted URLs instead of localhost. Close that gap and you have something worth sharing widely.

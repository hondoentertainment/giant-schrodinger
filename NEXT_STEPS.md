# Next Steps: From Good Game to World-Class

## Where You Are Now

The core game loop is strong: two concepts → creative connection → AI or human scoring → fusion image. You've built an impressive feature set — streaks, achievements, daily challenges, battle pass, theme builder, multiplayer, leaderboards, sound, haptics, and solid mobile UX. The codebase is clean React with Vite, localStorage-first with optional Supabase.

**Current health:** 151 tests passing across 16 test files. CI/CD deploys to GitHub Pages on push to main. Dependencies are modern and well-maintained. Mobile responsiveness is excellent (44px touch targets, portrait-primary PWA).

**What separates this from a world-class game isn't more features — it's closing gaps in the features you have and nailing the live infrastructure.**

---

## Tier 1: Ship-Blocking Issues (Fix Before Launch)

### 1. AI scoring strictness is inverted
**File:** `src/services/aiFeatures.js:9-28` and `src/services/gemini.js:25-41`

The `DIFFICULTY_CONFIGS` define `scoringStrictness` as easy: 1.3, hard: 0.7. The `applyDifficulty()` function in `gemini.js` **multiplies** scores by this value. This means easy mode inflates scores (1.3x) and hard mode deflates them (0.7x) — which *sounds* correct at first glance, but the descriptions say "Lenient scoring" for easy and "Strict scoring" for hard. The actual behavior matches the descriptions, but the variable name `scoringStrictness` is misleading. **Verify the intended design:** if "easy = lenient = higher scores" is correct, rename the variable to `scoreMultiplier` for clarity. If the intent was "easy = more forgiving judging criteria" (not score inflation), the formula should divide instead of multiply.

**Action:** Clarify design intent, then either rename for clarity or invert the formula. Add unit tests for `applyDifficulty()` with each difficulty level to lock in expected behavior.

### 2. `timeBonus` from difficulty config is never applied
**File:** `src/services/aiFeatures.js:14` defines `timeBonus: 15` (easy) and `timeBonus: -10` (hard)
**File:** `src/context/GameContext.jsx` — no reference to `timeBonus` or `getDifficultyConfig`

The round timer ignores difficulty settings entirely. All difficulty levels play with identical time pressure.

**Action:** In `GameContext.jsx` or the `Round` component, read `getDifficultyConfig(getAIDifficulty()).timeBonus` and apply it to the round timer when starting a new round. Add a test to verify the timer adjustment.

### 3. Test coverage gaps on critical paths
**Current state:** 16 test files, 151 tests passing. Services layer has decent coverage (storage, share, stats, achievements, shop, tournaments, ranked, asyncPlay, judgements, gemini, promptPacks, customImages, scoreBands). Components and integration paths are largely untested.

**Untested critical paths:**
- `applyDifficulty()` in `gemini.js` — the scoring strictness logic has zero tests
- `GameContext` state transitions — `startSession` → `beginRound` → `completeRound` → `nextRound` → `endSession`
- Round modifier score calculations (doubleOrNothing threshold, daily challenge 1.5x multiplier)
- Battle pass XP progression
- Multiplayer room sync (`src/services/multiplayer.js`)
- Notification scheduling

**Action:** Prioritize tests for `applyDifficulty()` (to validate the strictness fix), `GameContext` state machine, and round modifier scoring. Target 70%+ coverage on `/services/`. Run `npm run test:coverage` to get a baseline.

### 4. Backend silently degrades
Everything meaningful (leaderboards, multiplayer, challenges, referrals) requires Supabase, but the app silently falls back to localStorage when not configured:
- Leaderboards are local-only (you're always #1)
- Multiplayer rooms don't persist across sessions
- Challenge links only work on the same device
- Referral tracking is non-functional

**Action:** Add a visible "offline mode" banner when `VITE_SUPABASE_URL` is not set, so users understand the limitation. Consider making Supabase a hard requirement for production deployments.

---

## Tier 2: High-Impact, Low-Effort (This Week)

### 5. Open Graph meta tags for share links
Every shared link is a plain URL with no preview card. Adding dynamic OG tags to challenge/judge links (score, fusion image, "Can you beat this?" CTA) is the single highest-leverage growth change. Since this is a SPA deployed to GitHub Pages, use a pre-rendering approach or a serverless function at the share URL endpoint.

### 6. Visual share cards
Replace plain-text sharing with canvas-generated image cards: fusion image + score + player name + "Beat my 8/10!" Works on Twitter, Discord, iMessage. The `SocialShareButtons` component already exists — upgrade it to generate and attach an image.

### 7. Streak counter on lobby screen
Streaks exist but are buried in session summary. Put a large, animated streak counter front-and-center on the lobby. "Day 5" with a pulsing animation creates daily return pressure.

### 8. Countdown to next daily challenge
After completing the daily, show "Next challenge in 14h 23m" with a live countdown timer. Creates urgency and a reason to return tomorrow.

### 9. 1-click quick judge
The manual judge form (score slider + relevance dropdown + commentary) has too much friction for casual players. Add three big buttons: "Fire (9-10)", "Solid (7-8)", "Meh (4-6)". Expand for detailed scoring optionally. After judging, prompt: "Now play this round yourself!"

---

## Tier 3: Competitive Differentiation (This Month)

### 10. Real AI opponent mode
`generateAIConnection()` and `getAIOpponentResult()` exist in `src/services/aiFeatures.js:80-117` but are never called from any component. Wire them into a "vs AI" game mode:
- Player submits their connection
- AI generates its own connection (use Gemini for real wit, fall back to templates)
- Both are scored side-by-side
- Winner gets bragging rights + bonus XP
- This is a single-player retention loop that doesn't require friends online

### 11. Connection explanations post-score
`getConnectionExplanation()` exists in `src/services/aiFeatures.js:150-164` but is never displayed. After the score reveal, show the AI's explanation of *why* the connection scored what it did. This is the "learning moment" that makes players improve and come back.

### 12. Async challenge chains
A challenges B → B challenges C → C challenges A. Circular tournaments that play out over days. The challenge link infrastructure and `asyncPlay` service exist — extend them to chain multiple players.

### 13. "Best of Today" gallery
Surface the day's highest-scoring connections on the lobby. Community-visible content creates aspiration ("I want MY connection featured") and gives returning players something to browse.

### 14. Tournament mode
Weekend bracket tournaments: 8-16 players, Swiss format, 5 rounds matched by record. Use existing multiplayer rooms + leaderboard infrastructure + `src/services/tournaments.js`. Exclusive cosmetic rewards for top finishers.

---

## Tier 4: Platform & Growth (This Quarter)

### 15. PWA push notifications
The service worker (`public/sw.js`) is registered but push notifications aren't implemented. Add notifications for:
- "Your 5-day streak expires in 3 hours!"
- "Daily challenge is live!"
- "Your friend just beat your score!"

### 16. Discord bot
`/venn challenge @friend` — play directly in Discord. This is the highest-leverage distribution channel for this type of game.

### 17. Error monitoring (Sentry)
Wire into the existing `ErrorBoundary` (`src/components/ErrorBoundary.jsx`). The `errorMonitoring.js` service already categorizes errors — connect it to a real monitoring dashboard. Track scoring failures, share link errors, multiplayer disconnects.

### 18. Analytics dashboard
`trackEvent` calls exist throughout the codebase (buffered with 5s flush in `src/services/analytics.js`) but go nowhere visible. Wire them to a dashboard tracking:
- K-factor (shares x conversion rate)
- D1/D7/D30 retention
- Daily challenge completion rate
- Time to first share

### 19. Prompt packs & curated concept pairings
The theme system handles visual themes, but concept pairings are random. The `src/services/promptPacks.js` service exists with tests. Add curated packs:
- "Impossible Connections" (Tax Returns + Rollercoasters)
- "Pop Culture Mashup" (movies x food)
- "Deep Thoughts" (philosophy x everyday objects)

Each pack gets its own leaderboard.

---

## Technical Debt & Code Quality

### Accessibility gaps
- **Missing:** ARIA live regions for dynamic score reveals and countdown timers
- **Missing:** Alt text on Venn diagram and fusion images
- **Missing:** Screen reader announcements for multiplayer score updates
- **Present:** Skip link, focus trap (`useFocusTrap` hook), semantic HTML, 44px touch targets
- **Action:** Add `aria-live="polite"` regions for score reveals and timer updates. Add `role="img" aria-label` to Venn diagram SVG.

### Performance opportunities
- **No code splitting:** All 15 feature modules load upfront (~608 KB dist). Use `React.lazy()` for feature routes (Gallery, Shop, Achievements, Tournament) to reduce initial bundle.
- **No image optimization:** Fusion images from Gemini and gallery images have no WebP fallback or size constraints.
- **Good patterns already in place:** IntersectionObserver for lazy gallery images, React.memo/useMemo in 15 components, event buffering in analytics.

### CI/CD improvements
- **Add:** Coverage reporting/enforcement in GitHub Actions (fail build below threshold)
- **Add:** `npm audit` step in CI pipeline
- **Add:** Bundle size tracking (warn on significant growth)
- **Add:** Pre-commit hooks via husky/lint-staged for lint + format
- **Consider:** Staging environment (currently deploys straight to production)

### ESLint configuration
- `react-hooks/exhaustive-deps` is disabled in `.eslintrc.cjs` — this hides dependency bugs in useEffect/useMemo/useCallback. Re-enable and fix any violations.

---

## What NOT to Build Yet

- **Native mobile app** — the PWA is sufficient until you have 10k+ daily actives
- **Monetization/shop optimization** — the battle pass and shop scaffolding exists but don't optimize revenue before you have retention
- **Seasonal ranked mode** — needs a large enough player base for meaningful matchmaking
- **Video export/replay** — cool but doesn't drive growth; build after virality is proven
- **Sponsored themes** — premature until you have brand-worthy traffic
- **TypeScript migration** — valuable long-term but don't let it block feature work

---

## Priority Order

```
Week 1:  Fix scoring strictness (#1), apply timeBonus (#2), add tests for both
Week 1:  OG tags (#5), streak on lobby (#7), daily countdown (#8)
Week 2:  Share cards (#6), quick judge (#9), connection explanations (#11)
Week 2:  Test coverage for GameContext state machine and round modifiers (#3)
Week 3:  AI opponent mode (#10), best-of-today gallery (#13)
Week 4:  Backend requirement/offline indicator (#4), async chains (#12)
Month 2: Push notifications (#15), analytics dashboard (#18), Sentry (#17)
Month 2: Code splitting, a11y live regions, CI coverage enforcement
Month 3: Tournament mode (#14), Discord bot (#16), prompt packs (#19)
```

The game's core mechanic is genuinely fun. The path to world-class is: fix the bugs that undermine trust, close the viral loop so every session ends with a share, and build the single-player retention hooks (AI opponent, explanations, streaks) so players come back even without friends online.

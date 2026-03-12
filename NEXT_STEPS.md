# Next Steps: From Good Game to World-Class

## Where You Are Now

The core game loop is strong: two concepts → creative connection → AI or human scoring → fusion image. You've built an impressive feature set including multiplayer rooms (fully wired with Supabase realtime), a cosmetics shop (Venn Coins, 16 purchasable items), tournaments (bracket + Swiss formats), social sharing (Twitter/FB/LinkedIn/Web Share API), referrals, daily challenges, battle pass (30 tiers), achievements, sound, haptics, and solid mobile UX.

**Current health:** 151 tests passing across 16 test files. CI/CD deploys to GitHub Pages on push to main. Dependencies are modern and well-maintained. Mobile responsiveness is excellent (44px touch targets, portrait-primary PWA).

**What's real vs. scaffolded:**

| Feature | Status | Notes |
|---------|--------|-------|
| Multiplayer rooms | Fully wired | Supabase realtime, room codes, scoring modes |
| Shop cosmetics | Fully wired | 16 items across 5 categories, virtual currency |
| Battle pass | Fully wired | 30 tiers, XP progression, claim system |
| Tournaments | Fully wired | Bracket + Swiss, seeding, weekend auto-generation |
| Social sharing | Fully wired | 5 platforms + clipboard + image download |
| Referrals | Fully wired | Code generation, tracking, 50-coin bonus |
| Daily challenges | Fully wired | Seeded RNG, 31 templates, completion tracking |
| Analytics tracking | Partial | Event buffering works, no visible dashboard |
| Streak tracking | Partial | Bonus multiplier exists, no prominent UI |
| Notifications | Partial | Scheduling works, no push subscription |
| Leaderboards | Partial | Service exists, minimal UI, local-only without backend |
| AI opponent mode | Scaffolded | Functions exist (`generateAIConnection`, `getAIOpponentResult`), never called |
| Connection explanations | Scaffolded | `getConnectionExplanation()` exists, never displayed |

---

## Phase 1: Foundation & Trust (Weeks 1-2)

*Fix the bugs that undermine player trust and establish engineering confidence.*

### 1.1 Resolve AI scoring strictness ambiguity
**Files:** `src/services/aiFeatures.js:9-28`, `src/services/gemini.js:25-41`

The `DIFFICULTY_CONFIGS` define `scoringStrictness` as easy: 1.3, hard: 0.7. `applyDifficulty()` multiplies scores by this value — easy inflates scores, hard deflates them. The descriptions ("Lenient scoring" / "Strict scoring") match this behavior, but the variable name `scoringStrictness` implies the opposite (higher = stricter). Either rename to `scoreMultiplier` for clarity, or invert the formula if the design intent was different.

**Action:** Clarify intent, rename or fix, and add unit tests for `applyDifficulty()` at each difficulty level.

### 1.2 Wire up `timeBonus` to round timer
**Files:** `src/services/aiFeatures.js:14` (+15s easy, -10s hard), `src/context/GameContext.jsx`

The difficulty config defines `timeBonus` values but nothing reads them. All difficulty levels have identical time pressure.

**Action:** In the `Round` component or `GameContext`, apply `getDifficultyConfig(getAIDifficulty()).timeBonus` to the round timer at round start.

### 1.3 Close critical test coverage gaps
**Current:** 16 test files, services layer has decent coverage. Zero tests for:
- `applyDifficulty()` scoring logic
- `GameContext` state machine (`startSession` → `beginRound` → `completeRound` → `nextRound` → `endSession`)
- Round modifier calculations (doubleOrNothing threshold, daily 1.5x multiplier, speed round 1.5x)
- Battle pass XP → tier progression

**Action:** Add tests for the scoring pipeline and GameContext transitions. Run `npm run test:coverage` for a baseline. Target 70%+ on `/services/`.

### 1.4 Add offline mode indicator
**File:** `src/features/lobby/Lobby.jsx` (already has wifi icon)

The app silently degrades when Supabase isn't configured — leaderboards show you as #1, multiplayer doesn't persist, challenges are device-local.

**Action:** Add a visible "Offline Mode" banner explaining limitations. Disable multiplayer/tournament buttons when backend is unavailable rather than letting players discover failures mid-game.

### 1.5 CI/CD hardening
- Add `npm audit` step to `.github/workflows/deploy.yml`
- Add coverage reporting with minimum threshold enforcement
- Re-enable `react-hooks/exhaustive-deps` in `.eslintrc.cjs` and fix violations
- Add pre-commit hooks (husky + lint-staged)

---

## Phase 2: Viral Loop (Weeks 3-4)

*Close the loop so every session ends with a share, and every share brings a new player back.*

### 2.1 Open Graph meta tags for share links
Every shared link is a plain URL with no preview. Challenge links (`#challenge=BASE64`) and judge links (`?judge=UUID`) should show rich preview cards with the score, fusion image, and a "Can you beat this?" CTA. Since this is a GitHub Pages SPA, use a meta tag injection approach in `socialShare.js` (the `setShareMetaTags()` function already exists) or a lightweight serverless edge function.

### 2.2 Canvas-generated visual share cards
Upgrade `SocialShareButtons.jsx` to generate image cards via Canvas API: fusion image + score badge + player name + "Beat my 8/10!" These render as rich previews on Twitter, Discord, and iMessage — dramatically higher click-through than text links.

### 2.3 Prominent streak counter on lobby
Streak tracking exists in the challenges service (`getStreakBonus()` returns 1.0-1.5x multiplier based on `currentStreak`). Surface it front-and-center on the lobby with an animated counter: "Day 5" with a pulsing flame effect. The lobby already shows stats — make the streak the hero element.

### 2.4 Live countdown to next daily challenge
The lobby updates daily challenge status every 60 seconds. After completing today's challenge, replace the "Play Daily" button with a live countdown: "Next challenge in 14h 23m". Creates urgency and a reason to return.

### 2.5 Post-game share prompt
After the score reveal and session summary, add a prominent "Challenge a friend" CTA that pre-fills a share card. The `SocialShareButtons` component exists but isn't integrated into the post-game flow in `Round` or `Reveal` components. Wire the challenge creation (`challenges.js:createChallenge()`) into the session summary screen.

---

## Phase 3: Solo Retention (Weeks 5-8)

*Build single-player loops that keep players coming back without needing friends online.*

### 3.1 AI opponent mode ("vs AI")
`generateAIConnection()` and `getAIOpponentResult()` in `src/services/aiFeatures.js:80-117` are fully implemented but never called. Wire them into a new game mode:
- Player submits their connection
- AI generates its own (Gemini for real wit, template fallback)
- Both scored side-by-side on the reveal screen
- Winner gets bonus XP + bragging rights
- Show AI's connection even when player wins (entertainment value)

This is the highest-impact retention feature because it works without friends and creates a "one more round" loop.

### 3.2 Connection explanations on reveal
`getConnectionExplanation()` in `src/services/aiFeatures.js:150-164` returns tier-based feedback but is never displayed. Show the AI's explanation after score reveal — why it scored what it did, what would have scored higher. This is the "learning moment" that makes players improve and return.

### 3.3 1-click quick judge
The judge form has too much friction. Add three large buttons: "Fire (9-10)", "Solid (7-8)", "Meh (4-6)". Expand for detailed scoring optionally. After judging, prompt: "Now play this round yourself!" — converts judges into players.

### 3.4 "Best of Today" gallery on lobby
Surface the day's highest-scoring connections on the lobby screen. Community-visible content creates aspiration ("I want MY connection featured") and gives returning players something to browse. The Gallery component and storage infrastructure exist — add a daily filter and lobby integration.

### 3.5 Curated prompt packs
`src/services/promptPacks.js` exists with tests. Add themed concept pairings beyond random selection:
- "Impossible Connections" (Tax Returns + Rollercoasters)
- "Pop Culture Mashup" (movies x food)
- "Deep Thoughts" (philosophy x everyday objects)

Each pack gets its own mini-leaderboard, creating collection behavior and replayability.

---

## Phase 4: Competitive & Social (Weeks 9-12)

*Layer competitive depth on top of the now-solid solo and social foundations.*

### 4.1 Weekend tournaments with rewards
The tournament system (`src/services/tournaments.js`) is fully implemented — bracket and Swiss formats, seeding, standings, weekend auto-generation (Fri 6PM - Sun 6PM). The `TournamentLobby.jsx` UI is complete. What's missing:
- Integration with the shop for exclusive cosmetic rewards (tournament-only skins/badges)
- Push notification when a tournament starts
- Lobby promotion (banner for upcoming weekend tournament)

### 4.2 Async challenge chains
A challenges B → B challenges C → C challenges A. Multi-player asynchronous tournaments that play out over days. The challenge URL infrastructure (`challenges.js`) and `asyncPlay` service exist — extend them to track chain state and notify the next player.

### 4.3 Leaderboard UI and backend sync
`src/services/leaderboard.js` has `getPlayerRank()` and `getDailyLeaderboard()` but minimal UI. Build:
- Global leaderboard (all-time top scores)
- Weekly leaderboard (resets Monday)
- Friends leaderboard (players you've challenged)
- Daily challenge leaderboard

Requires Supabase for real rankings. Fall back to local stats with a "Connect to compete globally" CTA.

### 4.4 Multiplayer spectator mode
The room system tracks all submissions and scores. Add a spectator view where non-players can watch rounds unfold in realtime — see submissions appear, scores reveal. This turns multiplayer sessions into entertainment for onlookers and drives word-of-mouth.

### 4.5 Achievement showcase and player profiles
`src/services/achievements.js` tracks badge unlocks. Add a public-facing player profile with:
- Earned badges displayed in a grid
- Equipped cosmetics from shop
- Win/loss record, best scores
- Shareable profile link (drives organic discovery)

---

## Phase 5: Platform & Scale (Months 4-6)

*Grow from a game into a platform with external distribution and production-grade infrastructure.*

### 5.1 PWA push notifications
The service worker (`public/sw.js`) is registered. `src/services/notifications.js` has `scheduleStreakReminder()` (9 PM) and `scheduleDailyChallengeReminder()` (noon) but these use the Notification API without push subscriptions. Implement:
- VAPID key setup + push subscription in service worker
- Server-side push via Supabase Edge Functions
- Triggers: streak expiry warning, daily challenge live, friend beat your score, tournament starting

### 5.2 Discord bot integration
`/venn challenge @friend` — play directly in Discord. Embed the Venn diagram, accept text submissions, return scores. This is the highest-leverage distribution channel for party games. Use Discord Interactions API with a lightweight backend.

### 5.3 Production monitoring
- **Error monitoring:** Wire `src/services/errorMonitoring.js` (already categorizes errors into SCORING, NETWORK, RENDER, etc.) to Sentry or a similar service via the existing `ErrorBoundary`
- **Analytics dashboard:** `src/services/analytics.js` buffers events and computes session metrics (totalSessions, avgScore, shareRate, d1/d7Retention). Wire to a visible dashboard — Supabase + a simple admin view, or export to an external tool
- **Performance:** Add Lighthouse CI to the GitHub Actions pipeline. Track Core Web Vitals over time

### 5.4 Code splitting and performance
All 15 feature modules (~608 KB dist) load upfront. Implement:
- `React.lazy()` for feature routes: Gallery, Shop, Achievements, Tournament, Creator
- Route-based code splitting with Suspense boundaries
- Image optimization: WebP with fallback, max dimensions on fusion images
- Bundle size budget in CI (fail build if bundle grows beyond threshold)

### 5.5 Backend-first architecture migration
Move from localStorage-first to Supabase-first for all persistent data:
- Player profiles, stats, achievements sync to Supabase
- Challenge chains persist across devices
- Leaderboards become real (not local-only)
- Analytics events flush to Supabase instead of localStorage
- Add Row-Level Security policies for all tables
- Rate limiting on Gemini API calls (prevent abuse)
- Keep localStorage as offline cache with sync-on-reconnect

---

## What NOT to Build Yet

- **Native mobile app** — the PWA is sufficient until you have 10k+ daily actives
- **Real-money monetization** — the shop and battle pass scaffolding exists, but optimize retention before revenue
- **Seasonal ranked mode** — needs a large enough player base for meaningful matchmaking
- **Video export/replay** — cool but doesn't drive growth; build after virality is proven
- **Sponsored themes** — premature until you have brand-worthy traffic
- **TypeScript migration** — valuable long-term, but don't let it block feature work
- **React 19 / Tailwind v4 upgrade** — current versions are stable and sufficient

---

## Phase Timeline

```
Phase 1 (Weeks 1-2):   Foundation & Trust
                        Fix scoring bugs, wire timeBonus, close test gaps,
                        offline indicator, CI hardening

Phase 2 (Weeks 3-4):   Viral Loop
                        OG tags, share cards, streak counter, daily countdown,
                        post-game share prompt

Phase 3 (Weeks 5-8):   Solo Retention
                        AI opponent mode, connection explanations, quick judge,
                        best-of-today gallery, prompt packs

Phase 4 (Weeks 9-12):  Competitive & Social
                        Tournament rewards, async chains, leaderboard UI,
                        spectator mode, player profiles

Phase 5 (Months 4-6):  Platform & Scale
                        Push notifications, Discord bot, Sentry/analytics,
                        code splitting, backend-first migration
```

The game's core mechanic is genuinely fun. Each phase builds on the last: **trust** (Phase 1) → **growth** (Phase 2) → **retention** (Phase 3) → **depth** (Phase 4) → **scale** (Phase 5). Don't skip ahead — a viral loop without trust erodes confidence, and competitive features without retention leave tournaments empty.

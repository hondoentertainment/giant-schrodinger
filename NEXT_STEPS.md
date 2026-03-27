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

---

## Phase 2: Image Set & Game Flow Improvements

The current image system uses 82 Unsplash photos across 6 themes (~12 per theme), yielding ~66 unique pairs per theme. The game flow is solid but has friction points in navigation, session management, and concept variety. These improvements focus on making the visual experience richer and the gameplay loop tighter.

---

### Image Set: Tier 1 (High Impact)

#### 20. Responsive image sizes — stop serving 1080px to phones
Every concept image loads at 1080px width regardless of device. On a 375px phone, 75% of those pixels are wasted bandwidth. Unsplash supports dynamic sizing via URL params.

**Action:** Update `buildUnsplashUrl()` in `src/data/themes.js` to accept a `width` parameter. In `VennImage.jsx`, detect viewport width and request appropriately sized images:
- Mobile (<640px): 400px width
- Tablet (640-1024px): 640px width
- Desktop (>1024px): 1080px width

Add `srcset` and `sizes` attributes to `<img>` tags for native browser optimization. This alone could cut image payload by 60% on mobile.

#### 21. Expand concept pool — 12 images per theme isn't enough
With 12 images per theme, a player who does 5 sessions sees repeat concepts quickly. The same "neon city" and "jazz club" appear too often, killing the novelty that makes the game fun.

**Action:** Expand each theme to 24+ images (doubling the pool). This gives ~276 unique pairs per theme before repeats. Source from Unsplash collections:
- Neon Nights: nightlife, street art, neon signs, arcades, cyberpunk architecture
- Wild Nature: macro insects, underwater, aerial landscapes, weather phenomena, animal behavior
- Retro Tech: vintage computers, analog synths, old cameras, rotary phones, cassette tapes
- Ocean Drift: tide pools, coral reefs, surfing, lighthouses, deep sea creatures
- Golden Hour: silhouettes, reflections, long shadows, harvest scenes, desert dunes
- Mystery Box: surreal art, optical illusions, abstract textures, impossible architecture

#### 22. Add concept labels that spark creativity
Currently each image has a label like "City Lights" or "Ocean Waves" — generic nouns. The labels should be more evocative and specific to inspire better connections.

**Action:** Replace bland labels with vivid, specific ones:
- "City Lights" → "3AM Taxi Ride"
- "Forest" → "The Last Tree Standing"
- "Robot" → "Your Phone's Nightmares"
- "Sunset" → "The Sky's Resignation Letter"

Evocative labels prime the player's creativity and make connections more interesting.

#### 23. Concept repetition prevention within session
`buildThemeAssets()` uses `Date.now()` as a random seed and picks 2 from the pool each round — but there's no check against previous rounds in the session. A 7-round session could show the same image 3 times.

**Action:** Track used asset IDs in `GameContext` session state. Pass `excludeIds` to `buildThemeAssets()` and filter them out before shuffling. Reset on new session.

#### 24. Lazy-load concept images with blur-up placeholders
Images pop in abruptly when they load. A blur-up pattern (tiny base64 thumbnail → full image) creates a smoother visual experience.

**Action:** For each Unsplash image, add a `blurHash` or use Unsplash's built-in `w=20&blur=10` param as a tiny placeholder. In `VennImage.jsx`:
1. Show the 20px blurred version immediately (inline base64 or tiny URL)
2. Load full image in background
3. Crossfade from blur to sharp on load

#### 25. Preload next round's images during reveal
Currently images are only preloaded when the Round component mounts. By the time the user reads their score and clicks "Next Round," the next images haven't started loading yet.

**Action:** In `Reveal.jsx`, after scoring completes, call `buildThemeAssets()` for the next round and preload those images in the background. Store them in context so `Round.jsx` can use them instantly.

---

### Image Set: Tier 2 (Polish)

#### 26. Broken image fallback is ugly
When an Unsplash URL fails, the fallback is a Picsum random image that has no relation to the original label. The player sees a random landscape when they expected "Vintage Radio."

**Action:** Improve the fallback chain:
1. Primary: Unsplash URL
2. Secondary: A curated backup Unsplash URL per concept (different photo, same subject)
3. Tertiary: A colored gradient card with the concept label text (always works, always relevant)

#### 27. Video/audio assets are underused
24 videos and 24 audio tracks exist but the media type selector is buried in the lobby. Most players will never discover video or audio mode.

**Action:** Introduce "Mixed Media" mode that randomly assigns image/video/audio per round within a session. Add a first-time tooltip: "Try Video Mode — same game, cinematic concepts!" after the player's 3rd session.

#### 28. Custom image UX needs work
Custom images are stored as base64 data URLs in localStorage (2MB per image, 10MB total). This is fragile — clearing browser data loses everything, and large data URLs slow down rendering.

**Action:**
- Compress images client-side before storing (resize to 800px max, JPEG quality 80)
- Show storage usage indicator ("4.2 MB / 10 MB used")
- If Supabase is configured, sync custom images to cloud storage
- Add an "Export/Import" feature for backup

---

### Game Flow: Tier 1 (High Impact)

#### 29. Add a "Leave Room" button to multiplayer
Once a player joins a multiplayer room, there's no visible way to leave and return to solo play. The only escape is closing the browser tab.

**Action:** Add a "Leave Room" button visible in all multiplayer phases (waiting, playing, revealing). In `RoomContext`, add `leaveRoom()` that unsubscribes from the room channel and resets to LOBBY state.

#### 30. Session resume after accidental navigation
If a player is on Round 3/5 and accidentally taps Gallery or Achievements, then returns to the lobby, their session state persists but there's no obvious "Resume Session" indicator.

**Action:** When the player returns to LOBBY with an active session (roundNumber < totalRounds), show a prominent banner: "Session in progress — Round 3 of 5" with a "Continue" button. Make it visually distinct from the normal "Play" button.

#### 31. AI Battle needs an endpoint
AI Battle mode has no natural ending — it's an infinite loop of rounds against the AI. Players don't know when to stop or what they're working toward.

**Action:** Structure AI Battle as a "Best of 5" format:
- 5 rounds against the AI
- Track wins (player vs AI)
- Show running score: "You: 3 — AI: 1"
- Declare winner after 5 rounds with celebration/commiseration
- Option to rematch or return to lobby

#### 32. Timer precision — use `requestAnimationFrame` instead of `setInterval`
The 1-second `setInterval` timer drifts over time (can be off by 100ms+ per tick). Over a 60-second round, that's potentially 6 seconds of drift. Players notice when they feel cheated out of time.

**Action:** Replace the countdown `setInterval` with a `requestAnimationFrame` loop that tracks elapsed time from `performance.now()`. Display seconds remaining as `Math.ceil(endTime - now)`. This is drift-proof and visually smoother.

#### 33. "Time's up" auto-submit is too slow
When the timer hits 0, there's a 900ms delay before auto-submitting. This creates an awkward pause where the player sees "Time's up!" but nothing happens for almost a second.

**Action:** Reduce the delay to 400ms — just enough for the player to register the message before the transition. The current 900ms feels like lag.

#### 34. Quit button should confirm, not immediately exit
The "Quit" button during a round immediately ends the entire session with no confirmation. One accidental tap loses all progress.

**Action:** Add a confirmation dialog: "Quit session? You'll lose progress on rounds 3-5." with "Keep Playing" (primary) and "Quit" (destructive) buttons. Use the existing modal patterns.

---

### Game Flow: Tier 2 (Polish)

#### 35. Show concept labels before the timer starts
The timer starts counting immediately when Round mounts, but the player needs a moment to see and process the two concepts before they start thinking of connections.

**Action:** Add a 3-second "Get Ready" phase before the timer starts:
- Show both concepts with labels
- Display "3... 2... 1... Go!" countdown
- Timer begins after "Go!"
- This gives the player mental prep time and builds anticipation

#### 36. Round modifier preview
Speed rounds (0.5x time) and Double-or-Nothing rounds hit players without warning. The session arc is invisible — players don't know what's coming.

**Action:** Before each round starts (in the "Get Ready" phase from #35), show the modifier:
- "SPEED ROUND — Half time, 1.5x points!"
- "DOUBLE OR NOTHING — Score 7+ to double, or lose it all!"
- "FINAL SHOWDOWN — 2x points, reduced time!"

#### 37. Concept pair quality scoring
Some random pairings produce boring connections (e.g., two similar nature photos). The game is most fun when concepts are maximally different — that's where the creative tension lives.

**Action:** Tag each concept with 2-3 category tags (e.g., "technology", "nature", "abstract", "human", "food"). When generating pairs, prefer concepts from *different* categories. This ensures creative tension in every round without hardcoding pairs.

#### 38. Post-session "Best Connection" highlight
After a 5-round session, the summary shows scores but not the actual connections. Players can't remember which round had their best work.

**Action:** In `SessionSummary.jsx`, highlight the highest-scoring round with the full submission text, concept pair, and score breakdown. Add a "Share Best Connection" button that shares just that round.

#### 39. Smooth phase transitions
Phase changes (LOBBY → ROUND → REVEAL) are instant cuts. Adding brief transitions would make the game feel more polished.

**Action:** Wrap phase changes in a fade-out/fade-in transition (200ms each). Use CSS transitions with a shared `AnimatePresence`-style wrapper. The existing `animate-in fade-in` classes can be extended.

---

### Priority Order (Image + Game Flow)

```
Week 1:  Responsive images (#20), concept repetition prevention (#23)
Week 1:  Leave room button (#29), quit confirmation (#34), reduce auto-submit delay (#33)
Week 2:  Expand concept pool to 24+/theme (#21), blur-up placeholders (#24)
Week 2:  Session resume banner (#30), AI Battle best-of-5 (#31)
Week 3:  Evocative labels (#22), preload next round (#25), timer precision (#32)
Week 3:  Get Ready countdown (#35), round modifier preview (#36)
Week 4:  Improved fallback chain (#26), concept category pairing (#37)
Week 4:  Best connection highlight (#38), smooth transitions (#39)
Month 2: Mixed media mode (#27), custom image improvements (#28)
```

---

## Phase 3: Social, Competitive & Retention (The Viral Engine)

Phases 1 and 2 built a polished, feature-rich game. Phase 3 makes it *spread*. The codebase has a full ranked system, friend list, voting, and community gallery — but most of it is invisible to players. The game's biggest gap isn't features, it's **discoverability of features that already exist**.

---

### Social & Viral: Tier 1 (Highest ROI)

#### 40. Unhide the ranked system — it's fully built but invisible
`src/services/ranked.js` has a complete Elo system with 6 tiers (Bronze→Venn Master), placement matches, decay, and seasonal rewards. **No UI exposes any of it.** There's no ranked button in the lobby, no rating display, no placement flow.

**Action:** Create `src/features/ranked/RankedPanel.jsx`:
- Show current tier, rating, and progress bar to next tier
- "Play 5 placement matches" flow for new players
- Season countdown ("Season 'The Wit Awakens' ends in 12 days")
- Seasonal reward preview (coins + badge per tier)
- Decay warning ("You lost 15 rating due to 3 days inactivity")
- Add a "Ranked" button to the lobby nav alongside Leaderboard/Achievements

#### 41. Friend profiles with challenge button
`src/services/friends.js` stores friends as name + timestamp — no stats, no activity, no reason to compare. Friends are ghosts.

**Action:** Create `src/features/social/FriendProfile.jsx`:
- Modal showing friend's best score, current streak, total rounds, favorite theme
- "Challenge" button that auto-generates a challenge link
- "Compare" view: your last 5 scores vs theirs side-by-side
- Pull stats from Supabase (or localStorage for offline)

#### 42. Community gallery — see other players' connections
The gallery (`src/features/gallery/Gallery.jsx`) only shows YOUR submissions. There's no way to see what others connected or what's trending. The voting system exists but is isolated.

**Action:** Add a "Community" tab to Gallery:
- Browse all players' submissions (filtered by theme, score range, most voted)
- "Trending Today" — highest-voted connections from last 24 hours
- "Same Concepts" — see what others connected for the pair you just played
- Upvote/downvote (existing `src/services/votes.js`) with vote count visible
- Requires Supabase table: `community_submissions` with RLS

#### 43. Spectator mode for multiplayer
Third players can't watch live rounds. For party play (4-8 friends), spectators are essential. Currently if you're not a player, you can't see anything.

**Action:** Add spectator role to `RoomContext.jsx`:
- "Join as Spectator" option on room join screen
- Spectators see submissions reveal in real-time but can't submit
- Emoji reaction picker on each submission during REVEALING phase (👍❤️😂🔥)
- "SPECTATING" banner overlay
- Reactions stored in Supabase room_reactions table

#### 44. Progressive lobby disclosure — reduce first-visit cognitive load
New players see 15+ buttons, toggles, and panels simultaneously. Decision paralysis kills first-session conversion. The onboarding tour explains mechanics but doesn't reduce UI clutter.

**Action:** Implement experience-gated UI in `Lobby.jsx`:
- **Session 0** (new player): Name, avatar, big "Play Now" button only
- **After session 1**: Unlock theme picker, scoring mode, session length
- **After session 3**: Show daily challenge, achievements, leaderboard
- **After session 5**: Reveal multiplayer, AI battle, prompt packs, custom images
- Track unlock tier in localStorage (`venn_lobby_tier`)
- "Show All" toggle for power users who want everything immediately

---

### Retention & Engagement: Tier 2

#### 45. Achievement progress bars during gameplay
Players have 51 achievements but no mid-session feedback about progress. They don't know they're 2 rounds from "Hat Trick" or 1 perfect score from "Perfection."

**Action:** After each round's score reveal in `Reveal.jsx`, show nearest achievement progress:
- "2 more 8+ rounds → On Fire achievement"
- "Score 9+ next → Comeback Kid (you scored 3 last round)"
- Pull from `checkAchievements()` but show PROGRESS, not just unlocks
- Small pill badge below the score, not a modal (non-intrusive)

#### 46. Weekly events and rotating challenges
Daily challenge exists but no weekly cadence. After 7 days, the loop is just "daily + freeplay." No variety.

**Action:** Create `src/services/weeklyEvents.js`:
- **Theme Week**: All daily challenges use one theme ("Ocean Week — all ocean concepts")
- **Speed Week**: All rounds are speed mode (0.5x time, 1.5x points)
- **Community Challenge**: One curated "impossible" concept pair, global leaderboard
- Rotate weekly, announce on lobby with banner
- Track participation for weekly achievement

#### 47. Score coaching — tell players WHY they scored poorly
Low scores (1-4) get a number and nothing else. Players don't know if their connection was unclear, unoriginal, or illogical. `getConnectionExplanation()` exists but is generic.

**Action:** Enhance the explanation in `Reveal.jsx` based on breakdown scores:
- If wit < 4: "Try wordplay or puns — clever language boosts wit scores"
- If originality < 4: "Too obvious? Think sideways — unexpected connections score higher"
- If logic < 4: "The connection needs a clearer thread between concepts"
- If clarity < 4: "Simpler phrasing helps — one sentence, one idea"
- Show as coaching tip below the "Why this score?" section

#### 48. Comeback celebration
Achievement "Comeback Kid" (score 9+ after scoring below 4) exists but triggers the same generic unlock as every other achievement. This is a peak emotional moment that deserves special treatment.

**Action:** In `Reveal.jsx`, when a comeback is detected:
- Full-screen overlay: "COMEBACK KID!" with dramatic animation
- Screen shake + special sound effect
- Show score journey: "Round 2: 3/10 → Round 3: 9/10"
- Extra confetti burst (2x particles)

#### 49. Welcome-back message for returning players
When a player returns after absence, there's no acknowledgment. Streak shows but no "welcome back" moment.

**Action:** In `Lobby.jsx`, detect days since last play:
- 1 day gap: "Welcome back! Your streak lives on 🔥"
- 3+ day gap: "We missed you! Jump back in with today's daily challenge"
- 7+ day gap: "It's been a while! Here's what's new: [weekly event name]"
- Store last_seen in localStorage, check on lobby mount

---

### Game Feel & Polish: Tier 3

#### 50. Screen shake on perfect 10
A perfect score gets confetti but no physical impact. The screen should shake to make the moment feel powerful.

**Action:** Add CSS shake animation triggered on 10/10 in `Reveal.jsx`:
```css
@keyframes screenShake {
  0%, 100% { transform: translate(0); }
  10% { transform: translate(-4px, 2px); }
  30% { transform: translate(4px, -2px); }
  50% { transform: translate(-2px, 4px); }
  70% { transform: translate(2px, -4px); }
}
```
Apply to the Layout wrapper for 300ms on perfect score.

#### 51. Button click sounds for UI feedback
Only core gameplay has sounds (submit, score reveal). No click feedback on buttons, toggles, or navigation. UI feels silent.

**Action:** Add a light click tone to `sounds.js`:
- Subtle pop sound (800Hz, 30ms, low volume) on button clicks
- Toggle sound on mode switches
- Apply via shared `onClick` wrapper or CSS `@media (hover: hover)` check
- Respect existing sound toggle preference

#### 52. Score roll animation
Score currently appears instantly. A rolling counter (0 → final score over 800ms) builds anticipation and makes the reveal feel dramatic.

**Action:** In `Reveal.jsx`, animate the score display:
- Count from 0 to final score over 800ms with ease-out curve
- Update every 50ms
- Play escalating tone as number climbs
- Pause briefly at final number before showing breakdown

#### 53. Personal score history chart
Stats track aggregates (total rounds, max streak) but no per-session breakdown. Players can't see their improvement arc.

**Action:** Create `src/features/analytics/ScoreHistoryChart.jsx`:
- Line chart of last 30 scores (score vs round number)
- Running average line overlay
- Personal best marker
- Show in a new "My Stats" section accessible from lobby
- Use SVG path rendering (no chart library dependency)

#### 54. Seasonal leaderboard resets
The leaderboard never resets. First players get permanent positions, discouraging newcomers.

**Action:** Add monthly leaderboard reset:
- `leaderboard_monthly` table in Supabase (existing schema can be extended)
- Archive previous month's leaderboard
- "March 2026 Champion" badge for #1
- Fresh start every month with "New Season!" lobby banner

---

### Technical Quality: Tier 4

#### 55. Split Lobby.jsx — it's 1003 lines
The lobby handles: profile creation, logged-in view, multiplayer panel, settings, theme picker, prompt packs, custom images, and media type selection. This is unmaintainable.

**Action:** Extract into sub-components:
- `src/features/lobby/ProfileForm.jsx` (~150 lines) — name, avatar, theme picker
- `src/features/lobby/MultiplayerPanel.jsx` (~200 lines) — room create/join
- `src/features/lobby/GameSettings.jsx` (~150 lines) — scoring mode, session length, media type
- `src/features/lobby/LobbyNav.jsx` (~100 lines) — nav buttons to Gallery, Leaderboard, etc.
- Keep `Lobby.jsx` as a thin orchestrator (~200 lines)

#### 56. Extract useRoundTimer hook
Round.jsx mixes timer logic (requestAnimationFrame, get-ready countdown, time-up detection) with UI rendering. Timer logic should be a reusable hook.

**Action:** Create `src/hooks/useRoundTimer.js`:
- Accepts: `timeLimit`, `onTimeUp` callback
- Returns: `{ displayTime, isReady, countdown, start, pause }`
- Handles: rAF loop, ready phase countdown, cleanup
- Used by: Round.jsx, AIBattle.jsx (both need timers)

#### 57. Input validation library
User-submitted text (connections, names, pack names) has no validation beyond `trim()`. Oversized submissions could crash ShareCard canvas rendering.

**Action:** Create `src/lib/validation.js`:
- `validateSubmission(text)` — max 200 chars, strip HTML/script tags
- `validatePlayerName(name)` — max 30 chars, no special chars
- `validatePackName(name)` — max 50 chars
- `sanitizeForCanvas(text)` — escape for canvas.fillText rendering
- Apply at form submission points in Round.jsx, Lobby.jsx

#### 58. Offline submission queue
When offline, `scoreSubmission()` fails silently. Player loses their connection text and gets no score. With the PWA targeting mobile users, offline resilience matters.

**Action:** Create `src/services/offlineQueue.js`:
- On scoreSubmission failure: save submission to IndexedDB queue
- Show toast: "Saved offline — will score when you're back online"
- On `online` event: process queue, score each submission, show results
- Badge on lobby: "3 unscored rounds waiting"

#### 59. JSON-LD structured data
Google can't identify this as a game. No rich results, no knowledge panel.

**Action:** Add to `index.html`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Venn with Friends",
  "applicationCategory": "Game",
  "operatingSystem": "Web",
  "description": "Connect two random concepts with one witty phrase",
  "offers": { "@type": "Offer", "price": "0" }
}
</script>
```

---

### Priority Order (Phase 3)

```
Week 1:  Unhide ranked system (#40), progressive lobby (#44)
Week 1:  Screen shake (#50), button sounds (#51), score roll (#52)
Week 2:  Friend profiles (#41), achievement progress bars (#45)
Week 2:  Score coaching (#47), welcome-back message (#49)
Week 3:  Community gallery (#42), comeback celebration (#48)
Week 3:  Score history chart (#53), seasonal leaderboards (#54)
Week 4:  Spectator mode (#43), weekly events (#46)
Week 4:  Split Lobby.jsx (#55), extract useRoundTimer (#56)
Month 2: Input validation (#57), offline queue (#58), JSON-LD (#59)
```

The game is feature-complete and polished. Phase 3 is about **making existing features visible** (ranked, friends, community), **amplifying emotional moments** (comeback, perfect 10, coaching), and **building the social engine** (spectators, community gallery, friend profiles) that turns a single-player puzzle into a multiplayer phenomenon.

---

## Phase 4: Monetization, Platform Growth & Production Excellence

Phases 1-3 built an impressive feature set: 59 items spanning game mechanics, social systems, retention hooks, and technical quality. Phase 4 focuses on **revenue**, **distribution**, **competitive infrastructure**, and **production-grade testing** — the pillars that turn a great game into a sustainable business.

---

### Monetization & Revenue: Tier 1

#### 60. Stripe payment integration for cosmetics
Add real payment processing using Stripe. Implement checkout modal for premium cosmetics (Venn Skins, avatar packs, score effects). Store transactions in Supabase `purchases` table. Start with 3 price points: $1.99, $4.99, $9.99.

**Files:** `src/lib/stripe.js` (new), `src/features/shop/CheckoutModal.jsx` (new), `src/services/shop.js`

#### 61. Premium battle pass tier
Create a paid ($4.99/season) premium track that doubles rewards at every tier. Check `isPremiumBattlePass()` at reward claim. Show premium vs free tracks side-by-side in battle pass UI.

**Files:** `src/services/shop.js`, `src/features/shop/BattlePassPanel.jsx` (new)

#### 62. Seasonal cosmetic bundles with limited-time pricing
Monthly rotating cosmetic packs at 20% discount. Unavailable after season ends. Show countdown timer in shop and featured banner in lobby. FOMO drives 40-60% more sales vs static pricing.

**Files:** `src/services/shop.js`, `src/features/shop/Shop.jsx`

#### 63. Free-to-play cosmetic earning path
"Cosmetic Quest" — 5 weekly challenges awarding 500 coins each. 3000 coins = 1 avatar pack. Ensures F2P players can earn premium cosmetics over 6 weeks without spending.

**Files:** `src/services/weeklyEvents.js`, `src/services/shop.js`

---

### Platform & Distribution: Tier 2

#### 64. PWA install prompt with custom banner
Detect `beforeinstallprompt` event and show "Install Venn as App — Faster, Offline Play" banner. Track install rate in analytics. Installed users have 2x retention.

**Files:** `src/lib/pwaInstall.js` (new), `src/components/PWAInstallBanner.jsx` (new), `src/features/lobby/Lobby.jsx`

#### 65. App store wrapper preparation
Create `MOBILE_DEPLOYMENT.md` documenting Capacitor/PWABuilder pipeline for iOS App Store and Google Play. Prepare icons, splash screens, screenshots, privacy policy, and store listing metadata.

**Files:** `MOBILE_DEPLOYMENT.md` (new), `public/` (icons/splash)

#### 66. Discord bot slash command integration
Create `/venn challenge @friend` Discord command. Format Venn challenges as rich embeds with concept pair and join link. Use Supabase Edge Function as interaction endpoint.

**Files:** `supabase/functions/discord-bot/index.ts` (new), `DISCORD_BOT.md` (new)

#### 67. Share-to-Instagram Stories & TikTok
Generate 1080x1920 story images with score, concepts, and CTA. Use Web Share API for native share sheet on mobile. Fallback: clipboard copy with "Paste in Stories" instructions.

**Files:** `src/lib/storyImage.js` (new), `src/components/SocialShareButtons.jsx`, `src/features/summary/SessionSummary.jsx`

---

### Backend & Competitive: Tier 3

#### 68. Elo-based matchmaking for ranked multiplayer
Match players within ±150 rating points via `matchmaking_queue` Supabase table with 30-second timeout. Show visual queue indicator with "Finding opponent..." animation.

**Files:** `src/services/matchmaking.js` (new), `src/features/ranked/RankedMatchmaking.jsx` (new), `src/context/RoomContext.jsx`

#### 69. Seasonal ranked divisions with visual badges
4 sub-ranks per division (Bronze I-IV, Silver I-IV, etc.). Track in `seasonal_ratings` table. Display division badge in lobby and player profiles.

**Files:** `src/features/ranked/DivisionBadge.jsx` (new), `src/services/ranked.js`

#### 70. Community content moderation
Add flag system ("Inappropriate", "Spam", "Offensive") on community gallery submissions. Create admin-only moderation dashboard showing flagged content with approve/remove actions.

**Files:** `src/features/analytics/ModerationDashboard.jsx` (new), `src/features/gallery/Gallery.jsx`

---

### Testing & Quality: Tier 4

#### 71. E2E multiplayer test suite
Playwright tests for: create room → join → submit → score → winner. Two browser contexts for simultaneous players. Mock Supabase with MSW. Cover spectator, disconnect, and timeout scenarios.

**Files:** `e2e/multiplayer-flow.spec.js` (new), `playwright.config.js`

#### 72. Critical flow component tests
Integration tests for Lobby→Round→Reveal→Summary flow. Target 80%+ coverage of user-facing flows. Test timer countdown, submission validation, score display, share buttons.

**Files:** `src/features/**/*.test.jsx` (expand existing)

#### 73. Lighthouse CI performance budget
GitHub Action running Lighthouse on every PR. Fail if: bundle > 210 KB gzipped, FCP > 2.5s, score < 85. Track regressions over time.

**Files:** `.github/workflows/lighthouse.yml` (new), `PERFORMANCE_BUDGET.md` (new)

---

### Analytics & Retention: Tier 5

#### 74. Real-time analytics dashboard with retention funnels
Wire `trackEvent()` to Plausible/PostHog. Dashboard showing: DAU/WAU/MAU, D1/D7/D30 retention, funnel (lobby→round→score→share), top themes, active hours heatmap.

**Files:** `src/features/analytics/AnalyticsView.jsx` (new), `src/services/analytics.js`

#### 75. Viral coefficient tracking
Track referral cohorts: new player → referred by code → 5 plays → active at D7. Identify which referral sources have best retention and LTV.

**Files:** `src/services/referrals.js`, `src/services/analytics.js`

#### 76. Seasonal challenge pass
Weekly challenge pass (7 daily challenges) tied to theme weeks. Completing all 7 earns "Week Master" badge + 1000 coins. Resets every Monday.

**Files:** `src/features/challenge/SeasonalChallengeBattlePass.jsx` (new), `src/services/weeklyEvents.js`

#### 77. Push notification triggers for streaks and friends
Complete Web Push implementation: "Streak expires in 3 hours", "Daily challenge is live", "Friend challenged you". Use Supabase Edge Functions as push server.

**Files:** `src/services/pushNotifications.js`, `src/services/notifications.js`

#### 78. Player milestone timeline
Visual timeline showing journey: "First round", "First 100 coins", "Unlocked Neon", "10-game streak", "First perfect 10", "Reached Gold". Celebrated every 10 rounds.

**Files:** `src/features/profile/MilestoneTimeline.jsx` (new), `src/services/stats.js`

#### 79. Contextual in-game tips
State-aware tips: "Use alliteration for Wit", "Perfect scores grant 2x coins", "Weekly events reset Monday". Shown as subtle pills below UI elements. Track seen tips to avoid repeats. Auto-fade after 30 seconds.

**Files:** `src/lib/contextualTips.js` (new), `src/components/ContextualTip.jsx` (new)

---

### Priority Order (Phase 4)

```
Week 1:  PWA install prompt (#64), Lighthouse CI (#73)
Week 1:  Stripe integration (#60), premium battle pass (#61)
Week 2:  Matchmaking (#68), division badges (#69)
Week 2:  E2E multiplayer tests (#71), component tests (#72)
Week 3:  Seasonal bundles (#62), F2P earning path (#63)
Week 3:  Discord bot (#66), story sharing (#67)
Week 4:  Analytics dashboard (#74), viral tracking (#75)
Week 4:  Content moderation (#70), seasonal challenge pass (#76)
Month 2: Push notifications (#77), milestone timeline (#78)
Month 2: Contextual tips (#79), app store prep (#65)
```

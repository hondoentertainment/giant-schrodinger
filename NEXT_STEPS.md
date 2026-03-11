# Next Steps: From Good Game to World-Class

## Where You Are Now

The core game loop is strong: two concepts → creative connection → AI or human scoring → fusion image. You've built an impressive feature set — streaks, achievements, daily challenges, battle pass, theme builder, multiplayer, leaderboards, sound, haptics, and solid mobile UX. The codebase is clean React with Vite, localStorage-first with optional Supabase.

**What separates this from a world-class game isn't more features — it's closing gaps in the features you have and nailing the live infrastructure.**

---

## Tier 1: Ship-Blocking Issues (Fix Before Launch)

### 1. Backend is optional — it shouldn't be
Everything meaningful (leaderboards, multiplayer, challenges, referrals) requires Supabase, but the app silently degrades to localStorage when it's not configured. This means:
- Leaderboards are local-only (you're always #1)
- Multiplayer rooms don't persist
- Challenge links only work on the same device
- Referral tracking is fiction

**Action:** Make Supabase setup a hard requirement for deployment. Add a visible "offline mode" indicator when running without a backend so users understand the limitation.

### 2. Test coverage is minimal
Only `gemini.test.js` and `judgements.test.js` exist. The scoring pipeline, theme builder, achievement unlocks, stats tracking, and battle pass progression are all untested. The one test file that exists has a pre-existing failure (null asset access).

**Action:** Add tests for the critical path: `scoreSubmission` → `updateStats` → `checkAchievements` → `addBattlePassXP`. Fix the broken test. Target 70%+ coverage on `/services/`.

### 3. AI scoring strictness is inverted
The `applyDifficulty` function multiplies scores by `scoringStrictness` (0.7 for easy, 1.3 for hard). This means **easy mode gives lower scores** and **hard mode gives higher scores** — the opposite of what players expect. Easy should be lenient (higher scores), hard should be strict (lower scores).

**Action:** Invert the modifier: `adjust = val => round(val / strictness)` or swap the strictness values (easy: 1.3, hard: 0.7).

### 4. `timeBonus` from difficulty config is never applied
The difficulty configs define `timeBonus` (+15s for easy, -10s for hard) but no code reads this value to adjust the round timer.

**Action:** Apply `timeBonus` to the round timer in `GameContext` or `Round` component when starting a new round.

---

## Tier 2: High-Impact, Low-Effort (This Week)

### 5. Open Graph meta tags
Every shared link is a plain URL. Add dynamic OG tags so challenge/judge links show a rich preview card with the score, fusion image, and "Can you beat this?" CTA. This is the single highest-leverage growth change.

### 6. Visual share cards
Replace plain-text sharing with canvas-generated image cards: fusion image + score + player name + "Beat my 8/10!" Works on Twitter, Discord, iMessage. The `SocialShareButtons` component already exists — upgrade it.

### 7. Streak counter on lobby screen
Streaks exist but are buried in session summary. Put a large, animated streak counter front-and-center on the lobby. "Day 5 🔥" with a pulsing flame creates daily return pressure.

### 8. Countdown to next daily challenge
After completing the daily, show "Next challenge in 14h 23m" with a live countdown. Creates urgency and a reason to return.

### 9. 1-click quick judge
The manual judge form (score slider + relevance dropdown + commentary) is too much friction. Add three big buttons: "🔥 Fire (9-10)", "👍 Solid (7-8)", "😐 Meh (4-6)". Expand for detailed scoring optionally. After judging, prompt: "Now play this round yourself!"

---

## Tier 3: Competitive Differentiation (This Month)

### 10. Real AI opponent mode
`generateAIConnection()` and `getAIOpponentResult()` exist but are never called. Wire them into a "vs AI" game mode:
- Player submits their connection
- AI generates its own connection (use Gemini for real wit, fall back to templates)
- Both are scored side-by-side
- Winner gets bragging rights + bonus XP
- This is a single-player retention loop that doesn't require friends

### 11. Connection explanations post-score
`getConnectionExplanation()` exists but is never displayed. After the score reveal, show the AI's explanation of *why* the connection scored what it did. This is the "learning moment" that makes players improve and come back.

### 12. Async challenge chains
A challenges B → B challenges C → C challenges A. Circular tournaments that play out over days. The challenge link infrastructure exists — extend it to chain multiple players.

### 13. "Best of Today" gallery
Surface the day's highest-scoring connections on the lobby. Community-visible content creates aspiration ("I want MY connection featured") and gives returning players something to browse.

### 14. Tournament mode
Weekend bracket tournaments: 8-16 players, Swiss format, 5 rounds matched by record. Use existing multiplayer rooms + leaderboard infrastructure. Exclusive cosmetic rewards for top finishers.

---

## Tier 4: Platform & Growth (This Quarter)

### 15. PWA push notifications
The service worker is registered but push notifications aren't implemented. Add notifications for:
- "Your 5-day streak expires in 3 hours!"
- "Daily challenge is live!"
- "Your friend just beat your score!"

### 16. Discord bot
`/venn challenge @friend` — play directly in Discord. This is the highest-leverage distribution channel for this type of game.

### 17. Error monitoring (Sentry)
Wire into the existing `ErrorBoundary`. Track scoring failures, share link errors, multiplayer disconnects. You can't fix what you can't see.

### 18. Analytics instrumentation
`trackEvent` calls exist but go nowhere visible. Wire them to a dashboard tracking:
- K-factor (shares × conversion rate)
- D1/D7/D30 retention
- Daily challenge completion rate
- Time to first share

### 19. Prompt packs & curated concept pairings
The theme system handles visual themes, but concept pairings are random. Add curated packs:
- "Impossible Connections" (Tax Returns + Rollercoasters)
- "Pop Culture Mashup" (movies × food)
- "Deep Thoughts" (philosophy × everyday objects)

Each pack gets its own leaderboard.

---

## What NOT to Build Yet

- **Native mobile app** — the PWA is sufficient until you have 10k+ daily actives
- **Monetization/shop** — the battle pass and shop scaffolding exists but don't optimize revenue before you have retention
- **Seasonal ranked mode** — needs a large enough player base for meaningful matchmaking
- **Video export/replay** — cool but doesn't drive growth; build after virality is proven
- **Sponsored themes** — premature until you have brand-worthy traffic

---

## Priority Order

```
Week 1:  Fix scoring inversion (#3), fix timeBonus (#4), fix broken test (#2)
Week 1:  OG tags (#5), streak on lobby (#7), daily countdown (#8)
Week 2:  Share cards (#6), quick judge (#9), connection explanations (#11)
Week 3:  AI opponent mode (#10), best-of-today gallery (#13)
Week 4:  Backend requirement (#1), test coverage (#2), async chains (#12)
Month 2: Push notifications (#15), analytics (#18), Sentry (#17)
Month 3: Tournament mode (#14), Discord bot (#16), prompt packs (#19)
```

The game's core mechanic is genuinely fun. The path to world-class is: fix the bugs that undermine trust, close the viral loop so every session ends with a share, and build the single-player retention hooks (AI opponent, explanations, streaks) so players come back even without friends online.

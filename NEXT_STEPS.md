# Viral Game Roadmap for Venn with Friends

## The Core Insight

The game mechanics are strong — the scoring system is clever, fusion images create "wow" moments, and the judge mechanic is unique. **What's missing is the viral loop.** Players finish a round, see a cool score, and then... nothing pulls them back or pushes them to share. The roadmap below fixes that.

---

## Phase 0: Ship It (Do This First)

1. **Enable GitHub Pages** — Settings > Pages > Source: "GitHub Actions"
2. **Configure Supabase** — real multiplayer, persistent sharing, stored judgements
3. **Add Gemini API key** — real AI scoring and fusion image generation
4. **Add Open Graph meta tags** to `index.html` — every shared link should show a rich preview with the fusion image, score, and a call-to-action

---

## Phase 1: The Viral Loop (Highest Impact)

### 1.1 Friend Challenges (Not Just Judging)
The current judge flow is a dead end — friends score your connection and leave. Flip this into a competitive loop:

- After scoring, show: **"Challenge a friend to beat your 8/10"**
- Generate a challenge link that loads the **same two concepts** for the friend
- Friend plays the same round, both scores are compared side-by-side
- Winner gets a badge; loser gets "Rematch?" button
- This creates a **back-and-forth loop** — the core of every viral game

### 1.2 Referral Rewards
Sharing currently gives the sharer nothing. Fix that:

- When a friend joins via your link and plays their first round, **both players get +50 bonus points**
- First 3 referrals unlock an exclusive avatar (e.g., the ambassador badge)
- Track referral source via URL parameter, credit in Supabase

### 1.3 Share Cards (Not Just Text)
Current shares are plain text links. Replace with **visual share cards**:

- Auto-generate a card image: fusion image + score + player name + "Can you beat this?"
- Use canvas API or server-side rendering
- Cards work on Twitter, iMessage, Discord, Instagram Stories
- Include a QR code for the challenge link

### 1.4 1-Click Quick Judge
The manual judge form (score + relevance + commentary) is too much friction for casual friends. Add:

- Three big buttons: **"Fire" (9-10)**, **"Solid" (7-8)**, **"Meh" (4-6)**
- Optional: expand for detailed scoring
- After judging, show: **"Now play this round yourself!"** — converts judges into players

---

## Phase 2: Daily Retention Engine

### 2.1 Make Streaks the Hero
Streaks exist but are buried. Make them the **primary retention driver**:

- Giant streak counter on the lobby screen (not hidden in profile)
- Daily login bonus: +10 points just for opening the app
- Streak multiplier: 1.1x scoring bonus per consecutive day (caps at 1.5x at day 5)
- **Streak loss notification**: "Your 5-day streak ends in 3 hours!" (if push notifications are enabled via PWA)
- Streak milestones unlock exclusive content:
  - 3-day: Speed Round bonus theme
  - 7-day: Mystery avatar (already exists, surface it more)
  - 14-day: "Streak Master" profile badge
  - 30-day: Exclusive "Golden Venn" theme

### 2.2 Daily Challenge Leaderboard
The daily challenge uses seeded RNG so everyone gets the same concepts. Capitalize on this:

- Show a **"Today's Leaderboard"** after completing the daily challenge
- "You scored 8/10 — that's top 15% today!"
- Leaderboard resets daily, creating fresh competition every 24 hours
- Share button: "I'm #12 on today's Venn challenge!"

### 2.3 Countdown Timer
After completing the daily challenge, show:

- **"Next challenge in 14h 23m"** with a live countdown
- "Set a reminder" button (browser notification permission)
- Creates urgency and a reason to return tomorrow

---

## Phase 3: Social & Competitive Features

### 3.1 Global Leaderboard
- Weekly leaderboard (resets every Monday) — keeps it fresh and approachable
- Monthly hall of fame (top 10 preserved permanently)
- Filter by: friends only, all players, daily/weekly/monthly
- Show player's rank prominently: "You're #47 this week"

### 3.2 "Best Connections" Gallery
- Community-voted gallery of the wittiest connections ever made
- Players can upvote/downvote connections from the gallery
- "Connection of the Day" featured on the lobby screen
- Creates aspirational content — "I want MY connection featured"

### 3.3 Multiplayer Improvements
- **1-click invite links** with room code embedded (not separate copy-paste)
- **4-character room codes** (e.g., "VENN") instead of 6-digit codes
- **QR code generation** for in-person play
- **Rematch button** at end of multiplayer session
- **Spectator mode** — waiting players can watch submissions come in
- **Tournament brackets** for 4+ players

### 3.4 Friend System
- Add friends by username or via challenge links
- See friends' recent scores and streaks on lobby
- "Your friend Alex just scored 9/10 — can you beat that?" notification
- Weekly friend digest: "This week: you played 12 rounds, Alex played 8"

---

## Phase 4: Game Feel & Polish

### 4.1 Sound Design
- Satisfying "ding" on submission
- Dramatic score reveal sound (scales with score — triumphant for 9+, neutral for 5-6)
- Streak milestone celebration sound
- Timer tick acceleration in final 10 seconds
- Mute toggle in settings

### 4.2 Animations & Juice
- Score counter animates from 0 to final score (slot machine effect)
- Confetti burst for 9+ scores
- Screen shake for "Double or Nothing" bust
- Venn diagram circles pulse/glow when connection is strong
- Fusion image reveal with dramatic unveil animation

### 4.3 Haptics (Mobile)
- Light tap on button press (already exists via haptics.js)
- Heavy impact on score reveal
- Success pattern on milestone unlock
- Double tap on "Double or Nothing" win

### 4.4 Onboarding That Hooks
Replace the current tutorial modal with:

- Show 2-3 example connections (good vs bad) so new players understand "wit"
- First round is guided: "Try connecting these two — type something clever!"
- After first score: "Nice! Share this with a friend to challenge them" (immediate share prompt)
- Show streak tracker immediately: "Come back tomorrow to start a streak!"

---

## Phase 5: Growth Infrastructure

### 5.1 PWA (Progressive Web App)
- Service worker for offline support and push notifications
- "Add to Home Screen" prompt after 3rd play session
- Cache assets for instant load on return visits
- Push notifications for: daily challenge, streak reminders, friend challenges

### 5.2 Analytics
Track the metrics that matter for virality:

| Metric | Why It Matters |
|--------|---------------|
| K-factor (shares per user × conversion rate) | Core viral coefficient |
| D1/D7/D30 retention | Are players coming back? |
| Share rate per session | Are players sharing? |
| Challenge acceptance rate | Are shared links converting? |
| Daily challenge completion rate | Is the retention hook working? |
| Streak distribution | How many players maintain streaks? |
| Time to first share | How quickly do new players share? |

### 5.3 SEO & Discoverability
- Custom domain (e.g., vennwithfriends.com)
- Landing page with example connections and "Play Now" CTA
- Open Graph tags with dynamic preview images per challenge
- Blog/content: "Best connections of the week" for organic search traffic

### 5.4 Error Monitoring
- Sentry integration (wire into existing ErrorBoundary)
- Alert on scoring failures, share link errors, multiplayer disconnects

---

## Quick Wins (Ship This Week)

| Change | Effort | Impact | Why |
|--------|--------|--------|-----|
| Open Graph meta tags | 1 hr | High | Every shared link becomes a rich preview |
| Sound effects on score reveal | 2 hr | High | Game feel is 10x more satisfying |
| Streak counter on lobby (large, prominent) | 1 hr | High | Drives daily return |
| "Challenge a friend" button on Reveal | 2 hr | High | Creates the viral loop |
| 1-click quick judge buttons | 1 hr | Medium | Removes friction from judge flow |
| Score percentile on Reveal ("Top 15%!") | 2 hr | High | Social proof drives sharing |
| Countdown to next daily challenge | 30 min | Medium | Creates urgency to return |
| Favicon and app icons | 30 min | Medium | Polished appearance |

---

## The Viral Formula

```
Player completes round
  → Sees impressive score + fusion image (dopamine hit)
  → "You're in the top 15% today!" (social proof)
  → "Challenge [friend] to beat your 8/10" (competitive pressure)
  → Friend receives challenge link with rich preview card
  → Friend plays same round, sees comparison
  → Loser hits "Rematch?" (back-and-forth loop)
  → Both players return tomorrow for daily challenge (streak)
  → Streak multiplier makes scores higher (progression)
  → Higher scores = better leaderboard position (status)
  → Better position = more sharing (growth)
```

Each step feeds the next. That's the loop.

# Changelog

All notable changes to Venn with Friends are documented here, organized by development phase.

---

## Phase 5: World-Class Polish — Ship-Ready Excellence

**Focus**: Make existing features production-ready. No new features until the core loop is bulletproof.

### Implemented
- Server-persisted share links with hash-encoded URL fallback
- Server-side scoring enforcement scaffold (Supabase Edge Function)
- Multiplayer disconnect recovery with reconnection banner
- Colorblind mode with SVG pattern-differentiated Venn circles
- Error states with retry buttons for API failures
- Compelling, tiered share templates based on score ranges
- Post-reveal retention hooks (achievement progress, battle pass XP, rank delta)
- Judge training and calibration flow
- Full keyboard navigation audit for all game modes
- Screen reader score announcements with ARIA live regions
- Elo decay activation via app-load check
- Seasonal soft-reset for ranked mode
- User-generated theme sharing with public links
- Procedural concept generation via Gemini AI

---

## Phase 4: Monetization, Platform Growth & Production Excellence

**Focus**: Revenue, distribution, competitive infrastructure, and production-grade testing.

### Implemented
- Stripe payment integration for cosmetics (3 price points)
- Premium battle pass tier with doubled rewards
- Seasonal cosmetic bundles with countdown timers
- Free-to-play cosmetic earning path (Cosmetic Quest)
- PWA install prompt with custom banner and install tracking
- App store wrapper preparation (Capacitor/PWABuilder docs)
- Discord bot slash command integration
- Share-to-Instagram Stories and TikTok with 1080x1920 story images
- Elo-based matchmaking for ranked multiplayer
- Seasonal ranked divisions with visual badges
- Community content moderation dashboard
- E2E multiplayer test suite (Playwright)
- Critical flow component tests
- Lighthouse CI performance budget (GitHub Actions)
- Real-time analytics dashboard with retention funnels
- Viral coefficient tracking for referrals
- Seasonal challenge pass (weekly)
- Push notification triggers for streaks and friends
- Player milestone timeline
- Contextual in-game tips system

---

## Phase 3: Social, Competitive & Retention (The Viral Engine)

**Focus**: Make existing features visible, amplify emotional moments, build the social engine.

### Implemented
- Ranked system UI (previously built but hidden) with tier display and placement flow
- Friend profiles with stats and challenge buttons
- Community gallery tab with trending, voting, and "Same Concepts" view
- Spectator mode for multiplayer rooms
- Progressive lobby disclosure (experience-gated UI unlocks)
- Achievement progress bars during gameplay
- Weekly events and rotating challenges
- Score coaching with specific improvement tips per category
- Comeback celebration with full-screen animation
- Welcome-back messages for returning players
- Screen shake on perfect 10 scores
- Button click sounds for UI feedback
- Score roll animation (0 to final score over 800ms)
- Personal score history chart (SVG)
- Seasonal leaderboard resets (monthly)
- Lobby.jsx split into sub-components
- useRoundTimer hook extraction
- Input validation library
- Offline submission queue with IndexedDB
- JSON-LD structured data for SEO

---

## Phase 2: Image Set & Game Flow Improvements

**Focus**: Richer visual experience, tighter gameplay loop, reduced friction.

### Implemented
- Responsive image sizing (400px mobile, 640px tablet, 1080px desktop)
- Expanded concept pool to 24+ images per theme
- Evocative concept labels (e.g., "3AM Taxi Ride" instead of "City Lights")
- Concept repetition prevention within sessions
- Blur-up image placeholders (tiny blurred thumbnail to full image)
- Next-round image preloading during reveal phase
- Improved broken image fallback chain
- "Leave Room" button for multiplayer
- Session resume banner after accidental navigation
- AI Battle structured as Best of 5 format
- Timer precision via requestAnimationFrame
- Reduced auto-submit delay (900ms to 400ms)
- Quit confirmation dialog
- "Get Ready" 3-second countdown before timer starts
- Round modifier preview before each round
- Concept category tagging for creative pairing
- Post-session "Best Connection" highlight
- Smooth phase transitions with fade animations

---

## Phase 1: Core Gameplay to Production Infrastructure

**Focus**: Core game loop, scoring, multiplayer, progression, and production readiness.

### Core Gameplay
- Two-concept Venn diagram with text input for connections
- AI scoring via Google Gemini (wit, logic, originality, clarity)
- Animated score reveal with breakdown and connection explanation
- 6 image themes with 82 curated Unsplash photos
- Configurable session length (3, 5, 7 rounds)
- Round modifiers: Speed Round, Double-or-Nothing, Final Showdown
- Time bonuses for fast submissions

### Game Modes
- Solo play with AI scoring
- Real-time multiplayer rooms with room codes (Supabase Realtime)
- AI Battle mode
- Async play (play at your own pace)
- Daily challenges with global participation
- Tournament brackets
- Party mode for casual group play

### Progression & Retention
- Streak tracking with daily persistence
- 51+ achievements with unlock animations and confetti
- Battle pass with tiered rewards
- Coin economy for shop purchases
- Leaderboards (global, friends, seasonal)

### Social Features
- Share cards (canvas-rendered) for social platforms
- Friend judging via shareable URLs
- Quick judge and detailed scoring modes
- Challenge links to invite friends
- Referral system

### Infrastructure
- Supabase schema with RLS policies and indexes
- Edge Functions (score-submission, og-tags, discord-bot)
- GitHub Actions CI/CD (test, build, deploy)
- Lighthouse CI on pull requests
- Vitest + React Testing Library + MSW test suite
- Playwright E2E tests (Desktop Chrome, Firefox, Mobile Safari)
- Error boundary with recovery
- Offline mode indicator
- PWA service worker registration
- i18n support (English, Spanish)
- Sound effects and haptic feedback

---

## Project Stats (as of April 2026)

| Metric | Value |
|--------|-------|
| Total features | 93 across 5 phases |
| Source files | 134 (JSX + JS) |
| Lines of code | ~22,600 |
| Unit/integration tests | 179 across 21 test files |
| E2E specs | 5 Playwright spec files |
| Main chunk (gzipped) | 149 KB |
| Lazy-loaded chunks | 24 |
| CSS (gzipped) | 12 KB |

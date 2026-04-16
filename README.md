# Venn with Friends

**A creative multiplayer party game where players connect two random concepts with witty, clever phrases.**

Players compete to find the wittiest connections between unexpected concept pairs, scored by Google Gemini AI or friends. Solo, multiplayer, ranked, tournaments, and async play -- all in one game.

> Screenshot / demo placeholder: add a GIF or image here showing gameplay.

---

## Key Features

### Core Game
- 7+ game modes: Solo, Multiplayer, Async, Daily Challenge, Tournaments, Party Mode, Ranked
- AI scoring via Google Gemini (wit, logic, originality, clarity)
- Venn diagram visualization with animated reveals
- Prompt packs and custom image uploads
- Score bands and coaching feedback

### Social
- Real-time multiplayer rooms with room codes
- Friend judging via shareable URLs
- Social share cards (canvas-rendered) for Twitter, Discord, etc.
- Story sharing with generated images
- Community gallery with voting and trending tabs
- Referral system

### Competitive
- Ranked mode with Elo ratings, tiers, and seasonal resets
- Tournaments with brackets
- Daily challenges and weekly events
- Leaderboards (global, friends, seasonal)
- Achievement system with progress tracking and milestones

### Monetization
- Shop with prompt packs, themes, and cosmetics
- Battle pass progression
- Stripe integration for payments

### Platform
- Progressive Web App with offline queue and install banner
- Push notifications (VAPID)
- Discord bot integration
- Server-side scoring via Supabase Edge Functions
- Dynamic OG tags for shared links
- Error monitoring (Sentry)
- Internationalization (i18n) support
- GitHub Actions CI/CD with Lighthouse CI

### Accessibility
- Colorblind mode
- Contextual tips and onboarding tour
- Progressive lobby disclosure (new users see simplified UI)
- Focus trap management for modals
- Keyboard navigation support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Supabase (Postgres, Realtime, Edge Functions) |
| AI | Google Gemini (scoring and image generation) |
| Payments | Stripe |
| Testing | Vitest, React Testing Library, Playwright (E2E) |
| CI/CD | GitHub Actions, Lighthouse CI |
| Monitoring | Sentry |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need:

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Multiplayer, leaderboards, persistence | Optional |
| `VITE_SUPABASE_ANON_KEY` | Database access | Optional |
| `VITE_GEMINI_API_KEY` | AI scoring and fusion images | Optional |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Shop payments | Optional |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications | Optional |
| `VITE_SENTRY_DSN` | Error monitoring | Optional |

The app runs fully without any env vars: multiplayer uses mock data, scoring uses mock scores, and images use curated themes.

---

## Architecture

```
src/
  features/          # Feature modules (18 feature directories)
    achievements/    # Achievement system and progress
    ai/              # AI feature panels
    analytics/       # Analytics dashboard
    challenge/       # Daily challenges
    creator/         # Content creation tools
    gallery/         # Results gallery and community gallery
    judge/           # Friend judging interface
    leaderboard/     # Global and friend leaderboards
    lobby/           # Game lobby with progressive disclosure
    profile/         # Player profiles
    ranked/          # Ranked mode with Elo
    reveal/          # Animated results reveal
    room/            # Multiplayer rooms
    round/           # Core gameplay round
    shop/            # In-game shop
    social/          # Social features and sharing
    summary/         # Game summary screens
    tournament/      # Tournament brackets
  services/          # Business logic and API integrations (40+ modules)
  context/           # React context (GameContext, RoomContext, ToastContext)
  data/              # Static data and themes
  lib/               # Utilities (i18n, validation, Stripe, Supabase, etc.)
  hooks/             # Custom hooks (focus trap, round timer, translation)
  components/        # Shared UI (error boundary, modals, toasts, PWA, etc.)
  locales/           # Translation files
  test/              # Test setup and utilities
e2e/                 # Playwright E2E tests (5 spec files)
supabase/
  schema.sql         # Database schema with RLS policies
  functions/         # Edge Functions (score-submission, og-tags, discord-bot)
```

---

## Current Stats

| Metric | Value |
|--------|-------|
| Features | 93 across 5 phases |
| Unit/integration tests | 613 across 48 test files |
| E2E specs | 5 Playwright spec files |
| Lines of code | ~22K (src/) |
| Main chunk (gzipped) | 149 KB |
| Lazy chunks | 13 code-split chunks |
| ESLint errors | 0 |

---

## Documentation

- [SETUP.md](SETUP.md) -- Environment and backend setup
- [DEPLOYMENT.md](DEPLOYMENT.md) -- Deployment guide (GitHub Pages, Supabase, Edge Functions)
- [START_HERE.md](START_HERE.md) -- Quick start for new developers
- [NEXT_STEPS.md](NEXT_STEPS.md) -- Roadmap and future plans
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) -- Manual testing instructions
- [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) -- Feature specifications
- [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) -- QA checklist
- [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) -- Performance targets and actuals
- [DISCORD_BOT.md](DISCORD_BOT.md) -- Discord bot setup
- [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) -- App store preparation

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run test` and `npm run lint`
5. Submit a pull request

---

## License

MIT License -- feel free to use and modify.

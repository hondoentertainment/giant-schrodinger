# Venn with Friends

**A creative multiplayer party game where players connect two random concepts with witty, clever phrases.**

Players compete to find the wittiest connections between unexpected concept pairs, scored by Google Gemini AI or friends. Solo, multiplayer, ranked, tournaments, and async play — all in one game.

> **Live demo**: Once deployed, the game will be available at `https://hondoentertainment.github.io/giant-schrodinger/`

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Current Stats](#current-stats)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Key Features

### Core Game
- **7+ game modes**: Solo, Multiplayer, Async, Daily Challenge, Tournaments, Party Mode, Ranked
- **AI scoring** via Google Gemini evaluating wit, logic, originality, and clarity
- **Venn diagram visualization** with animated score reveals
- **Prompt packs** and custom image uploads via Theme Builder
- **Score bands** with coaching feedback and connection explanations
- **Session arcs** with round modifiers (Speed Round, Double-or-Nothing, Final Showdown)

### Social & Sharing
- Real-time multiplayer rooms with shareable room codes
- Friend judging via shareable URLs (quick judge or detailed scoring)
- Canvas-rendered share cards for Twitter, Discord, and iMessage
- Story sharing with AI-generated fusion images
- Community gallery with voting, trending tabs, and "Same Concepts" view
- Referral system with tracking codes

### Competitive
- **Ranked mode** with Elo ratings, 6 tiers (Bronze through Venn Master), and placement matches
- **Tournaments** with bracket-style eliminations
- **Daily challenges** and weekly themed events
- **Leaderboards**: global, friends, seasonal, and monthly
- **51+ achievements** with progress tracking and milestone celebrations

### Monetization
- In-game shop with prompt packs, Venn skins, avatar packs, and cosmetics
- Battle pass with free and premium tiers
- Stripe checkout integration for payments
- Seasonal cosmetic bundles with limited-time pricing
- Free-to-play earning path (Cosmetic Quest)

### Platform
- Progressive Web App with offline queue, install banner, and service worker
- Push notifications via VAPID (streak expiration, daily challenge, friend challenges)
- Discord bot integration with slash commands
- Server-side scoring via Supabase Edge Functions
- Dynamic Open Graph tags for shared links
- Error monitoring integration (Sentry)
- Internationalization (i18n) with English and Spanish
- GitHub Actions CI/CD with Lighthouse CI performance budgets

### Accessibility
- Colorblind mode with pattern-differentiated Venn circles
- Contextual tips and guided onboarding tour
- Progressive lobby disclosure (new users see simplified UI, features unlock with play)
- Focus trap management for modals
- Keyboard navigation support
- Screen reader compatible with ARIA labels

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS |
| **State** | React Context API (GameContext, RoomContext, ToastContext) |
| **Backend** | Supabase (PostgreSQL, Realtime, Edge Functions, Row Level Security) |
| **AI** | Google Gemini 2.0 Flash (scoring) + Imagen 3.0 (fusion images) |
| **Payments** | Stripe |
| **Testing** | Vitest + React Testing Library + MSW (unit/integration), Playwright (E2E) |
| **CI/CD** | GitHub Actions, Lighthouse CI |
| **Monitoring** | Sentry (error tracking), Plausible/PostHog (analytics-ready) |
| **Icons** | Lucide React |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173/giant-schrodinger/

# Run tests
npm run test

# Build for production
npm run build
```

All features work without any environment variables. See [START_HERE.md](START_HERE.md) for a detailed walkthrough.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need:

| Variable | Purpose | Without it |
|----------|---------|------------|
| `VITE_SUPABASE_URL` | Multiplayer, leaderboards, persistence | Mock rooms and client-only data |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous access | Same as above |
| `VITE_GEMINI_API_KEY` | AI scoring and fusion images | Mock scores, curated theme images |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Shop payments | Shop browsable, purchases disabled |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications | In-app notifications only |
| `VITE_SENTRY_DSN` | Error monitoring | Errors logged to console |

**The app runs fully without any env vars.** Solo play, mock multiplayer, gallery, achievements, and all UI features work out of the box.

---

## Architecture

```
src/
  features/           # Feature modules (18 directories)
    achievements/     # Achievement system, progress tracking, milestones
    ai/               # AI battle mode, AI settings panels
    analytics/        # Analytics + moderation dashboards
    challenge/        # Daily challenges, async chains, seasonal events
    creator/          # Theme builder with custom images
    gallery/          # Personal + community gallery with voting
    judge/            # Friend judging interface (quick + detailed)
    leaderboard/      # Global, friend, and seasonal leaderboards
    lobby/            # Game lobby with progressive disclosure
    profile/          # Player profiles and milestone timeline
    ranked/           # Ranked mode with Elo, divisions, matchmaking
    reveal/           # Animated score reveal with coaching
    room/             # Multiplayer rooms (create, join, spectate)
    round/            # Core gameplay round with Venn diagram
    shop/             # Shop, battle pass, checkout
    social/           # Social sharing, friend profiles, referrals
    summary/          # Session summary with best connection highlight
    tournament/       # Tournament brackets and lobby
  services/           # Business logic and API integrations (40+ modules)
  context/            # React Context (GameContext, RoomContext, ToastContext)
  components/         # Shared UI (ErrorBoundary, Toast, Confetti, PWA, etc.)
  hooks/              # Custom hooks (useFocusTrap, useRoundTimer, useTranslation)
  lib/                # Utilities (i18n, validation, Stripe, haptics, rate limiting)
  data/               # Static data (6 themes, 82 concept images)
  locales/            # Translation files (en.json, es.json)
  test/               # Test setup (Vitest globals, MSW handlers, DOM mocking)
e2e/                  # Playwright E2E tests (5 spec files)
discord-bot/          # Discord bot with slash commands
supabase/
  schema.sql          # Full database schema with RLS policies and indexes
  functions/          # Edge Functions (score-submission, og-tags, discord-bot)
public/               # Static assets (favicon, OG image)
.github/workflows/    # CI/CD (deploy.yml, lighthouse.yml)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design, data flow, and architectural decisions.

---

## Current Stats

| Metric | Value |
|--------|-------|
| Features implemented | 93 across 5 development phases |
| Source files | 134 (JSX + JS) |
| Lines of code | ~22,600 |
| Unit/integration tests | 179 across 21 test files |
| E2E specs | 5 Playwright spec files |
| Production build | Succeeds (Vite 5) |
| Main chunk (gzipped) | 149 KB |
| Code-split chunks | 24 lazy-loaded chunks |
| CSS (gzipped) | 12 KB |
| ESLint issues | 59 (unused vars/imports — non-blocking) |

---

## Documentation

### Getting Started
- [START_HERE.md](START_HERE.md) — Quick start for new developers
- [SETUP.md](SETUP.md) — Environment variables and backend setup
- [DEPLOYMENT.md](DEPLOYMENT.md) — Deploy to GitHub Pages, Vercel, or manual

### Architecture & Design
- [ARCHITECTURE.md](ARCHITECTURE.md) — System design, data flow, and decisions
- [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) — Feature specifications and edge cases

### Testing & Quality
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) — Manual testing instructions for all modes
- [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) — QA checklist
- [TESTING_SETUP_SUMMARY.md](TESTING_SETUP_SUMMARY.md) — Test suite configuration
- [FAST_TRACK_CHECKLIST.md](FAST_TRACK_CHECKLIST.md) — 15-minute spot-check
- [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) — Lighthouse targets and actuals
- [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md) — Latest test results

### Planning & Roadmap
- [NEXT_STEPS.md](NEXT_STEPS.md) — 93-item roadmap across 6 phases
- [CHANGELOG.md](CHANGELOG.md) — Development history and phase completion

### Platform Integrations
- [DISCORD_BOT.md](DISCORD_BOT.md) — Discord bot setup and commands
- [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) — App store preparation (iOS/Android)

### Contributing
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development workflow, code style, and PR guidelines

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. The short version:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm run test` and `npm run lint`
5. Submit a pull request

---

## Roadmap

The game is feature-complete with 93 implemented features across 5 phases. The focus is now on production readiness and growth. See [NEXT_STEPS.md](NEXT_STEPS.md) for the full roadmap.

**Current priorities:**
1. **Production Infrastructure** — Server-side scoring, real Supabase backend, error monitoring
2. **Code Quality** — Fix ESLint issues, increase test coverage, bundle optimization
3. **Viral Loop** — Dynamic OG tags, compelling share templates, guided onboarding
4. **Competitive Integrity** — Server-enforced scoring, Elo decay, anti-cheat
5. **Accessibility** — Full keyboard navigation, screen reader support, WCAG AA compliance
6. **Scaling** — Analytics pipeline, push notifications, i18n expansion

---

## License

MIT License — see [LICENSE](LICENSE) for details.

# Venn with Friends

A creative party game where players connect two prompts with one witty phrase. Supports solo sessions, shareable friend judging, progression/unlocks, and Supabase-backed realtime multiplayer.

<<<<<<< HEAD
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
=======
**Product docs:** [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [JUDGE_MODEL.md](JUDGE_MODEL.md) · [ROADMAP.md](ROADMAP.md) · [START_HERE.md](START_HERE.md)

## Current Product
>>>>>>> origin/main

### Core loops

- Solo sessions with 3, 5, or 7 rounds
- Daily challenge mode
- AI judge and manual judge options
- Share a round for friend judging
- Realtime multiplayer rooms (requires Supabase)
- Personal gallery/history of saved creations
- Unlocks, streaks, avatars, and themes
- Image, video, audio, meme, and mixed prompt modes
- Optional custom image packs for image play

<<<<<<< HEAD
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
=======
### Feature status

| Area | Works without keys | Works with Gemini | Works with Supabase | Notes |
|---|---|---|---|---|
| Solo sessions | Yes | Yes | N/A | Core local loop works out of the box |
| AI scoring | Mock fallback | Yes | Preferred via edge | Mock when Gemini unavailable |
| Fusion images | Curated fallback | Yes | N/A | Falls back to curated fusion art |
| Friend judging links | Basic/local fallback | N/A | Yes | Durable persistence needs Supabase |
| Gallery (personal) | Yes | N/A | Optional | Local-first; enriched by backend judgements |
| Multiplayer rooms | No | Optional | Yes | Requires Supabase + schema RPCs |
| Room vote scoring | No | N/A | Yes | `cast_room_vote` / `finalize_room_votes` |
| Spectator mode | No | N/A | Yes | Join-as-spectator |
| Content reports | No | N/A | Yes | Lightweight moderation dashboard |
| Ranked / shop / tournaments | Local preview | N/A | N/A | Device-only until cloud sync (Phase 9) |

Full registry: [PRD.md §2](PRD.md).
>>>>>>> origin/main

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables if you want live services:
   - Copy `.env.example` to `.env`
   - Add `VITE_GEMINI_API_KEY` for live AI scoring and generated fusion images (dev / fallback)
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for realtime multiplayer and backend persistence
   - Apply `supabase/schema.sql` so secure RPCs and authoritative multiplayer voting are available

<<<<<<< HEAD
# Open in browser
open http://localhost:5173/giant-schrodinger/

# Run tests
npm run test
=======
3. Start development:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173/giant-schrodinger/
>>>>>>> origin/main

4. Validate:
   ```bash
   npm run test              # 688 unit tests
   npm run test:e2e:desktop  # 11 Playwright specs
   npm run build
   npm run verify:release    # lint + unit + e2e + build
   ```

<<<<<<< HEAD
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
=======
## Deployment

- **Vercel** — primary production (`vercel.json`). See [DEPLOYMENT.md](DEPLOYMENT.md).
- **GitHub Pages** — workflow at `.github/workflows/deploy.yml`; base path `/giant-schrodinger/`.

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Realtime multiplayer and backend persistence | Optional (required for multiplayer) |
| `VITE_SUPABASE_ANON_KEY` | Realtime multiplayer and backend persistence | Optional (required for multiplayer) |
| `VITE_GEMINI_API_KEY` | Client/dev AI judging and fusion images | Optional |
| `VITE_ALLOW_CLIENT_GEMINI` | Force client Gemini when Supabase configured | Debug only |
| `VITE_SENTRY_DSN` / `VITE_POSTHOG_KEY` | Production telemetry | Optional |

Server-only secrets (edge functions, not `VITE_*`): `GEMINI_API_KEY`, `PEXELS_API_KEY`, `GIPHY_API_KEY`, `APP_URL`. See [.env.example](.env.example) and [.github/SECRETS.template.md](.github/SECRETS.template.md).
>>>>>>> origin/main

## Known Live Limitations

- **Multiplayer and durable friend judging** need Supabase env vars and `supabase/schema.sql` applied.
- **AI scoring** needs Gemini (client or edge); otherwise mock scoring and curated fusion images.
- **Ranked, shop, and tournaments** are local-preview modes until cloud sync is scoped.
- **Party Mode** and **community gallery** are not user-facing products (see PRD).
- **Hosted rehearsal** remains the launch gate — [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md).

## Project Structure

```text
src/
<<<<<<< HEAD
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
=======
  components/   reusable UI
  context/      GameContext, RoomContext
  data/         themes and prompt assets
  features/     lobby, round, reveal, gallery, judge, room, summary, …
  hooks/        shared hooks
  lib/          utilities (judgeMode, telemetry, productionMode)
  services/     storage, sharing, AI, multiplayer, votes, …
supabase/
  schema.sql    tables + RPCs
  functions/    edge functions
  migrations/   incremental SQL
e2e/            Playwright specs
discord-bot/    optional standalone Discord package
```

## Documentation Index

| Doc | Purpose |
|---|---|
| [START_HERE.md](START_HERE.md) | Fastest onboarding path |
| [PRD.md](PRD.md) | Product requirements + feature registry |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, RPCs, persistence |
| [ROADMAP.md](ROADMAP.md) | Phase implementation status |
| [JUDGE_MODEL.md](JUDGE_MODEL.md) | AI / manual / friend / room_vote |
| [SETUP.md](SETUP.md) / [SETUP_BACKEND.md](SETUP_BACKEND.md) | Env + Supabase + edge |
| [DEPLOYMENT.md](DEPLOYMENT.md) / [DEPLOY_NOW.md](DEPLOY_NOW.md) | Hosting |
| [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) | Launch gate checklist |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev workflow |
| [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) | QA expected behavior |
| [TESTING_SETUP_SUMMARY.md](TESTING_SETUP_SUMMARY.md) | Test inventory |
| [DISCORD_BOT.md](DISCORD_BOT.md) | Discord integration |
| [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) | Future app-store prep (aspirational) |
>>>>>>> origin/main

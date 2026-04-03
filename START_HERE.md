# START HERE — Quick Start Guide

## Install, Configure, Run, Play

### Step 1: Install

```bash
npm install
```

### Step 2: Configure (Optional)

Copy `.env.example` to `.env` and fill in any values you want. All env vars are optional — the app works fully without them using mock data.

See [SETUP.md](SETUP.md) for details on each variable.

### Step 3: Run

```bash
npm run dev
```

Open http://localhost:5173/giant-schrodinger/ in your browser.

### Step 4: Play

The lobby uses **progressive disclosure** — new users see a simplified UI with just the essentials. As you play more, additional features unlock in the interface.

Available game modes:
- **Solo** — Play alone with AI scoring
- **Multiplayer** — Create or join rooms with friends
- **Ranked** — Elo-rated competitive play with 6 tiers (Bronze to Venn Master)
- **Async** — Play at your own pace, compare later
- **Daily Challenge** — New challenge every day, global leaderboard
- **Tournaments** — Bracket-style competitions
- **Party Mode** — Casual group play
- **AI Battle** — Best of 5 against the AI

AI scoring is powered by Google Gemini 2.0 Flash and evaluates wit, logic, originality, and clarity. Without an API key, mock scoring provides a realistic experience.

---

## What the App Does

Players see two random concept images and write a clever phrase connecting them. The connection appears in the intersection of a Venn diagram. Submissions are scored by AI or friends.

**Example**: You see a photo of a jazz club and a photo of a robot. You type: "Both improvise — one with soul, one with algorithms." The AI scores your wit, logic, originality, and clarity on a 1-10 scale.

The game includes **93 features** across 5 development phases:
- **Phase 1**: Core gameplay, scoring, multiplayer, progression, infrastructure
- **Phase 2**: Responsive images, game flow polish, session management
- **Phase 3**: Social features, retention hooks, competitive systems, community gallery
- **Phase 4**: Monetization, platform growth, testing, analytics, contextual tips
- **Phase 5**: Production hardening, accessibility, competitive integrity, creator economy

---

## Project Commands

```bash
npm run dev            # Start dev server (Vite, HMR)
npm run build          # Production build to dist/
npm run preview        # Preview production build locally
npm run test           # Run 179 unit/integration tests (Vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate HTML coverage report
npm run test:e2e       # Run Playwright E2E tests (all browsers)
npm run test:e2e:ui    # Playwright with interactive UI
npm run lint           # ESLint check
```

---

## Project Architecture

The codebase follows a **feature-based** organization:

```
src/
  features/    # 18 feature modules (lobby, round, reveal, judge, etc.)
  services/    # 40+ business logic modules (scoring, multiplayer, achievements)
  context/     # React Context (GameContext, RoomContext, ToastContext)
  components/  # Shared UI components
  hooks/       # Custom hooks
  lib/         # Utility functions
  data/        # Static data (themes, concept images)
```

For the full architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Documentation

| Document | Purpose |
|----------|---------|
| **Getting Started** | |
| [SETUP.md](SETUP.md) | Environment variables and backend setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy to GitHub Pages, Vercel, or manual |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow and PR guidelines |
| **Architecture & Design** | |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, and decisions |
| [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) | Feature specifications and edge cases |
| **Testing & Quality** | |
| [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) | Manual testing instructions |
| [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) | QA checklist |
| [TESTING_SETUP_SUMMARY.md](TESTING_SETUP_SUMMARY.md) | Test suite configuration |
| [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) | Lighthouse targets and actuals |
| **Planning** | |
| [NEXT_STEPS.md](NEXT_STEPS.md) | 109-item roadmap across 6 phases |
| [CHANGELOG.md](CHANGELOG.md) | Development history by phase |
| **Platform** | |
| [DISCORD_BOT.md](DISCORD_BOT.md) | Discord bot setup |
| [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) | App store preparation |

---

## Troubleshooting

### Page will not load
1. Check if the dev server is running (`npm run dev`)
2. Clear browser cache with Ctrl+Shift+R
3. Check the URL includes the base path: http://localhost:5173/giant-schrodinger/

### Blank white screen
1. Open DevTools (F12) and check the Console tab for errors
2. Run `npm install` to make sure dependencies are up to date
3. Try `npm run build` to check for build errors

### Missing features
Some features require environment variables. Without `VITE_SUPABASE_URL`, multiplayer uses mock rooms. Without `VITE_GEMINI_API_KEY`, scoring uses mock data. The game is fully playable without any env vars. See [SETUP.md](SETUP.md) for the full list.

### Tests failing
1. Run `npm install` to ensure all dependencies are installed
2. Run `npm run test` — all 179 tests should pass
3. For E2E tests, Playwright browsers need to be installed: `npx playwright install`

### ESLint errors
The project currently has 59 ESLint errors (unused variables/imports). These are non-blocking for development but should be cleaned up before production. See [NEXT_STEPS.md](NEXT_STEPS.md) #99 for details.

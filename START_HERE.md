# START HERE — Quick Start Guide
<<<<<<< HEAD
=======

**Last updated:** July 14, 2026
>>>>>>> origin/main

## Install, Configure, Run, Play

### Step 1: Install

```bash
npm install
```

### Step 2: Configure (optional)

<<<<<<< HEAD
Copy `.env.example` to `.env` and fill in any values you want. All env vars are optional — the app works fully without them using mock data.
=======
Copy `.env.example` to `.env` and fill in any values you want.
>>>>>>> origin/main

- **No keys:** full solo loop with mock scoring and curated fusion art
- **Gemini:** live AI scores and generated fusion images
- **Supabase:** realtime multiplayer, durable friend judging, room voting

See [SETUP.md](SETUP.md) for each variable. Multiplayer is **not** available without Supabase.

### Step 3: Run

```bash
npm run dev
```

Open http://localhost:5173/giant-schrodinger/

### Step 4: Play

<<<<<<< HEAD
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
=======
The lobby uses **progressive disclosure** — new users see a simplified UI; more surfaces unlock as you play.

**Available game modes**

| Mode | Availability |
|---|---|
| **Solo** | Always — AI or manual scoring |
| **Daily Challenge** | Always |
| **Friend judging** | Share links always; durable results need Supabase |
| **Multiplayer** | Requires Supabase |
| **Ranked / Shop / Tournaments / Async** | Local-preview only (device progress) |

AI scoring uses Google Gemini (wit, logic, originality, clarity). Without a key, mock scoring still works.
>>>>>>> origin/main

---

## What the App Does

Players see two media prompts and write a clever phrase connecting them. The connection appears in a Venn diagram intersection and is scored by AI, self-judgement, a friend, or room vote.

<<<<<<< HEAD
**Example**: You see a photo of a jazz club and a photo of a robot. You type: "Both improvise — one with soul, one with algorithms." The AI scores your wit, logic, originality, and clarity on a 1-10 scale.

The game includes **93 features** across 5 development phases:
- **Phase 1**: Core gameplay, scoring, multiplayer, progression, infrastructure
- **Phase 2**: Responsive images, game flow polish, session management
- **Phase 3**: Social features, retention hooks, competitive systems, community gallery
- **Phase 4**: Monetization, platform growth, testing, analytics, contextual tips
- **Phase 5**: Production hardening, accessibility, competitive integrity, creator economy
=======
Canonical product status and roadmap: [PRD.md](PRD.md).
>>>>>>> origin/main

---

## Project Commands

```bash
<<<<<<< HEAD
npm run dev            # Start dev server (Vite, HMR)
npm run build          # Production build to dist/
npm run preview        # Preview production build locally
npm run test           # Run 179 unit/integration tests (Vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate HTML coverage report
npm run test:e2e       # Run Playwright E2E tests (all browsers)
npm run test:e2e:ui    # Playwright with interactive UI
npm run lint           # ESLint check
=======
npm run dev               # Start dev server
npm run build             # Production build
npm run preview           # Preview production build
npm run test              # Unit/integration tests (688)
npm run test:e2e:desktop  # Playwright E2E (11 specs)
npm run verify:release    # Lint + unit + E2E + build
npm run rehearsal:status  # Hosted env readiness
npm run launch:gate       # Launch gate automation
npm run lint              # ESLint
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
| [PRD.md](PRD.md) | Product requirements + feature registry |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, RPCs, persistence |
| [ROADMAP.md](ROADMAP.md) | Implementation phase status |
| [JUDGE_MODEL.md](JUDGE_MODEL.md) | Scoring mode decisions |
| [SETUP.md](SETUP.md) | Environment variables and backend setup |
| [SETUP_BACKEND.md](SETUP_BACKEND.md) | Launch-gate backend checklist |
| [DEPLOYMENT.md](DEPLOYMENT.md) | GitHub Pages and Vercel |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor workflow |
| [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) | Feature QA expectations |
| [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) | Manual testing instructions |
| [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) | Pre-release QA checklist |
| [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) | Hosted launch rehearsal |
| [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) | Performance targets |
>>>>>>> origin/main
| [DISCORD_BOT.md](DISCORD_BOT.md) | Discord bot setup |
| [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) | Future app-store prep |

---

## Troubleshooting

### Page will not load
<<<<<<< HEAD
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
=======
1. Confirm `npm run dev` is running
2. Hard refresh (Ctrl+Shift+R)
3. Use the trailing-slash URL: http://localhost:5173/giant-schrodinger/

### Blank white screen
1. Open DevTools (F12) → Console
2. Run `npm install` and retry

### Multiplayer unavailable
Expected without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. There is no user-facing mock multiplayer — configure Supabase per [SETUP.md](SETUP.md).

### AI scores feel instant / generic
Expected without Gemini (or when the edge function falls back). Mock scoring still returns structured commentary.
>>>>>>> origin/main

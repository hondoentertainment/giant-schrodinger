# START HERE - Quick Start Guide

## Install, Configure, Run, Play

### Step 1: Install

```bash
npm install
```

### Step 2: Configure (Optional)

Copy `.env.example` to `.env` and fill in any values you want. All env vars are optional -- the app works fully without them using mock data.

See [SETUP.md](SETUP.md) for details on each variable.

### Step 3: Run

```bash
npm run dev
```

Open http://localhost:5173/giant-schrodinger/ in your browser.

### Step 4: Play

The lobby uses **progressive disclosure** -- new users see a simplified UI with just the essentials. As you play more, additional features unlock in the interface.

Available game modes:
- **Solo** -- Play alone with AI scoring
- **Multiplayer** -- Create or join rooms with friends
- **Ranked** -- Elo-rated competitive play with tiers
- **Async** -- Play at your own pace, compare later
- **Daily Challenge** -- New challenge every day
- **Tournaments** -- Bracket-style competitions
- **Party Mode** -- Casual group play

AI scoring is powered by Google Gemini and evaluates wit, logic, originality, and clarity. Without an API key, mock scoring provides a realistic experience.

---

## What the App Does

Players see two random concept images and write a clever phrase connecting them. The connection appears in the intersection of a Venn diagram. Submissions are scored by AI or friends.

The game includes 93 features across 5 development phases:
- **Phase 1**: Core gameplay, solo and multiplayer
- **Phase 2**: Social sharing, gallery, friend judging, daily challenges
- **Phase 3**: Ranked mode, spectator mode, community gallery, tournaments
- **Phase 4**: Battle pass, story sharing, weekly events, colorblind mode
- **Phase 5**: Achievement progress, score coaching, progressive lobby, PWA features

---

## Project Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run 179 unit/integration tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # ESLint check
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [SETUP.md](SETUP.md) | Environment variables and backend setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy to GitHub Pages and Supabase |
| [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) | Manual testing instructions |
| [EXPECTED_BEHAVIORS.md](EXPECTED_BEHAVIORS.md) | Feature specifications |
| [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md) | QA checklist |
| [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md) | Performance targets and actuals |
| [NEXT_STEPS.md](NEXT_STEPS.md) | Roadmap and future plans |
| [DISCORD_BOT.md](DISCORD_BOT.md) | Discord bot setup |
| [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) | App store preparation |

---

## Troubleshooting

### Page will not load
1. Check if the dev server is running (`npm run dev`)
2. Clear browser cache with Ctrl+Shift+R
3. Check the URL has a trailing slash: http://localhost:5173/giant-schrodinger/

### Blank white screen
1. Open DevTools (F12) and check the Console tab for errors
2. Run `npm install` to make sure dependencies are up to date

### Missing features
Some features require environment variables. Without `VITE_SUPABASE_URL`, multiplayer uses mock rooms. Without `VITE_GEMINI_API_KEY`, scoring uses mock data. See [SETUP.md](SETUP.md) for the full list.

# START HERE — Quick Start Guide

**Last updated:** July 14, 2026

## Install, Configure, Run, Play

### Step 1: Install

```bash
npm install
```

### Step 2: Configure (optional)

Copy `.env.example` to `.env` and fill in any values you want.

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

---

## What the App Does

Players see two media prompts and write a clever phrase connecting them. The connection appears in a Venn diagram intersection and is scored by AI, self-judgement, a friend, or room vote.

Canonical product status and roadmap: [PRD.md](PRD.md).

---

## Project Commands

```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run preview           # Preview production build
npm run test              # Unit/integration tests (688)
npm run test:e2e:desktop  # Playwright E2E (11 specs)
npm run verify:release    # Lint + unit + E2E + build
npm run rehearsal:status  # Hosted env readiness
npm run launch:gate       # Launch gate automation
npm run lint              # ESLint
```

---

## Documentation

| Document | Purpose |
|----------|---------|
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
| [DISCORD_BOT.md](DISCORD_BOT.md) | Discord bot setup |
| [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) | Future app-store prep |

---

## Troubleshooting

### Page will not load
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

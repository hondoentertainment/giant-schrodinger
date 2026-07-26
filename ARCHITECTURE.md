<<<<<<< HEAD
# Architecture: Venn with Friends

This document describes the system design, data flow, key architectural decisions, and how the major subsystems connect.

---

## High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                       Client (React SPA)                  │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐ │
│  │  Lobby   │→ │  Round   │→ │  Reveal   │→ │ Summary │ │
│  └─────────┘  └──────────┘  └───────────┘  └─────────┘ │
│       │            │              │              │        │
│  ┌────┴────────────┴──────────────┴──────────────┘       │
│  │              Context Layer                            │
│  │  GameContext · RoomContext · ToastContext               │
│  └───────────────────┬───────────────────────────────────┘
│                      │                                    │
│  ┌───────────────────┴───────────────────────────────────┐
│  │              Services Layer (40+ modules)              │
│  │  gemini · multiplayer · achievements · ranked · ...    │
│  └───────────────────┬───────────────────────────────────┘
│                      │                                    │
└──────────────────────┼────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
    │  Supabase │ │ Gemini │ │  Stripe  │
    │  (DB/RT)  │ │  (AI)  │ │ (Payments│
    └───────────┘ └────────┘ └──────────┘
```

---

## Core Game Loop

The game follows a state machine pattern managed by `GameContext`:

```
LOBBY → PLAYING → REVEALING → SUMMARY
  ↑        │          │          │
  │        │          │          │
  └────────┴──────────┴──────────┘
```

### Phase Transitions

1. **LOBBY** — Player configures game settings (mode, theme, session length, scoring). `Lobby.jsx` renders the full configuration UI with progressive disclosure.

2. **PLAYING** — A round begins. `Round.jsx` displays two concept images, starts the countdown timer, and accepts text input. Round modifiers (Speed, Double-or-Nothing, Final Showdown) alter time limits and scoring multipliers.

3. **REVEALING** — After submission (or time-up auto-submit), `Reveal.jsx` calls `scoreSubmission()` and displays the animated score reveal with breakdown (wit, logic, originality, clarity), connection explanation, and coaching tips.

4. **SUMMARY** — After all rounds complete, `SessionSummary.jsx` shows session stats, best connection, streak status, achievement unlocks, and share options.

### State Flow

```jsx
// GameContext manages the full game state
{
  phase: 'LOBBY' | 'PLAYING' | 'REVEALING' | 'SUMMARY',
  playerName, avatar, theme, scoringMode,
  sessionLength, roundNumber, totalRounds,
  currentAssets: { left, right },        // Current concept pair
  lastScore: { total, wit, logic, ... }, // Latest score result
  sessionScores: [],                     // All rounds in session
  streak: { current, max, lastPlayDate },
  achievements: [],                      // Unlocked achievements
  coins, xp, battlePassTier,            // Progression
}
```

---

## Feature Module Pattern

Each feature lives in `src/features/<name>/` and contains:

```
src/features/reveal/
  Reveal.jsx           # Main component
  Reveal.test.jsx      # Tests (co-located)
  ScoreBreakdown.jsx   # Sub-component (if needed)
```

Features are **self-contained** — they import from `services/`, `context/`, `components/`, and `lib/`, but never from other features. This keeps dependencies unidirectional.

### Lazy Loading

Heavy features are code-split via `React.lazy()` in `App.jsx`:

```jsx
const Leaderboard = lazy(() => import('./features/leaderboard/Leaderboard'));
const Achievements = lazy(() => import('./features/achievements/Achievements'));
const ThemeBuilder = lazy(() => import('./features/creator/ThemeBuilder'));
const Shop = lazy(() => import('./features/shop/Shop'));
const AIBattle = lazy(() => import('./features/ai/AIBattle'));
const TournamentLobby = lazy(() => import('./features/tournament/TournamentLobby'));
// ... 24 lazy chunks total
```

---

## Services Layer

Services in `src/services/` encapsulate all business logic and external API calls. Components never call APIs directly.

### Key Services

| Service | Responsibility |
|---------|---------------|
| `gemini.js` | AI scoring via Gemini 2.0 Flash, fusion image generation via Imagen 3.0 |
| `multiplayer.js` | Room creation, joining, real-time sync via Supabase Realtime |
| `achievements.js` | 51+ achievement definitions, unlock logic, progress tracking |
| `ranked.js` | Elo calculation, tier mapping, placement matches, decay |
| `challenges.js` | Daily challenge generation, participation tracking |
| `leaderboard.js` | Leaderboard queries (global, friends, seasonal) |
| `shop.js` | Inventory, purchases, battle pass tiers, cosmetic unlocks |
| `share.js` | Share link generation, shared round persistence |
| `friends.js` | Friend list management, challenge links |
| `analytics.js` | Event tracking (wired to `trackEvent()` throughout codebase) |
| `offlineQueue.js` | Queue submissions when offline, process on reconnect |
| `errorMonitoring.js` | Global error and unhandled rejection capture |
| `notifications.js` | Push notification trigger definitions |
| `matchmaking.js` | Ranked matchmaking queue with rating-based pairing |
| `socialShare.js` | Share text generation, platform-specific formatting |
| `highlights.js` | Highlight reel generation from session data |
| `votes.js` | Community gallery voting system |

### Scoring Pipeline

```
Player submits text
       │
       ▼
scoreSubmission(submission, assets)    ← src/services/gemini.js
       │
       ├─ If Supabase configured → Edge Function → Gemini API (server-side)
       │                                    │
       │                              Returns: { total, wit, logic,
       │                                         originality, clarity,
       │                                         explanation }
       │
       ├─ If Gemini API key only → Client-side Gemini call
       │
       └─ If no API key → Mock scoring (deterministic from input hash)
       
       │
       ▼
Score stored in GameContext → Reveal.jsx displays result
       │
       ▼
Achievements checked → Leaderboard updated → Share card generated
```

---

## Data Layer

### Supabase Schema

The database schema (`supabase/schema.sql`) includes:

| Table | Purpose |
|-------|---------|
| `users` | Player profiles, stats, preferences |
| `rounds` | Individual round submissions and scores |
| `leaderboard` | Aggregated leaderboard entries |
| `challenges` | Daily and weekly challenge definitions |
| `rooms` | Multiplayer room state |
| `room_players` | Players in each room |
| `room_submissions` | Per-round submissions in multiplayer |
| `shared_rounds` | Persisted shared round data for judge links |
| `analytics_events` | Event tracking data |
| `seasonal_ratings` | Ranked mode Elo per season |

All tables use **Row Level Security (RLS)** policies. Realtime is enabled for `rooms`, `room_players`, and `room_submissions`.

### Client-Side Storage

When Supabase is unavailable, data persists in localStorage:

| Key | Data |
|-----|------|
| `venn_player` | Player name, avatar, preferences |
| `venn_streak` | Current streak, max streak, last play date |
| `venn_achievements` | Unlocked achievements with timestamps |
| `venn_scores` | Session history for stats |
| `venn_coins` | Currency balance |
| `venn_battle_pass` | Battle pass tier and XP |
| `venn_friends` | Friend list |
| `venn_lobby_tier` | Progressive disclosure unlock level |
| `venn_custom_images` | Base64 custom concept images |
| `venn_sound_enabled` | Sound preference |

---

## Multiplayer Architecture

Real-time multiplayer uses Supabase Realtime channels:

```
Host creates room → Room code generated → Stored in Supabase `rooms` table
       │
       ▼
Players join via code → Subscribe to room channel
       │
       ▼
Room state machine (managed by RoomContext):

  WAITING → PLAYING → REVEALING → RESULTS
     │         │          │          │
     │    All submit   Scores     Next round
     │    or timeout   revealed   or game over
     │         │          │          │
     └─────────┴──────────┴──────────┘

Channel events:
  - player_joined / player_left
  - round_start (concept pair broadcast)
  - submission (player's answer)
  - scores_revealed (all scores)
  - game_over (final standings)
```

---

## Build & Deployment

### Build Pipeline

```
Source (JSX/JS) → Vite 5 → Rollup bundling → Code splitting → dist/
                     │
                     ├─ 1 main chunk (~510 KB / 149 KB gzip)
                     ├─ 24 lazy-loaded chunks
                     ├─ 1 CSS file (83 KB / 12 KB gzip)
                     └─ index.html with OG meta tags
```

### CI/CD (GitHub Actions)

**deploy.yml** (push to `main`):
1. Install Node 20 + dependencies
2. Run 179 unit/integration tests (Vitest)
3. Install Playwright browsers, run E2E tests
4. Build production bundle
5. Deploy to GitHub Pages

**lighthouse.yml** (PRs to `main`):
1. Build the app
2. Run Lighthouse CI
3. Enforce thresholds: Performance 80+, Accessibility 90+

### Deployment Targets

| Platform | Config | Status |
|----------|--------|--------|
| GitHub Pages | `.github/workflows/deploy.yml` | Workflow ready, needs repo settings enabled |
| Vercel | `vercel.json` | Config present |
| Manual | `gh-pages` npm package | Documented in DEPLOYMENT.md |

Base URL: `/giant-schrodinger/` (configured in `vite.config.js` and `index.html`).

---

## Key Architectural Decisions

### 1. Context over Redux
React Context API handles all shared state. With 3 focused contexts (Game, Room, Toast), the state tree stays manageable without Redux's boilerplate. The tradeoff is potential re-render overhead in deeply nested components, mitigated by keeping contexts focused.

### 2. Services Layer Abstraction
Components never call external APIs directly. The services layer (`src/services/`) provides a consistent interface that handles:
- API availability detection (Supabase configured? Gemini key present?)
- Graceful fallback to mock data
- Error handling and offline queuing

This means the entire app works without any backend — critical for development and demo purposes.

### 3. Feature-Based Organization
Code is organized by feature (`src/features/`) rather than by type (components/, containers/, etc.). This keeps related code together and makes it easy to understand, modify, or remove a feature without hunting across directories.

### 4. Progressive Enhancement
The app works at every level of backend availability:
- **No env vars**: Full game with mock scoring, mock multiplayer, curated images
- **Gemini key only**: Real AI scoring, curated images
- **Supabase only**: Real multiplayer, leaderboards, mock scoring
- **All services**: Full production experience

### 5. Code Splitting by Feature
Heavy, infrequently-accessed features (Tournament, Shop, Analytics, Theme Builder, AI Battle) are lazy-loaded. Core gameplay (Lobby, Round, Reveal) stays in the main bundle for instant interaction.

### 6. Co-located Tests
Test files live next to the code they test (`Round.test.jsx` alongside `Round.jsx`). This makes it obvious when a component lacks tests and keeps the mental model simple.

---

## Dependency Graph

```
App.jsx
  ├── GameContext (wraps all)
  │     ├── Lobby → services/*, data/themes
  │     ├── Round → services/gemini, hooks/useRoundTimer
  │     ├── Reveal → services/gemini, services/achievements, services/share
  │     └── Summary → services/socialShare, services/highlights
  │
  ├── RoomContext (wraps multiplayer features)
  │     ├── RoomLobby → services/multiplayer
  │     ├── MultiplayerRound → services/multiplayer
  │     └── MultiplayerReveal → services/multiplayer
  │
  └── ToastContext (wraps all)
        └── Toast (global notification display)
```

---

## Security Considerations

| Area | Current State | Target |
|------|--------------|--------|
| Scoring integrity | Client-side (spoofable) | Server-side via Edge Function |
| Database access | RLS policies defined | Enforce in production |
| API keys | Client-side Gemini key exposed | Move to Edge Functions |
| Input validation | Basic `trim()` | Full sanitization (XSS, length) |
| Auth | Anonymous localStorage IDs | Supabase Auth (optional) |
| Rate limiting | None | Client + server-side throttling |

See [NEXT_STEPS.md](NEXT_STEPS.md) items #81 (server-side scoring) and #18 (anti-cheat) for remediation plans.
=======
# Architecture — Venn with Friends

**Last updated:** July 14, 2026  
**Product spec:** [PRD.md](PRD.md)

## Overview

Venn with Friends is a React SPA. Solo play and progression are local-first. Multiplayer, durable friend judging, content reports, and production AI scoring use Supabase (Realtime + Postgres RPCs + Edge Functions).

```text
┌─────────────────────────────────────────────────────────────┐
│  Browser (Vite / React 18)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ GameContext  │  │ RoomContext  │  │ features/* screens│  │
│  │ solo/profile │  │ multiplayer  │  │ lobby→round→reveal│  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │            │
│         └────────┬────────┴────────────────────┘            │
│                  ▼                                          │
│         src/services/*  (AI, share, votes, storage, …)      │
└──────────────────┬──────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────────────────────┐
     ▼             ▼                             ▼
 localStorage   Supabase JS client          Optional telemetry
 (profile,      (Realtime + RPC)            (Sentry / PostHog /
  gallery,                                   vwf:telemetry)
  unlocks)
                   │
     ┌─────────────┼─────────────────────────────┐
     ▼             ▼                             ▼
 Postgres      Edge Functions              Storage bucket
 (rooms,       score-submission            `media`
  votes,       resolve-image
  shared_      resolve-meme
  rounds,      og-tags
  reports)     discord-bot (optional)
```

## Client structure

```text
src/
  App.jsx           game-state router (LOBBY, ROUND, REVEAL, rooms, …)
  context/          GameContext, RoomContext
  features/         screen-level UI (lobby, round, reveal, gallery, room, …)
  components/       shared UI (VennDiagram, LocalPreviewBadge, …)
  services/         domain logic + API wrappers
  data/             themes and prompt assets
  lib/              utilities (judgeMode, telemetry, productionMode, …)
  locales/          en.json, es.json
```

### Game states (high level)

| State | Purpose |
|---|---|
| `LOBBY` | Profile, mode pick, create/join room |
| `ROUND` / `REVEAL` / `SESSION_SUMMARY` | Solo session arc |
| Room phases (via RoomContext) | lobby → playing → revealing → results → finished |
| `GALLERY`, `ACHIEVEMENTS`, `LEADERBOARD` | Personal history / progression |
| `RANKED`, `SHOP`, `TOURNAMENT`, `ASYNC_CHAINS` | Local-preview surfaces |
| `MODERATION`, `ANALYTICS` | Safety / diagnostics |
| `PRIVACY`, `TERMS` | Legal pages |

## Judging pipeline

Canonical rules: [JUDGE_MODEL.md](JUDGE_MODEL.md).

```text
Solo AI ──► score-submission edge (preferred when Supabase configured)
       └─► client Gemini (dev / VITE_ALLOW_CLIENT_GEMINI) or mock

Solo manual ──► self-score on reveal ──► gallery judgeMode: human

Friend ──► share token ──► JudgeRound UI ──► submit_round_judgement RPC
                                          └─► localStorage fallback

Room human ──► cast_room_vote ──► finalize_room_votes ──► shared standings
```

## Backend surface (Supabase)

### Core RPCs (see `supabase/schema.sql`)

| RPC | Role |
|---|---|
| `create_shared_round` / `get_shared_round_by_token` / `submit_round_judgement` | Friend judging |
| `create_room_session` / `join_room_session` / `leave_room_session` | Rooms |
| `start_room_round` / `submit_room_answer` / `score_room_submission` | Round flow |
| `cast_room_vote` / `finalize_room_votes` / `advance_room_state` | Authoritative voting |
| `report_content` / `list_content_reports` / `update_content_report_status` | Moderation |

Realtime publication includes `rooms`, `room_players`, `room_submissions`.

### Edge functions

| Function | Purpose | Secrets |
|---|---|---|
| `score-submission` | Server-side Gemini scoring | `GEMINI_API_KEY` |
| `resolve-image` | Pexels stock lookup | `PEXELS_API_KEY` |
| `resolve-meme` | Giphy lookup | `GIPHY_API_KEY` |
| `og-tags` | Share preview HTML | `APP_URL` |
| `discord-bot` | Slash commands | Discord tokens |

## Persistence model

| Data | Default store | Cloud when configured |
|---|---|---|
| Profile, unlocks, streaks | localStorage | Phase 9 (deferred) |
| Gallery collisions | localStorage | Enriched by judgements |
| Friend judgements | localStorage fallback | `shared_rounds` + `judgements` |
| Room state / votes | — | Supabase authoritative |
| Content reports | — | Supabase |

## Hosting & base paths

| Host | Base path | Notes |
|---|---|---|
| Local Vite | `/giant-schrodinger/` | Match Pages path in `vite.config` |
| GitHub Pages | `/giant-schrodinger/` | `.github/workflows/deploy.yml` |
| Vercel | `/` | Primary production URL in [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md) |

## Security notes

- Prefer server-only Gemini when Supabase is configured (`productionMode`)
- Client Gemini gated behind `VITE_ALLOW_CLIENT_GEMINI` for local debug
- CSP and security headers via `vercel.json`
- Never put Pexels/Giphy keys in `VITE_*` vars — edge secrets only

## Related docs

- Setup: [SETUP.md](SETUP.md) · [SETUP_BACKEND.md](SETUP_BACKEND.md)
- Deploy: [DEPLOYMENT.md](DEPLOYMENT.md)
- Launch: [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) · [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md)
>>>>>>> origin/main

# Venn with Friends

A creative party game where players connect two prompts with one witty phrase. Supports solo sessions, shareable friend judging, progression/unlocks, and Supabase-backed realtime multiplayer.

**Product docs:** [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [JUDGE_MODEL.md](JUDGE_MODEL.md) · [ROADMAP.md](ROADMAP.md) · [START_HERE.md](START_HERE.md)

## Current Product

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

3. Start development:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173/giant-schrodinger/

4. Validate:
   ```bash
   npm run test              # 688 unit tests
   npm run test:e2e:desktop  # 11 Playwright specs
   npm run build
   npm run verify:release    # lint + unit + e2e + build
   ```

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

## Known Live Limitations

- **Multiplayer and durable friend judging** need Supabase env vars and `supabase/schema.sql` applied.
- **AI scoring** needs Gemini (client or edge); otherwise mock scoring and curated fusion images.
- **Ranked, shop, and tournaments** are local-preview modes until cloud sync is scoped.
- **Party Mode** and **community gallery** are not user-facing products (see PRD).
- **Hosted rehearsal** remains the launch gate — [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md).

## Project Structure

```text
src/
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

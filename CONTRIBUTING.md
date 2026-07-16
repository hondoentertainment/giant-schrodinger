# Contributing — Venn with Friends

Thanks for helping. Keep changes small, documented, and honest about what requires live services.

## Prerequisites

- Node.js 20+ recommended
- `npm install`
- Optional: Supabase CLI, Playwright browsers (`npx playwright install`)

## Local setup

1. Copy `.env.example` to `.env` (all vars optional for solo)
2. `npm run dev` → http://localhost:5173/giant-schrodinger/
3. For multiplayer locally: configure Supabase per [SETUP.md](SETUP.md) and apply `supabase/schema.sql`

## Validation before PR

```bash
npm run lint
npm run test                 # 688 unit tests (as of July 2026)
npm run test:e2e:desktop     # 11 Playwright specs
npm run build
# or all of the above:
npm run verify:release
```

For launch-related changes, also run or note:

```bash
npm run rehearsal:status
npm run launch:gate
```

## Code conventions

- Match existing React patterns in `src/features/` and `src/services/`
- Prefer local-first solo behavior; gate cloud calls behind configured Supabase
- Label device-only experiments with `LocalPreviewBadge` until cloud sync is intentional
- Do not claim Party Mode or community gallery in UI/docs unless those surfaces exist
- Keep [PRD.md](PRD.md) feature registry and [README.md](README.md) status matrix in sync when changing live-service requirements

## Docs to update when you change behavior

| Change | Update |
|---|---|
| New mode or env dependency | PRD §2 registry + README feature table |
| Judge / scoring behavior | [JUDGE_MODEL.md](JUDGE_MODEL.md) |
| RPC / edge function | [ARCHITECTURE.md](ARCHITECTURE.md) + [SETUP_BACKEND.md](SETUP_BACKEND.md) |
| Release process | [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) |

## Pull requests

- Describe what works without keys vs with Gemini/Supabase
- Link to any manual rehearsal steps if multiplayer or edge functions changed
- Do not commit secrets (`.env`, API keys)

## Canonical reading order

1. [START_HERE.md](START_HERE.md)
2. [PRD.md](PRD.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)
4. [ROADMAP.md](ROADMAP.md)

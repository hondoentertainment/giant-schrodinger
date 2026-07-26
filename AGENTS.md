# AGENTS.md

Guidance for AI/code agents working in this repository.

## Repository at a glance

- App: **Venn with Friends** (React + Vite)
- Focus: local-first party game with optional Gemini and Supabase integrations
- Key docs: `START_HERE.md`, `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CONTRIBUTING.md`

## Environment and setup

- Node.js 20+ recommended
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (default URL: `http://localhost:5173/giant-schrodinger/`)
- Optional services:
  - Gemini: `VITE_GEMINI_API_KEY`
  - Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Required validation before handoff

Run these when changing code or behavior:

```bash
npm run lint
npm run test
npm run test:e2e:desktop
npm run build
```

Or run all at once:

```bash
npm run verify:release
```

## Working rules

- Keep changes small and scoped.
- Preserve **local-first** behavior; cloud features must remain gated behind configured services.
- Do not commit secrets (`.env`, API keys, tokens).
- Keep claims in docs/UI accurate about what works:
  - without keys
  - with Gemini
  - with Supabase
- If behavior or dependencies change, update related docs (especially `README.md`, `PRD.md`, and architecture/setup docs).

## High-value code areas

- `src/features/` — gameplay flows and feature slices
- `src/services/` — storage, AI, sharing, multiplayer, vote logic
- `src/context/` — shared game/room state
- `supabase/schema.sql` + `supabase/functions/` — backend contracts and edge behavior
- `e2e/` — Playwright end-to-end tests

## Notes for agent output

- Clearly state any features that require Supabase or Gemini.
- If a change is launch/release related, include rehearsal and launch-gate implications.
- Prefer referencing existing docs rather than duplicating long procedural content.

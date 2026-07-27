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

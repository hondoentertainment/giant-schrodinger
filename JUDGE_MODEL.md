# Judge Model — Canonical Product Decisions

Last updated: June 2025

This document resolves the open product questions in the PRD and defines how judging modes behave across solo, friend, and multiplayer flows.

## Modes

| Mode | ID | When used | Who scores |
|------|-----|-----------|------------|
| AI Judge | `ai` | Solo profile default (optional) | Gemini with mock fallback |
| Manual Judge | `human` | Solo profile default (optional) | Player self-scores on reveal |
| Friend Judge | `friend` | Share link after any solo round | Async friend via link |
| Room Vote | `room_vote` | Multiplayer with `human` scoring mode | All players vote; host finalizes |

## Decisions

1. **Manual vs friend judge stay separate.** Manual Judge is synchronous self-scoring on reveal. Friend Judge is always async via share link and can complement either AI or manual solo modes.

2. **Multiplayer defaults to human (room vote) scoring.** Competitive room voting is the authoritative multiplayer path. AI scoring in rooms is optional for host-configured casual sessions.

3. **AI Judge is optional for solo, not the default for multiplayer.** Solo players choose AI or manual in profile settings. Multiplayer rooms use room vote when `scoring_mode` is `human`.

4. **Gallery artifacts always record judge source** via `judgeMode`: `ai`, `human`, `friend`, or `room_vote`.

## Persistence

- **Friend judgements:** Supabase `shared_rounds` + `judgements` when backend is configured; localStorage fallback via `judgements.js`.
- **Room votes:** Supabase RPCs `cast_room_vote` and `finalize_room_votes` — authoritative for multiplayer.
- **Manual solo scores:** Saved on collision records at reveal time with `judgeMode: 'human'`.

## UI copy

- Onboarding and lobby explain all three solo paths (AI, manual, friend link).
- Multiplayer UI states that live rooms require Supabase and use room voting in manual mode.

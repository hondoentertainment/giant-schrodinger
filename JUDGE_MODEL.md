# Judge Model — Canonical Product Decisions

**Last updated:** July 14, 2026  
**Resolves PRD open questions** for scoring modes across solo, friend, and multiplayer.

## Modes

| Mode | ID | When used | Who scores |
|------|-----|-----------|------------|
| AI Judge | `ai` | Solo profile option | Gemini (edge preferred in prod) with mock fallback |
| Manual Judge | `human` | Solo profile option | Player self-scores on reveal |
| Friend Judge | `friend` | Share link after any solo round | Async friend via link |
| Room Vote | `room_vote` | Multiplayer when scoring mode is `human` | All players vote; host finalizes |

## Decisions

1. **Manual vs friend judge stay separate.** Manual Judge is synchronous self-scoring on reveal. Friend Judge is always async via share link and can complement either AI or manual solo modes.

2. **Multiplayer defaults to human (room vote) scoring.** Competitive room voting is the authoritative multiplayer path. AI scoring in rooms is optional for host-configured casual sessions.

3. **AI Judge is optional for solo, not the default for multiplayer.** Solo players choose AI or manual in profile settings. Multiplayer rooms use room vote when `scoring_mode` is `human`.

4. **Gallery artifacts always record judge source** via `judgeMode`: `ai`, `human`, `friend`, or `room_vote`.

## Persistence

- **Friend judgements:** Supabase `shared_rounds` + `judgements` when backend is configured; localStorage fallback via `judgements.js`.
- **Room votes:** Supabase RPCs `cast_room_vote` and `finalize_room_votes` — authoritative for multiplayer.
- **Manual solo scores:** Saved on collision records at reveal time with `judgeMode: 'human'`.
- **AI scores:** Prefer `score-submission` edge function when Supabase is configured; client Gemini only when allowed (`VITE_ALLOW_CLIENT_GEMINI` or no Supabase).

## UI copy

- Onboarding and lobby explain solo paths (AI, manual, friend link).
- Multiplayer UI states that live rooms require Supabase and use room voting in manual mode.
- Local-preview competitive surfaces (ranked, etc.) must not imply cloud-authoritative Elo.

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — scoring pipeline diagram
- [PRD.md](PRD.md) §13 — remaining open product questions

# Venn with Friends – Backend & AI Setup

## 0. Quick start

1. Install deps: `npm install`
2. Copy `.env.example` to `.env`
3. Fill in Supabase and Gemini values (or leave Gemini empty for mock scoring)
4. Run `npm run lint` and `npm run build`
5. Start local app: `npm run dev`

## 1. Supabase (real backend, friend judging)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.
3. In Supabase: Settings → API → copy the URL and anon key.
4. Create `.env` with:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Enable access to `shared_rounds` and `judgements` (for anon) via RLS or public access for prototyping.
6. Ensure Realtime is enabled for `rooms`, `room_players`, and `room_submissions`.

### Realtime SQL note

If you have already added the tables to `supabase_realtime`, these lines in `supabase/schema.sql` can fail on rerun:

- `alter publication supabase_realtime add table rooms;`
- `alter publication supabase_realtime add table room_players;`
- `alter publication supabase_realtime add table room_submissions;`

In that case, skip those lines or run the rest of the schema only.

## 2. Gemini API (AI scoring + fusion images)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add to `.env`:

```
VITE_GEMINI_API_KEY=your-key
```

3. **Scoring**: Uses `gemini-2.0-flash`. Falls back to mock scoring if the key is missing.
4. **Fusion images**: Uses `imagen-3.0-generate-002` when a key is set. Falls back to curated images if Imagen is unavailable (e.g. API-key-only plans).

## Multiplayer scoring mode

Multiplayer currently uses AI scoring only. Human/manual multiplayer judging is not enabled yet.

## Without env vars

The app runs without these env vars:

- **Share for judging**: Uses client-only links (base64 payload in URL).
- **AI scoring**: Uses mock scores.
- **Fusion images**: Uses curated theme-based images.

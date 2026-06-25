# Venn with Friends Setup

## 0. Quick start

1. Install deps: `npm install`
2. Copy `.env.example` to `.env`
3. Fill in Supabase and Gemini values as needed
4. Run `npm run test` and `npm run build`
5. Start local app: `npm run dev`

## 1. Environment modes

The app supports three useful runtime modes:

- Solo local mode: no keys required
- AI-enhanced mode: Gemini configured
- Full social mode: Gemini and Supabase configured

If you launch without any env vars:

- solo play works
- AI scoring falls back to mock scoring
- fusion images fall back to curated theme art
- friend judging uses local/basic behavior
- realtime multiplayer is unavailable

## 2. Supabase setup

Supabase powers:

- realtime multiplayer rooms
- shared rounds
- persistent friend judgements

Steps:

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Copy the project URL and anon key from Settings > API
4. Add them to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Ensure Realtime is enabled for:
   - `rooms`
   - `room_players`
   - `room_submissions`

### Rerun note

If you already added tables to `supabase_realtime`, these statements in `supabase/schema.sql` can fail when rerun:

- `alter publication supabase_realtime add table rooms;`
- `alter publication supabase_realtime add table room_players;`
- `alter publication supabase_realtime add table room_submissions;`

If that happens, skip those lines and run the rest of the schema.

6. Apply `supabase/migrations/20260412000014_media_storage.sql` to create the public `media` bucket used for custom uploads and fusion images.

7. Deploy edge functions and set secrets:

```bash
supabase functions deploy resolve-image
supabase functions deploy score-submission
supabase secrets set PEXELS_API_KEY=your-pexels-api-key
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

The `resolve-image` function powers semantic stock photo lookup for AI-generated concepts and keyword fallbacks. Without it, the app falls back to Picsum placeholders.

## 3. Gemini setup

Gemini powers:

- live AI scoring
- generated fusion images

Add this to `.env`:

```env
VITE_GEMINI_API_KEY=your-gemini-api-key
```

Current runtime behavior:

- scoring uses `gemini-2.0-flash`
- image generation uses `imagen-3.0-generate-002`
- if Gemini is unavailable, the app falls back gracefully instead of blocking play

## 4. Pexels setup (optional, recommended)

Pexels powers semantic image lookup through the `resolve-image` Supabase Edge Function.

1. Create a free API key at [pexels.com/api](https://www.pexels.com/api/)
2. Set `PEXELS_API_KEY` as a Supabase function secret (see section 2)
3. Optionally refresh theme catalogs locally:

```bash
PEXELS_API_KEY=your-key npm run refresh:theme-images -- --theme neon --out scripts/output/neon-assets.json
```

When Pexels is unavailable, the app falls back to Picsum placeholders.

## 5. Local validation

Run before shipping changes:

```bash
npm run test
npm run build
npm run test:e2e:desktop
```

## 6. Production secrets

For GitHub Pages deployment, add these repository secrets if you want live services in production:

- `VITE_GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The workflow at `.github/workflows/deploy.yml` already reads those secrets during test and build steps.

## 7. Current limitation note

Realtime multiplayer requires Supabase today.
Non-AI multiplayer scoring UI exists, but authoritative backend scoring/voting still needs follow-on product hardening.

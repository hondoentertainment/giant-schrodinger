# Venn with Friends -- Backend & AI Setup

## 0. Quick Start

1. Install deps: `npm install`
2. Copy `.env.example` to `.env`
3. Fill in the values you need (all are optional -- see table below)
4. Run `npm run lint` and `npm run build`
5. Start local app: `npm run dev`

---

## Environment Variables

| Variable | Purpose | Features affected without it |
|----------|---------|------------------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Multiplayer uses mock rooms; leaderboards, shared rounds, and friend judgements are client-only |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Same as above |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | AI scoring falls back to mock scores; fusion images use curated themes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Shop purchases disabled; cosmetic items still browsable |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID key | Push notifications disabled; in-app notifications still work |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | Error monitoring disabled; errors still appear in console |

**The app runs fully without any env vars.** Solo play, mock multiplayer, gallery, achievements, and all UI features work out of the box.

---

## 1. Supabase (multiplayer, persistence, server-side scoring)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor. This creates all tables (users, rounds, leaderboard, challenges, rooms, analytics_events, ranked data) with Row Level Security policies and indexes.
3. In Supabase: Settings > API > copy the URL and anon key.
4. Create `.env` with:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Enable access to `shared_rounds` and `judgements` (for anon) via RLS or public access for prototyping.
6. Ensure Realtime is enabled for `rooms`, `room_players`, and `room_submissions`.

### Realtime SQL Note

If you have already added the tables to `supabase_realtime`, these lines in `supabase/schema.sql` can fail on rerun:

- `alter publication supabase_realtime add table rooms;`
- `alter publication supabase_realtime add table room_players;`
- `alter publication supabase_realtime add table room_submissions;`

In that case, skip those lines or run the rest of the schema only.

### Edge Functions

Three Supabase Edge Functions are included in `supabase/functions/`:

- **score-submission** -- Server-side Gemini scoring (keeps API key off the client)
- **og-tags** -- Dynamic Open Graph meta tags for shared links
- **discord-bot** -- Discord bot webhook integration

Deploy them with the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase functions deploy score-submission
supabase functions deploy og-tags
supabase functions deploy discord-bot
```

---

## 2. Gemini API (AI scoring + fusion images)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add to `.env`:

```
VITE_GEMINI_API_KEY=your-key
```

3. **Scoring**: Uses `gemini-2.0-flash`. Falls back to mock scoring if the key is missing.
4. **Fusion images**: Uses `imagen-3.0-generate-002` when a key is set. Falls back to curated images if Imagen is unavailable (e.g. API-key-only plans).

---

## 3. Stripe (shop payments)

1. Get a publishable key from [Stripe Dashboard](https://dashboard.stripe.com/).
2. Add to `.env`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Without this key, the shop UI is still browsable but purchases are disabled.

---

## 4. Push Notifications (VAPID)

1. Generate VAPID keys (e.g. via `web-push generate-vapid-keys`).
2. Add the public key to `.env`:

```
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

3. Without this key, push notifications are disabled but in-app notification banners still work.

---

## 5. Sentry (error monitoring)

1. Create a project at [sentry.io](https://sentry.io/).
2. Add to `.env`:

```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

3. Without this, errors are only logged to the browser console.

---

## Without Env Vars

The app runs without any of these env vars:

- **Multiplayer**: Uses mock rooms with simulated players
- **AI scoring**: Uses mock scores with realistic ranges
- **Fusion images**: Uses curated theme-based images
- **Share for judging**: Uses client-only links (base64 payload in URL)
- **Shop**: Browsable but purchases disabled
- **Push notifications**: Disabled (in-app banners still work)
- **Error monitoring**: Console-only

# Backend Setup (Launch Gate)

Complete these steps once to unlock multiplayer, friend judging, server AI scoring, and OG previews.

## Quick commands

```bash
npm run setup:backend      # orchestrated checklist + env sync
npm run sync:env             # pull VITE_* from Vercel into .env.local
npm run check:vercel-env       # verify Vercel production vars
npm run launch:gate            # automated smoke + deployed E2E
```

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Copy **Project URL** and **anon public** key from **Settings → API**.

## 2. Local + Vercel env

Add to `.env.local` (or run `npm run sync:env` after adding keys on Vercel):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
PRODUCTION_URL=https://giant-schrodinger.vercel.app
```

Add the same Supabase vars to **Vercel → Project → Environment Variables → Production**:

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

## 3. Edge functions

Install CLI: `npm i -g supabase`, then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
npm run deploy:edge-functions
```

Set secrets in Supabase dashboard (**Edge Functions → Secrets**):

- `GEMINI_API_KEY`, `PEXELS_API_KEY`, `GIPHY_API_KEY`
- `APP_URL=https://giant-schrodinger.vercel.app`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (for `og-tags`)

Deploy: `resolve-image`, `resolve-meme`, `score-submission`, `og-tags`.

## 4. GitHub Actions (optional)

Add repo secrets per [`.github/SECRETS.template.md`](.github/SECRETS.template.md) so CI runs hosted rehearsal on every push.

## 5. Verify

```bash
npm run check:supabase-rpcs
npm run check:edge-functions
npm run launch:gate
```

## 6. Manual two-browser rehearsal

See [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md) §4–6:

- Friend judging link across browsers
- Multiplayer manual vote → same winner both sides
- Disconnect/reconnect during results

Document findings in [PRODUCTION_TEST_REPORT.md](PRODUCTION_TEST_REPORT.md).

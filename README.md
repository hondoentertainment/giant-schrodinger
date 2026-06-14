# Venn with Friends

A creative party game where players connect two prompts with one witty phrase. The current app already supports solo sessions, shareable friend judging, progression/unlocks, and Supabase-backed realtime multiplayer.

## Current Product

### Core loops

- Solo sessions with 3, 5, or 7 rounds
- Daily challenge mode
- AI judge and manual judge options
- Share a round for friend judging
- Realtime multiplayer rooms
- Gallery/history of saved creations
- Unlocks, streaks, avatars, and themes
- Image, video, and audio prompt modes
- Optional custom image packs for image play

### Feature status

| Area | Works without keys | Works with Gemini | Works with Supabase | Notes |
|---|---|---|---|---|
| Solo sessions | Yes | Yes | N/A | Core local loop works out of the box |
| AI scoring | Mock fallback | Yes | N/A | Falls back to mock scoring when Gemini is unavailable |
| Fusion images | Curated fallback | Yes | N/A | Falls back to curated fusion art |
| Friend judging links | Basic/local fallback | N/A | Yes | Backend persistence is best when Supabase is configured |
| Gallery/history | Yes | N/A | Optional | Local-first, enriched by backend judgements when available |
| Multiplayer rooms | No | Optional | Yes | Requires Supabase for realtime room play |
| Multiplayer manual/friend scoring | No | N/A | Yes | Secure room voting, vote recovery, and shared results depend on the latest Supabase RPC schema |

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables if you want live services:
   - Copy `.env.example` to `.env`
   - Add `VITE_GEMINI_API_KEY` for live AI scoring and generated fusion images
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for realtime multiplayer and backend persistence
   - If you plan to use Supabase in production, apply `supabase/schema.sql` so secure RPCs and authoritative multiplayer voting are available

3. Start development:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm run test
   ```

5. Build production assets:
   ```bash
   npm run build
   ```

## Deployment

The repo already includes a GitHub Pages workflow at `.github/workflows/deploy.yml`.

### GitHub Pages

- Push to `main` to trigger the Pages workflow
- Make sure GitHub Pages is enabled with source set to `GitHub Actions`
- For Pages builds, Vite uses `/giant-schrodinger/` as the base path automatically in CI

### Vercel

`vercel.json` is also present for Vercel deployment. Vercel is useful if you want cleaner SPA routing and a simpler hosted preview flow.

More detail: [DEPLOYMENT.md](DEPLOYMENT.md)

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Live AI judging and generated fusion images | Optional |
| `VITE_SUPABASE_URL` | Realtime multiplayer and backend persistence | Optional |
| `VITE_SUPABASE_ANON_KEY` | Realtime multiplayer and backend persistence | Optional |

## Validation Commands

```bash
npm run lint
npm run test
npm run test:e2e:desktop
npm run build
npm run preview
```

For release readiness, use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).
For a launch rehearsal, use [PRODUCTION_REHEARSAL.md](PRODUCTION_REHEARSAL.md).

## Project Structure

```text
src/
  components/   reusable UI
  context/      React providers and app state
  data/         themes and prompt assets
  features/     lobby, round, reveal, gallery, judge, room, summary
  hooks/        shared hooks
  lib/          utilities
  services/     storage, sharing, AI, multiplayer, backend access
```

## Product Planning

- Product roadmap and current-state review: [PRD.md](PRD.md)
- Deployment and release guidance: [DEPLOYMENT.md](DEPLOYMENT.md)
- Manual QA support: [TEST_REVIEW_CHECKLIST.md](TEST_REVIEW_CHECKLIST.md), [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)

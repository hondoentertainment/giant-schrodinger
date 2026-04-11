# Supabase Edge Functions

Deno-based serverless functions that power server-side scoring, social
share previews, and the Discord bot for Venn with Friends.

## Functions

### `score-submission`
Scores a player's submission against two concepts using Gemini. This
lives server-side to (a) keep the Gemini API key off the client and
(b) prevent trivial score tampering via DevTools.

- **Method:** `POST /functions/v1/score-submission`
- **Body:** `{ conceptLeft, conceptRight, submission, difficulty? }`
- **Returns:** `{ score, breakdown, baseScore, relevance, commentary, roundId }`
- **Secrets:** `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`)
- **Rate limits (in-memory, per-instance):**
  - 30 requests / IP / minute
  - 12 requests / user / hour
- **Input caps:** submission <= 500 chars, concept <= 200 chars

### `og-tags`
Serves dynamic Open Graph HTML for crawlers (Twitter/Discord/Slack/
Facebook). Real users get a meta-refresh redirect to the SPA.

- **Method:** `GET /functions/v1/og-tags?roundId=<uuid>`
- **Method:** `GET /functions/v1/og-tags?challengeId=<uuid>`
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, optional `APP_URL`, optional
  `DEFAULT_OG_IMAGE`
- **Cache:** 5 minute CDN cache, 1h stale-while-revalidate

### `discord-bot`
Webhook handler for the Discord slash-command bot. See `DISCORD_BOT.md`
at the repo root for setup.

## Deploying

Install the Supabase CLI, then from the repo root:

```sh
supabase functions deploy score-submission
supabase functions deploy og-tags
supabase functions deploy discord-bot
```

Set secrets once:

```sh
supabase secrets set GEMINI_API_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set APP_URL=https://your-app.example.com
```

Local dev: `supabase functions serve score-submission --env-file .env`

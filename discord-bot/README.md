# Discord Bot (standalone package)

Optional Discord integration for Venn with Friends. Prefer the **Supabase Edge Function** path documented in [../DISCORD_BOT.md](../DISCORD_BOT.md) for production.

This folder is a Node package with slash-command handlers used for local experimentation or a self-hosted bot process.

## Contents

| Path | Role |
|---|---|
| `index.js` | Bot entry |
| `commands/venn.js` | Start a challenge |
| `commands/challenge.js` | Challenge flow helpers |
| `commands/leaderboard.js` | Leaderboard command |
| `utils/concepts.js` | Prompt concepts |
| `utils/scoring.js` | Scoring helpers |

## Quick local run

```bash
cd discord-bot
npm install
# set DISCORD_BOT_TOKEN (and related env) in your environment
node index.js
```

## Production path

Deploy `supabase/functions/discord-bot` and register slash commands as described in [../DISCORD_BOT.md](../DISCORD_BOT.md). Keep Discord tokens in Supabase secrets — never in client `VITE_*` vars.

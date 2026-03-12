# Venn with Friends Discord Bot

Play Venn with Friends directly in Discord channels.

## Commands

- `/venn challenge @user` — Challenge a friend to a connection round
- `/venn daily` — Play today's daily challenge
- `/venn leaderboard` — Show server leaderboard
- `/venn profile` — Show your stats

## Setup

1. Create a Discord application at https://discord.com/developers
2. Copy the bot token and application ID
3. Set environment variables:

```bash
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
VENN_API_URL=https://your-api.com  # Optional: for syncing with main app
```

4. Install and run:

```bash
cd discord-bot
npm install
node bot.js
```

## Architecture

The bot uses Discord Interactions API (slash commands) and runs as a standalone
Node.js process. It shares scoring logic with the main app but doesn't require
the web frontend.

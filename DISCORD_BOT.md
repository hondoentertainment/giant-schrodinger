# Discord Bot Setup for Venn with Friends

## Overview

The Venn with Friends Discord bot lets users start challenges directly from Discord servers. It runs as a Supabase Edge Function that handles Discord interactions.

## Prerequisites

- A Discord account with access to the [Discord Developer Portal](https://discord.com/developers/applications)
- A Supabase project with Edge Functions enabled
- Supabase CLI installed (`npm i -g supabase`)

## Setup Steps

### 1. Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application** and name it "Venn with Friends"
3. Navigate to the **Bot** tab and click **Add Bot**
4. Copy the **Bot Token** -- you will need this later
5. Under **Privileged Gateway Intents**, enable **Message Content Intent** if needed

### 2. Register the Slash Command

Use the Discord API to register the `/venn` command:

```bash
curl -X POST \
  "https://discord.com/api/v10/applications/YOUR_APP_ID/commands" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "venn",
    "description": "Start a Venn with Friends challenge!",
    "type": 1
  }'
```

Replace `YOUR_APP_ID` and `YOUR_BOT_TOKEN` with your actual values.

### 3. Deploy the Supabase Edge Function

```bash
supabase functions deploy discord-bot --no-verify-jwt
```

### 4. Configure the Interactions Endpoint

1. In the Discord Developer Portal, go to your application's **General Information** tab
2. Set the **Interactions Endpoint URL** to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/discord-bot
   ```
3. Discord will send a PING to verify the endpoint -- the function handles this automatically

### 5. Invite the Bot to a Server

Generate an OAuth2 URL:

1. Go to **OAuth2 > URL Generator**
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Embed Links`
4. Use the generated URL to invite the bot to your server

## Environment Variables

Set the following secrets in your Supabase project if you need to verify Discord request signatures:

```bash
supabase secrets set DISCORD_PUBLIC_KEY=your_discord_public_key
```

## Testing

1. Deploy the function locally: `supabase functions serve discord-bot`
2. Use a tool like ngrok to expose the local endpoint
3. Set the ngrok URL as the Interactions Endpoint in Discord Developer Portal
4. Run `/venn` in a Discord server where the bot is present

## Future Enhancements

- Daily challenge notifications via scheduled messages
- Leaderboard display with `/venn leaderboard`
- Challenge a friend with `/venn challenge @user`
- Score submission and tracking from Discord

/* global process */
import { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } from 'discord.js';
import * as venn from './commands/venn.js';
import * as challenge from './commands/challenge.js';
import * as leaderboard from './commands/leaderboard.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// ─── Client setup ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── Command registry ───────────────────────────────────────────────────────

const commands = new Collection();
commands.set(venn.data.name, venn);
commands.set(challenge.data.name, challenge);
commands.set(leaderboard.data.name, leaderboard);

// ─── Slash command registration ─────────────────────────────────────────────

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commandData = [venn.data.toJSON(), challenge.data.toJSON(), leaderboard.data.toJSON()];

  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandData });
    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
}

// ─── Interaction handler ────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    const reply = {
      content: 'Something went wrong executing that command!',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// ─── Message handler for !answer submissions ───────────────────────────────

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('!answer ')) return;

  const answerText = message.content.slice('!answer '.length).trim();
  if (!answerText) {
    await message.reply('You need to provide an answer! Usage: `!answer Your connection here`');
    return;
  }

  const channelId = message.channelId;
  const userId = message.author.id;
  const username = message.author.username;

  // Try submitting to an active /venn game first
  let submitted = false;
  if (venn.isGameActive(channelId)) {
    submitted = venn.submitAnswer(channelId, userId, username, answerText);
  }

  // Try submitting to an active /venn-challenge
  if (!submitted && challenge.isChallengeActive(channelId)) {
    submitted = challenge.submitChallengeAnswer(channelId, userId, username, answerText);
  }

  if (submitted) {
    await message.react('✅');
  } else {
    await message.reply({
      content: 'No active round in this channel. Start one with `/venn` or `/venn-challenge`!',
    });
  }
});

// ─── Ready event ────────────────────────────────────────────────────────────

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Serving ${client.guilds.cache.size} guild(s).`);
});

// ─── Startup ────────────────────────────────────────────────────────────────

if (!TOKEN) {
  const _startupEmbed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle('Venn with Friends — Discord Bot')
    .setDescription('Bot is not configured yet.');

  console.log('');
  console.log('================================================');
  console.log('  Venn with Friends — Discord Bot');
  console.log('================================================');
  console.log('');
  console.log('  No DISCORD_TOKEN environment variable found.');
  console.log('');
  console.log('  To run the bot:');
  console.log('    1. Create an application at https://discord.com/developers/applications');
  console.log('    2. Copy the bot token and application ID');
  console.log('    3. Run the bot with:');
  console.log('');
  console.log('       DISCORD_TOKEN=your-token DISCORD_CLIENT_ID=your-app-id node index.js');
  console.log('');
  console.log('  Required bot permissions:');
  console.log('    - Send Messages');
  console.log('    - Use Slash Commands');
  console.log('    - Add Reactions');
  console.log('    - Read Message History');
  console.log('');
  console.log('  Required intents:');
  console.log('    - Message Content Intent (privileged)');
  console.log('================================================');
  console.log('');
  process.exit(0);
} else {
  await registerCommands();
  client.login(TOKEN);
}

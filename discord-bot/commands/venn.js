import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRandomPairing, getDailyPairing } from '../utils/concepts.js';
import { scoreConnection } from '../utils/scoring.js';

// channelId -> { pairing, submissions: Map<userId, { text, username }>, timer, mode }
const activeGames = new Map();

export const data = new SlashCommandBuilder()
  .setName('venn')
  .setDescription('Start a Venn with Friends round! Find the overlap between two concepts.')
  .addStringOption(option =>
    option
      .setName('mode')
      .setDescription('Game mode')
      .setRequired(false)
      .addChoices(
        { name: 'quick', value: 'quick' },
        { name: 'daily', value: 'daily' },
      ),
  );

export function isGameActive(channelId) {
  return activeGames.has(channelId);
}

export function submitAnswer(channelId, userId, username, text) {
  const game = activeGames.get(channelId);
  if (!game) return false;
  game.submissions.set(userId, { text, username });
  return true;
}

export async function execute(interaction) {
  const channelId = interaction.channelId;

  if (activeGames.has(channelId)) {
    await interaction.reply({
      content: 'A round is already in progress in this channel! Submit your answer with `!answer Your connection here`.',
      ephemeral: true,
    });
    return;
  }

  const mode = interaction.options.getString('mode') || 'quick';
  const pairing = mode === 'daily' ? getDailyPairing() : getRandomPairing();

  const game = {
    pairing,
    submissions: new Map(),
    timer: null,
    mode,
  };
  activeGames.set(channelId, game);

  const startEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Venn with Friends')
    .setDescription(
      mode === 'daily'
        ? 'Today\'s Daily Venn Challenge!'
        : 'A new quick round has started!',
    )
    .addFields(
      { name: 'Left Circle', value: `**${pairing.left}**`, inline: true },
      { name: '\u2229', value: '???', inline: true },
      { name: 'Right Circle', value: `**${pairing.right}**`, inline: true },
    )
    .addFields({
      name: 'How to play',
      value: 'Type `!answer` followed by your connection.\nExample: `!answer Both involve controlled chaos`',
    })
    .setFooter({ text: 'You have 60 seconds!' })
    .setTimestamp();

  await interaction.reply({ embeds: [startEmbed] });

  // Auto-end after 60 seconds
  game.timer = setTimeout(() => {
    endRound(interaction.channel, channelId);
  }, 60_000);
}

async function endRound(channel, channelId) {
  const game = activeGames.get(channelId);
  if (!game) return;

  clearTimeout(game.timer);
  activeGames.delete(channelId);

  const { pairing, submissions } = game;

  if (submissions.size === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Round Over — No Submissions!')
      .setDescription(`Nobody found the overlap between **${pairing.left}** and **${pairing.right}**. Better luck next time!`);

    await channel.send({ embeds: [emptyEmbed] });
    return;
  }

  // Score all submissions
  const results = [];
  for (const [userId, { text, username }] of submissions) {
    const result = scoreConnection(text, pairing.left, pairing.right);
    results.push({ userId, username, text, ...result });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const medals = ['🥇', '🥈', '🥉'];
  const resultLines = results.map((r, i) => {
    const medal = medals[i] || `**#${i + 1}**`;
    return `${medal} **${r.username}** — ${r.score}/100\n> "${r.text}"\n> _${r.commentary}_`;
  });

  const resultsEmbed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('Round Results!')
    .setDescription(
      `**${pairing.left}** \u2229 **${pairing.right}**\n\n${resultLines.join('\n\n')}`,
    )
    .addFields({
      name: 'Winner Breakdown',
      value: results.length > 0
        ? `Wit: ${results[0].breakdown.wit} | Logic: ${results[0].breakdown.logic} | Originality: ${results[0].breakdown.originality} | Clarity: ${results[0].breakdown.clarity}`
        : 'N/A',
    })
    .setFooter({ text: `${submissions.size} player(s) competed` })
    .setTimestamp();

  await channel.send({ embeds: [resultsEmbed] });

  // Return results for leaderboard tracking
  return results;
}

export { endRound, activeGames };

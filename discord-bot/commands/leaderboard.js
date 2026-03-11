import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// guildId -> Map<userId, { username, totalScore, gamesPlayed }>
const leaderboards = new Map();

export const data = new SlashCommandBuilder()
  .setName('venn-leaderboard')
  .setDescription('View the top Venn with Friends players in this server!');

/**
 * Record results from a completed round into the leaderboard.
 */
export function recordResults(guildId, results) {
  if (!guildId || !results || results.length === 0) return;

  if (!leaderboards.has(guildId)) {
    leaderboards.set(guildId, new Map());
  }

  const guild = leaderboards.get(guildId);

  for (const r of results) {
    if (!guild.has(r.userId)) {
      guild.set(r.userId, { username: r.username, totalScore: 0, gamesPlayed: 0 });
    }
    const entry = guild.get(r.userId);
    entry.username = r.username; // keep username up to date
    entry.totalScore += r.score;
    entry.gamesPlayed += 1;
  }
}

export async function execute(interaction) {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: 'Leaderboards are only available in servers!',
      ephemeral: true,
    });
    return;
  }

  const guild = leaderboards.get(guildId);

  if (!guild || guild.size === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Venn Leaderboard')
      .setDescription('No games have been played in this server yet! Start one with `/venn`.');

    await interaction.reply({ embeds: [emptyEmbed] });
    return;
  }

  // Sort by average score descending
  const entries = [...guild.values()]
    .map(e => ({
      ...e,
      avgScore: Math.round((e.totalScore / e.gamesPlayed) * 10) / 10,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  const medals = ['🥇', '🥈', '🥉'];
  const lines = entries.map((e, i) => {
    const rank = medals[i] || `**#${i + 1}**`;
    return `${rank} **${e.username}** — Avg: ${e.avgScore}/100 (${e.gamesPlayed} game${e.gamesPlayed === 1 ? '' : 's'})`;
  });

  const leaderboardEmbed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle('Venn Leaderboard')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Top ${entries.length} players by average score` })
    .setTimestamp();

  await interaction.reply({ embeds: [leaderboardEmbed] });
}

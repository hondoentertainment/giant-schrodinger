import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRandomPairing } from '../utils/concepts.js';
import { scoreConnection } from '../utils/scoring.js';

// channelId -> { pairing, challenger, opponent, submissions: Map<userId, { text, username }>, timer }
const activeChallenges = new Map();

export const data = new SlashCommandBuilder()
  .setName('venn-challenge')
  .setDescription('Challenge another player to a 1v1 Venn duel!')
  .addUserOption(option =>
    option
      .setName('opponent')
      .setDescription('The user to challenge')
      .setRequired(true),
  );

export function isChallengeActive(channelId) {
  return activeChallenges.has(channelId);
}

export function submitChallengeAnswer(channelId, userId, username, text) {
  const challenge = activeChallenges.get(channelId);
  if (!challenge) return false;

  // Only the challenger and opponent can submit
  if (userId !== challenge.challenger.id && userId !== challenge.opponent.id) {
    return false;
  }

  challenge.submissions.set(userId, { text, username });

  // Auto-resolve if both have submitted
  if (challenge.submissions.size >= 2) {
    resolveChallenge(challenge.channel, channelId);
  }

  return true;
}

export async function execute(interaction) {
  const channelId = interaction.channelId;

  if (activeChallenges.has(channelId)) {
    await interaction.reply({
      content: 'A challenge is already in progress in this channel!',
      ephemeral: true,
    });
    return;
  }

  const opponent = interaction.options.getUser('opponent');

  if (opponent.id === interaction.user.id) {
    await interaction.reply({
      content: 'You cannot challenge yourself! Find a worthy opponent.',
      ephemeral: true,
    });
    return;
  }

  if (opponent.bot) {
    await interaction.reply({
      content: 'You cannot challenge a bot! They have an unfair advantage... or disadvantage.',
      ephemeral: true,
    });
    return;
  }

  const pairing = getRandomPairing();

  const challenge = {
    pairing,
    challenger: { id: interaction.user.id, username: interaction.user.username },
    opponent: { id: opponent.id, username: opponent.username },
    submissions: new Map(),
    timer: null,
    channel: interaction.channel,
  };
  activeChallenges.set(channelId, challenge);

  const challengeEmbed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle('Venn Duel!')
    .setDescription(
      `**${interaction.user.username}** has challenged **${opponent.username}** to a Venn duel!`,
    )
    .addFields(
      { name: 'Left Circle', value: `**${pairing.left}**`, inline: true },
      { name: '\u2229', value: '???', inline: true },
      { name: 'Right Circle', value: `**${pairing.right}**`, inline: true },
    )
    .addFields({
      name: 'How to play',
      value: `Both players: type \`!answer\` followed by your connection.\nThe duel auto-resolves when both submit, or after 90 seconds.`,
    })
    .setFooter({ text: '90 seconds on the clock!' })
    .setTimestamp();

  await interaction.reply({ embeds: [challengeEmbed] });

  // Auto-resolve after 90 seconds
  challenge.timer = setTimeout(() => {
    resolveChallenge(interaction.channel, channelId);
  }, 90_000);
}

async function resolveChallenge(channel, channelId) {
  const challenge = activeChallenges.get(channelId);
  if (!challenge) return;

  clearTimeout(challenge.timer);
  activeChallenges.delete(channelId);

  const { pairing, challenger, opponent, submissions } = challenge;

  if (submissions.size === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Duel Expired!')
      .setDescription('Neither player submitted an answer. The duel fizzles out...');

    await channel.send({ embeds: [emptyEmbed] });
    return;
  }

  const results = [];
  for (const [userId, { text, username }] of submissions) {
    const result = scoreConnection(text, pairing.left, pairing.right);
    results.push({ userId, username, text, ...result });
  }

  results.sort((a, b) => b.score - a.score);

  // Determine outcome
  let outcomeText;
  if (submissions.size === 1) {
    const submitter = results[0];
    const noShow = submitter.userId === challenger.id ? opponent.username : challenger.username;
    outcomeText = `**${submitter.username}** wins by default! ${noShow} never submitted.`;
  } else if (results[0].score === results[1].score) {
    outcomeText = 'It\'s a tie! Both minds are equally connected.';
  } else {
    outcomeText = `**${results[0].username}** wins the duel!`;
  }

  const playerLines = results.map((r, i) => {
    const icon = i === 0 ? '👑' : '💀';
    return [
      `${icon} **${r.username}** — ${r.score}/100`,
      `> "${r.text}"`,
      `> Wit: ${r.breakdown.wit} | Logic: ${r.breakdown.logic} | Originality: ${r.breakdown.originality} | Clarity: ${r.breakdown.clarity}`,
      `> _${r.commentary}_`,
    ].join('\n');
  });

  const resultEmbed = new EmbedBuilder()
    .setColor(0xEB459E)
    .setTitle('Duel Results!')
    .setDescription(
      `**${pairing.left}** \u2229 **${pairing.right}**\n\n${outcomeText}\n\n${playerLines.join('\n\n')}`,
    )
    .setFooter({ text: 'Venn with Friends — 1v1 Duel' })
    .setTimestamp();

  await channel.send({ embeds: [resultEmbed] });

  return results;
}

export { activeChallenges };

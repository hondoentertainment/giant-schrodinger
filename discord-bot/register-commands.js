/**
 * Register Discord slash commands for the Venn with Friends bot.
 * Run once: node register-commands.js
 *
 * Requires: DISCORD_TOKEN and DISCORD_CLIENT_ID environment variables.
 */

const commands = [
    {
        name: 'venn',
        description: 'Play Venn with Friends!',
        options: [
            {
                name: 'challenge',
                description: 'Challenge a friend to a connection round',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'opponent',
                        description: 'The user to challenge',
                        type: 6, // USER
                        required: true,
                    },
                ],
            },
            {
                name: 'daily',
                description: "Play today's daily challenge",
                type: 1,
            },
            {
                name: 'leaderboard',
                description: 'Show the server leaderboard',
                type: 1,
            },
            {
                name: 'profile',
                description: 'Show your stats and achievements',
                type: 1,
            },
        ],
    },
];

async function registerCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
        console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID environment variables.');
        console.error('Set them before running this script.');
        process.exit(1);
    }

    const url = `https://discord.com/api/v10/applications/${clientId}/commands`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${token}`,
        },
        body: JSON.stringify(commands),
    });

    if (response.ok) {
        console.log('Commands registered successfully!');
        const data = await response.json();
        console.log(`Registered ${data.length} command(s).`);
    } else {
        const error = await response.text();
        console.error('Failed to register commands:', response.status, error);
    }
}

registerCommands();

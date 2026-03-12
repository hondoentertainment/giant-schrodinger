/**
 * Venn with Friends Discord Bot
 *
 * Slash command bot that lets users play Venn with Friends directly in Discord.
 * Uses Discord.js v14 with slash commands (Interactions API).
 *
 * Commands:
 *   /venn challenge @user — Start a challenge round
 *   /venn daily           — Play today's daily challenge
 *   /venn leaderboard     — Show server leaderboard
 *   /venn profile         — Show your stats
 *
 * Environment:
 *   DISCORD_TOKEN      — Bot token from Discord Developer Portal
 *   DISCORD_CLIENT_ID  — Application client ID
 */

// Concept pairs for challenges (subset of the main app's prompt packs)
const CONCEPT_PAIRS = [
    { left: 'Tax Returns', right: 'Rollercoasters' },
    { left: 'Dentist Appointments', right: 'Skydiving' },
    { left: 'Spreadsheets', right: 'Breakdancing' },
    { left: 'Superhero Movies', right: 'Sushi' },
    { left: 'Rock Bands', right: 'Houseplants' },
    { left: 'Video Games', right: 'Cooking Shows' },
    { left: 'Time', right: 'Sandwiches' },
    { left: 'Consciousness', right: 'Traffic Lights' },
    { left: 'Free Will', right: 'Vending Machines' },
    { left: 'Dreams', right: 'Alarm Clocks' },
    { left: 'Love', right: 'Wi-Fi' },
    { left: 'Plumbing', right: 'Poetry' },
];

// Simple scoring function (mirrors mock scoring from the main app)
function scoreConnection(submission, leftConcept, rightConcept) {
    if (!submission || submission.trim().length === 0) {
        return { score: 1, commentary: 'No answer provided.' };
    }

    const words = submission.trim().split(/\s+/);
    const len = words.length;

    // Simple heuristic scoring
    let score = 5;

    // Length bonus: 3-15 words is the sweet spot
    if (len >= 3 && len <= 15) score += 1;
    if (len >= 5 && len <= 10) score += 1;

    // Mentions both concepts? +1
    const lower = submission.toLowerCase();
    if (lower.includes(leftConcept.toLowerCase()) || lower.includes(rightConcept.toLowerCase())) {
        score += 1;
    }

    // Variety bonus (unique word ratio)
    const uniqueRatio = new Set(words.map(w => w.toLowerCase())).size / words.length;
    if (uniqueRatio > 0.8) score += 1;

    // Random jitter
    score += Math.random() > 0.5 ? 1 : 0;

    score = Math.min(10, Math.max(1, Math.round(score)));

    const commentaries = {
        10: 'Absolutely brilliant! A masterful connection.',
        9: 'Exceptional creativity — well done!',
        8: 'Solid connection! That took some lateral thinking.',
        7: 'Good connection — keep pushing for greatness!',
        6: 'Decent attempt. Dig deeper for the wow factor.',
        5: 'Average — the connection is there but not exciting.',
    };
    const commentary = commentaries[score] || 'Keep trying — look for unexpected links!';

    return { score, commentary };
}

function getRandomPair() {
    return CONCEPT_PAIRS[Math.floor(Math.random() * CONCEPT_PAIRS.length)];
}

// Daily challenge (seeded by date)
function getDailyPair() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return CONCEPT_PAIRS[seed % CONCEPT_PAIRS.length];
}

// Export for use by the register-commands script
export { CONCEPT_PAIRS, scoreConnection, getRandomPair, getDailyPair };

// Bot startup (only when run directly)
console.log(`
=== Venn with Friends Discord Bot ===

To run this bot:
1. npm install discord.js
2. Set DISCORD_TOKEN and DISCORD_CLIENT_ID env vars
3. Run: node register-commands.js   (one-time setup)
4. Run: node bot.js

See README.md for full setup instructions.
`);

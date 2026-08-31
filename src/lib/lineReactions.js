const REACTION_EMOJIS = ['🔥', '😂', '💀', '👑'];

export function getEntryReactionKey(entry) {
    return String(entry?.id || entry?.player_name || '').trim();
}

export function reactionsForEntry(reactions = [], entry) {
    const key = getEntryReactionKey(entry);
    if (!key) return [];
    return reactions.filter((reaction) => String(reaction.entryId || '') === key);
}

export function countReactions(reactions = []) {
    const counts = Object.fromEntries(REACTION_EMOJIS.map((emoji) => [emoji, 0]));
    reactions.forEach((reaction) => {
        if (counts[reaction.emoji] != null) counts[reaction.emoji] += 1;
    });
    return counts;
}

export function getReactionTotal(reactions = []) {
    return reactions.length;
}

export function getMostReactedEntry(submissions = [], reactions = []) {
    let best = null;
    let bestCount = 0;
    submissions.forEach((entry) => {
        const count = reactionsForEntry(reactions, entry).length;
        if (count > bestCount) {
            best = entry;
            bestCount = count;
        }
    });
    return bestCount > 0 ? { entry: best, count: bestCount } : null;
}

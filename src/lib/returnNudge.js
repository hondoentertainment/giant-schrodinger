function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

/**
 * Honest return copy for people who already have a profile.
 * Same-day players are not nudged again.
 */
export function getReturnNudge({ name, lastPlayedDate, totalRounds, today = new Date() } = {}) {
    if (!name || !lastPlayedDate || !totalRounds) return null;
    const lastPlayed = new Date(`${lastPlayedDate}T00:00:00`);
    if (Number.isNaN(lastPlayed.getTime())) return null;
    const daysAway = Math.round((startOfDay(today) - startOfDay(lastPlayed)) / (24 * 60 * 60 * 1000));
    if (daysAway <= 0) return null;
    if (daysAway === 1) {
        return {
            id: 'day-2',
            message: `Day 2, ${name}. Yesterday counted. Play today's pair and the streak is real.`,
        };
    }
    return {
        id: 'return',
        message: `Welcome back, ${name}. Today's pair is here when you want it.`,
    };
}

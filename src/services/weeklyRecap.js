import { getCollisions } from './storage';
import { getStats } from './stats';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function buildWeeklyRecapShareText(recap) {
    const rounds = `${recap.roundsPlayed} connection${recap.roundsPlayed === 1 ? '' : 's'}`;
    const parts = [`My week in Venns: ${rounds}`];
    if (recap.averageScore > 0) {
        parts.push(`averaging ${recap.averageScore.toFixed(1)}/10`);
    }
    if (recap.best?.submission) {
        parts.push(`best link "${recap.best.submission}" (${recap.best.score}/10)`);
    }
    if (recap.streak > 1) {
        parts.push(`${recap.streak}-day streak`);
    }
    const origin = typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}`
        : '';
    return `${parts.join(' · ')}. Play Venn with Friends: ${origin}`.trim();
}

/**
 * Aggregates the last 7 days of saved collisions into a shareable recap.
 * Returns null when there is nothing to recap.
 */
export function getWeeklyRecap({ collisions = getCollisions(), stats = getStats(), now = new Date() } = {}) {
    const cutoff = now.getTime() - WEEK_MS;
    const recent = collisions.filter((collision) => {
        // Stored collisions use ISO strings; older/local data may use epoch numbers.
        const time = typeof collision.timestamp === 'number'
            ? collision.timestamp
            : Date.parse(collision.timestamp);
        return Number.isFinite(time) && time >= cutoff;
    });
    if (recent.length === 0) return null;

    const scored = recent.filter((collision) => (collision.score || 0) > 0);
    const best = scored.reduce(
        (top, collision) => (!top || (collision.score || 0) > (top.score || 0) ? collision : top),
        null,
    );
    const averageScore = scored.length
        ? scored.reduce((sum, collision) => sum + (collision.score || 0), 0) / scored.length
        : 0;

    const recap = {
        roundsPlayed: recent.length,
        best,
        averageScore,
        dailyCount: recent.filter((collision) => collision.isDailyChallenge).length,
        highlightCount: recent.filter((collision) => (collision.score || 0) >= 8).length,
        streak: stats?.currentStreak || 0,
    };
    recap.shareText = buildWeeklyRecapShareText(recap);
    return recap;
}

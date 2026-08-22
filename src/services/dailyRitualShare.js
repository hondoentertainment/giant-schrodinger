import { getCollisions } from './storage';
import { getDailyChallenge, getDailyChallengeSummary } from './dailyChallenge';

export function buildDailyRitualShareText({
    date,
    left,
    right,
    submission,
    score,
    origin = '',
} = {}) {
    const day = date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lines = [`Venn Daily — ${day}`];
    if (left && right) lines.push(`${left} × ${right}`);
    if (submission) lines.push(`“${submission}”`);
    if (Number.isFinite(score)) lines.push(`${score}/10`);
    if (origin) lines.push(`Play today’s pair: ${origin}`);
    return lines.join('\n');
}

export function getDailyRitualShare({ collisions = getCollisions(), origin } = {}) {
    const daily = getDailyChallenge();
    const summary = getDailyChallengeSummary();
    const today = daily.date;
    const latest = collisions.find((collision) => (
        collision.isDailyChallenge && String(collision.timestamp || '').startsWith(today)
    )) || collisions.find((collision) => collision.isDailyChallenge);

    return buildDailyRitualShareText({
        date: new Date(`${today}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        left: latest?.assets?.left?.label || daily.pair?.left,
        right: latest?.assets?.right?.label || daily.pair?.right,
        submission: latest?.submission,
        score: summary.latestScore,
        origin,
    });
}

import { getScoreBand } from '../lib/scoreBands';
import { getCollisions } from './storage';
import { formatDailySocialLabel, getDailyChallenge, getDailyChallengeSummary } from './dailyChallenge';

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

function findLatestDailyCollision(collisions, today) {
    return collisions.find((collision) => (
        collision.isDailyChallenge && String(collision.timestamp || '').startsWith(today)
    )) || collisions.find((collision) => collision.isDailyChallenge);
}

export function getDailyRitualShareCard({ collisions = getCollisions(), origin } = {}) {
    const daily = getDailyChallenge();
    const summary = getDailyChallengeSummary();
    const today = daily.date;
    const latest = findLatestDailyCollision(collisions, today);
    const left = latest?.assets?.left?.label || daily.pair?.left;
    const right = latest?.assets?.right?.label || daily.pair?.right;
    const score = Number.isFinite(summary.latestScore) ? summary.latestScore : latest?.score;
    const text = buildDailyRitualShareText({
        date: new Date(`${today}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        left,
        right,
        submission: latest?.submission,
        score,
        origin,
    });

    return {
        text,
        imageUrl: latest?.imageUrl || latest?.fallbackImageUrl || null,
        shareData: {
            submission: latest?.submission || daily.prompt || 'Daily Venn',
            score: Number.isFinite(score) ? score : 0,
            scoreBand: Number.isFinite(score) ? getScoreBand(score)?.label : 'Daily Challenge',
            assets: latest?.assets || {
                left: { label: left || 'Left' },
                right: { label: right || 'Right' },
            },
            isDailyChallenge: true,
            judgeMode: latest?.judgeMode,
            url: origin,
            dateStamp: new Date(`${today}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            vibe: daily.pair?.vibe,
            weekTitle: daily.weekTitle,
            mediaLabel: daily.weekTitle,
            promptPair: formatDailySocialLabel(new Date(`${today}T12:00:00`), daily.pair?.vibe),
        },
    };
}

export function getDailyRitualShare(options) {
    return getDailyRitualShareCard(options).text;
}

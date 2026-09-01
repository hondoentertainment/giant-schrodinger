import { CANONICAL_ORIGIN, getOgImageUrl } from './siteIdentity';

export function buildOgRoundTitle({ submission, score, left, right } = {}) {
    const line = String(submission || 'a clever connection').trim();
    if (left && right && score != null && score !== '') {
        return `I scored ${score}/10 connecting ${left} and ${right}!`;
    }
    if (left && right) {
        return `"${line}" — the link between ${left} and ${right}`;
    }
    return `"${line}" — can you beat my Venn score?`;
}

export function buildOgRoundDescription({ submission, score, left, right, judge } = {}) {
    const line = String(submission || '').trim();
    const parts = [];
    if (line) parts.push(`Connection: "${line}"`);
    if (left && right) parts.push(`Prompts: ${left} × ${right}`);
    if (score != null && score !== '') parts.push(`Score: ${score}/10`);
    if (judge) parts.push(`Judged via ${String(judge)}`);
    parts.push('Beat this.');
    return parts.join(' · ');
}

export function getDefaultOgImage() {
    return getOgImageUrl(CANONICAL_ORIGIN);
}

import { hostCommentary, hostRewrite } from './hostVoice';

export function rewriteTheirLine(submission, axis, leftLabel, rightLabel) {
    return hostRewrite(submission, leftLabel, rightLabel, axis);
}

function lowestAxis(breakdown) {
    if (!breakdown) return null;
    const axes = ['wit', 'logic', 'originality', 'clarity'];
    let lowest = null;
    for (const axis of axes) {
        const value = Number(breakdown[axis]);
        if (!Number.isFinite(value)) continue;
        if (!lowest || value < lowest.value) lowest = { axis, value };
    }
    return lowest;
}

/**
 * One-line reason + rewrite hint for a scored connection.
 */
export function getScoreCoach({ score, breakdown, isMock, submission, leftLabel, rightLabel, rewrite } = {}) {
    const numeric = Number(score);
    const axis = lowestAxis(breakdown);
    const reason = hostCommentary({
        submission,
        leftLabel,
        rightLabel,
        score: numeric,
    });

    const hint = String(rewrite || '').trim()
        || rewriteTheirLine(submission, axis?.axis, leftLabel, rightLabel);

    return {
        reason,
        hint,
        practice: Boolean(isMock),
        weakAxis: axis?.axis || null,
    };
}

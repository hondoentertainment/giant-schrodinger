const AXIS_HINTS = {
    wit: 'Add a joke only these two concepts would get.',
    logic: 'Name both concepts in the phrase so the link is obvious.',
    originality: 'Skip the first idea everyone would write.',
    clarity: 'Say it in one clean sentence.',
};

export function rewriteTheirLine(submission, axis, leftLabel, rightLabel) {
    const line = String(submission || '').trim().replace(/^["“]|["”]$/g, '');
    const left = leftLabel || 'the left prompt';
    const right = rightLabel || 'the right prompt';
    if (!line) return AXIS_HINTS[axis] || AXIS_HINTS.logic;
    if (axis === 'wit') return `${line} — the joke only ${left} and ${right} would tell.`;
    if (axis === 'logic') return `${left} meets ${right}: ${line}.`;
    if (axis === 'originality') return `Not just “${line}.” What’s the second thought nobody else will write?`;
    if (axis === 'clarity') return `${line} — say it once, and name both sides.`;
    return `Keep “${line},” but name both ${left} and ${right}.`;
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
    let reason;
    if (!Number.isFinite(numeric)) {
        reason = 'Score this like a friend would — clever, clear, and a little surprising.';
    } else if (numeric >= 9) {
        reason = 'Both concepts are named and the line actually surprises.';
    } else if (numeric >= 7) {
        reason = 'The link is clear. A sharper twist would make it unforgettable.';
    } else if (numeric >= 4) {
        reason = axis
            ? `The idea is there, but ${axis.axis} is doing the least work.`
            : 'The idea is there, but the connection is still a little thin.';
    } else {
        reason = 'Too generic — it could describe almost anything.';
    }

    const hint = String(rewrite || '').trim()
        || rewriteTheirLine(submission, axis?.axis, leftLabel, rightLabel);

    return {
        reason,
        hint,
        practice: Boolean(isMock),
        weakAxis: axis?.axis || null,
    };
}

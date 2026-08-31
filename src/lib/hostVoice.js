export function hostCommentary({ submission, leftLabel, rightLabel, score } = {}) {
    const line = String(submission || 'that line').trim().replace(/^["“]|["”]$/g, '') || 'that line';
    const left = leftLabel || 'the left prompt';
    const right = rightLabel || 'the right prompt';
    const numeric = Number(score);

    if (Number.isFinite(numeric) && numeric >= 9) {
        return `${line}? That's a toast. ${left} and ${right} just became the same story.`;
    }
    if (Number.isFinite(numeric) && numeric >= 7) {
        return `${line} — the room heard it. Now make ${left} and ${right} collide harder.`;
    }
    if (Number.isFinite(numeric) && numeric >= 4) {
        return `${line} is the first thought. A host would dare you to name both ${left} and ${right}.`;
    }
    return `${line}? Too safe. ${left} and ${right} deserve a line that cannot sit on both sides by accident.`;
}

export function hostRewrite(submission, leftLabel, rightLabel, axis) {
    const line = String(submission || '').trim().replace(/^["“]|["”]$/g, '');
    const left = leftLabel || 'the left prompt';
    const right = rightLabel || 'the right prompt';
    if (!line) return `Name both ${left} and ${right} in one dare.`;
    if (axis === 'wit') return `${line} — the joke only ${left} and ${right} would tell.`;
    if (axis === 'logic') return `${left} meets ${right}: ${line}.`;
    if (axis === 'originality') return `Not just “${line}.” What’s the second thought nobody else will write?`;
    if (axis === 'clarity') return `${line} — say it once, and name both sides.`;
    return `Keep “${line},” but name both ${left} and ${right}.`;
}

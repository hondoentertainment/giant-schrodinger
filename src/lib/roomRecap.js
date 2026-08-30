export function buildRoomRecapShareData({
    room,
    submissions = [],
    assets,
    scoringMode,
} = {}) {
    const ranked = [...submissions].sort((left, right) => {
        const leftScore = Number(left.finalScore ?? left.score ?? left.voteCount ?? 0);
        const rightScore = Number(right.finalScore ?? right.score ?? right.voteCount ?? 0);
        return rightScore - leftScore;
    });
    const winner = ranked[0];
    const leftLabel = assets?.left?.label || assets?.left?.title || 'Left';
    const rightLabel = assets?.right?.label || assets?.right?.title || 'Right';
    const score = Number(winner?.finalScore ?? winner?.score ?? winner?.voteCount ?? 0);

    return {
        submission: winner?.submission || 'Room recap',
        score: Number.isFinite(score) ? score : 0,
        scoreBand: winner?.player_name ? `${winner.player_name} wins` : 'Room recap',
        assets: assets || {
            left: { label: leftLabel },
            right: { label: rightLabel },
        },
        judgeMode: (scoringMode || room?.scoring_mode) === 'human' ? 'human' : 'ai',
        promptPair: `${leftLabel} × ${rightLabel}`,
        mediaLabel: 'Room recap',
    };
}

export const JUDGE_MODES = {
    AI: 'ai',
    HUMAN: 'human',
    FRIEND: 'friend',
    ROOM_VOTE: 'room_vote',
};

const LABELS = {
    [JUDGE_MODES.AI]: 'AI Judge',
    [JUDGE_MODES.HUMAN]: 'Manual Judge',
    [JUDGE_MODES.FRIEND]: 'Friend Judge',
    [JUDGE_MODES.ROOM_VOTE]: 'Room Vote',
};

export function normalizeJudgeMode(mode, scoringMode) {
    if (mode === JUDGE_MODES.AI || mode === JUDGE_MODES.HUMAN || mode === JUDGE_MODES.FRIEND || mode === JUDGE_MODES.ROOM_VOTE) {
        return mode;
    }
    if (scoringMode === 'ai') return JUDGE_MODES.AI;
    if (scoringMode === 'human') return JUDGE_MODES.HUMAN;
    return JUDGE_MODES.HUMAN;
}

export function getJudgeModeLabel(mode, scoringMode) {
    const normalized = normalizeJudgeMode(mode, scoringMode);
    return LABELS[normalized] || LABELS[JUDGE_MODES.HUMAN];
}

export function getJudgeModeFromCollision(collision) {
    if (!collision) return LABELS[JUDGE_MODES.HUMAN];
    return getJudgeModeLabel(collision.judgeMode, collision.scoringMode);
}

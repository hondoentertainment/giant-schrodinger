import { JUDGE_MODES } from '../lib/judgeMode';

const STORAGE_KEY = 'vwf_judgements';

function readStore() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { byRoundId: {}, byCollisionId: {} };
        }

        const parsed = JSON.parse(stored);
        if (parsed?.byRoundId || parsed?.byCollisionId) {
            return {
                byRoundId: parsed.byRoundId || {},
                byCollisionId: parsed.byCollisionId || {},
            };
        }

        // Backward compatibility for the original flat roundId map.
        return { byRoundId: parsed || {}, byCollisionId: {} };
    } catch {
        return { byRoundId: {}, byCollisionId: {} };
    }
}

function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function buildRecord(identifiers, judgement) {
    return {
        ...judgement,
        roundId: identifiers.roundId || null,
        collisionId: identifiers.collisionId || null,
        backendId: identifiers.backendId || null,
        judgeMode: identifiers.judgeMode || JUDGE_MODES.FRIEND,
        timestamp: new Date().toISOString(),
    };
}

export function saveJudgement(roundIdOrOptions, maybeJudgement) {
    const options = typeof roundIdOrOptions === 'string'
        ? { roundId: roundIdOrOptions, judgement: maybeJudgement }
        : roundIdOrOptions;

    const { roundId, collisionId, backendId, judgeMode, judgement } = options || {};
    if (!judgement) return null;

    const store = readStore();
    const record = buildRecord({ roundId, collisionId, backendId, judgeMode }, judgement);

    if (roundId) {
        store.byRoundId[roundId] = record;
    }
    if (collisionId) {
        store.byCollisionId[collisionId] = record;
    }

    writeStore(store);
    return record;
}

export function getJudgement(roundId) {
    const store = readStore();
    return store.byRoundId[roundId] || null;
}

export function getJudgementForCollision(collisionId) {
    const store = readStore();
    return store.byCollisionId[collisionId] || null;
}

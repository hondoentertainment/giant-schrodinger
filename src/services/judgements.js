const STORAGE_KEY = 'vwf_judgements';

export function saveJudgement(roundId, judgement) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[roundId] = {
        ...judgement,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getJudgement(roundId) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    return all[roundId] || null;
}

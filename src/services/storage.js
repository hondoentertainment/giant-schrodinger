const STORAGE_KEY = 'vwf_collisions';
const HIGH_SCORES_KEY = 'vwf_high_scores';
const BEST_STREAK_KEY = 'vwf_best_streak';

export function saveCollision(collision) {
    const existing = getCollisions();
    const newCollision = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...collision
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newCollision, ...existing]));

    // Also save to high scores if it qualifies
    saveHighScore({
        score: collision.score,
        submission: collision.submission,
        timestamp: new Date().toISOString()
    });

    return newCollision;
}

export function getCollisions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getHighScores() {
    const stored = localStorage.getItem(HIGH_SCORES_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveHighScore(entry) {
    const scores = getHighScores();
    scores.push(entry);

    // Sort by score descending, keep top 5
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 5);

    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
    return topScores;
}

export function getBestStreak() {
    return parseInt(localStorage.getItem(BEST_STREAK_KEY) || '0', 10);
}

export function saveBestStreak(streak) {
    const current = getBestStreak();
    if (streak > current) {
        localStorage.setItem(BEST_STREAK_KEY, streak.toString());
        return true;
    }
    return false;
}

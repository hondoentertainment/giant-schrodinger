import { getCollisions } from './storage';

/**
 * Returns today's top-scoring collisions for display on the lobby.
 * @param {number} limit - Maximum entries to return (default 5)
 * @returns {Array<{submission: string, score: number, themeId: string, timestamp: number}>}
 */
export function getBestOfToday(limit = 5) {
    try {
        const collisions = getCollisions();
        const today = new Date().toISOString().split('T')[0];
        return collisions
            .filter(c => {
                const d = c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : null;
                return d === today && c.score != null;
            })
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, limit)
            .map(c => ({
                submission: c.submission,
                score: c.score,
                themeId: c.themeId,
                imageUrl: c.imageUrl,
                timestamp: c.timestamp,
            }));
    } catch {
        return [];
    }
}

export const BADGES = {
    FIRST_GAME: { id: 'FIRST_GAME', name: 'Novice Connector', emoji: '🌱', description: 'Play your first game.' },
    STREAK_3: { id: 'STREAK_3', name: 'Hot Streak', emoji: '🔥', description: 'Reach a streak of 3.' },
    STREAK_5: { id: 'STREAK_5', name: 'Master of Words', emoji: '👑', description: 'Reach a streak of 5.' },
    GAMES_10: { id: 'GAMES_10', name: 'Dedicated Regular', emoji: '🕹️', description: 'Play 10 games.' },
    PERFECT_SCORE: { id: 'PERFECT_SCORE', name: 'Perfect 10', emoji: '🎯', description: 'Score a perfect 10.' }
};

const ACHIEVEMENTS_KEY = 'vwf_achievements';

export function getUnlockedAchievements() {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Returns the newly unlocked badge ID, or null if nothing new
export function unlockAchievement(achievementId) {
    const unlocked = getUnlockedAchievements();
    if (!unlocked.includes(achievementId)) {
        unlocked.push(achievementId);
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
        return BADGES[achievementId];
    }
    return null;
}

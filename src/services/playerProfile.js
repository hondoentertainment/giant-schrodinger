import { loadJSON, saveJSON } from '../lib/storage';
import { getStats } from './stats';
import { getOwnedItems, getEquippedItems } from './shop';
import { getUnlockedAchievements, getAchievementPoints } from './achievements';

const STORAGE_KEY = 'vwf_player_profile';

/**
 * Builds a complete player profile for display/sharing.
 * @param {string} playerName
 * @returns {Object} Player profile data
 */
export function getPlayerProfile(playerName) {
    const stats = getStats();
    const owned = getOwnedItems();
    const equipped = getEquippedItems();
    let achievements = [];
    let achievementPoints = 0;
    try {
        achievements = getUnlockedAchievements();
        achievementPoints = getAchievementPoints();
    } catch {
        // achievements service may not export these
    }

    return {
        name: playerName,
        stats: {
            totalRounds: stats.totalRounds || 0,
            currentStreak: stats.currentStreak || 0,
            maxStreak: stats.maxStreak || 0,
            averageScore: stats.averageScore || 0,
        },
        cosmetics: {
            owned: owned.length,
            equipped,
        },
        achievements: {
            unlocked: achievements.length,
            points: achievementPoints,
            recent: achievements.slice(0, 5),
        },
        createdAt: loadJSON(STORAGE_KEY, { createdAt: new Date().toISOString() }).createdAt,
    };
}

/**
 * Generates a shareable profile URL with base64-encoded profile data.
 * @param {Object} profile
 * @returns {string}
 */
export function createProfileShareUrl(profile) {
    try {
        const payload = {
            name: profile.name,
            stats: profile.stats,
            achievements: { unlocked: profile.achievements.unlocked, points: profile.achievements.points },
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        return `${window.location.origin}${window.location.pathname}#profile=${encoded}`;
    } catch {
        return window.location.href;
    }
}

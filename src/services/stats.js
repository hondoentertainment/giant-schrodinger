const STORAGE_KEY = 'vwf_stats';
const MILESTONES = [
    { id: 'first_round', threshold: 1, type: 'rounds', reward: 'avatar', rewardId: '🎯', label: 'First Connection' },
    { id: 'five_rounds', threshold: 5, type: 'rounds', reward: 'avatar', rewardId: '⭐', label: '5 Rounds Played' },
    { id: 'ten_rounds', threshold: 10, type: 'rounds', reward: 'avatar', rewardId: '🏆', label: '10 Rounds Played' },
    { id: 'streak_3', threshold: 3, type: 'streak', reward: 'avatar', rewardId: '🔥', label: '3-Day Streak' },
    { id: 'streak_7', threshold: 7, type: 'streak', reward: 'theme', rewardId: 'mystery', label: '7-Day Streak' },
];

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

export function getStats() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        return {
            lastPlayedDate: parsed.lastPlayedDate || null,
            currentStreak: parsed.currentStreak ?? 0,
            maxStreak: parsed.maxStreak ?? 0,
            totalRounds: parsed.totalRounds ?? 0,
            totalCollisions: parsed.totalCollisions ?? 0,
            milestonesUnlocked: Array.isArray(parsed.milestonesUnlocked) ? parsed.milestonesUnlocked : [],
        };
    } catch {
        return {
            lastPlayedDate: null,
            currentStreak: 0,
            maxStreak: 0,
            totalRounds: 0,
            totalCollisions: 0,
            milestonesUnlocked: [],
        };
    }
}

export function recordPlay() {
    const today = getTodayKey();
    const stats = getStats();
    let currentStreak = stats.currentStreak;
    let maxStreak = stats.maxStreak;

    if (!stats.lastPlayedDate) {
        currentStreak = 1;
    } else {
        const days = daysBetween(stats.lastPlayedDate, today);
        if (days === 0) {
            // Same day, no change to streak
        } else if (days === 1) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }
    }

    maxStreak = Math.max(maxStreak, currentStreak);

    const updated = {
        ...stats,
        lastPlayedDate: today,
        currentStreak,
        maxStreak,
        totalRounds: stats.totalRounds + 1,
        totalCollisions: stats.totalCollisions + 1,
    };

    const newlyUnlocked = checkMilestones(updated);
    if (newlyUnlocked.length > 0) {
        updated.milestonesUnlocked = [...new Set([...updated.milestonesUnlocked, ...newlyUnlocked])];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { stats: updated, newlyUnlocked };
}

function checkMilestones(stats) {
    const unlocked = [];
    for (const m of MILESTONES) {
        if (stats.milestonesUnlocked.includes(m.id)) continue;
        const value = m.type === 'rounds' ? stats.totalRounds : stats.currentStreak;
        if (value >= m.threshold) {
            unlocked.push(m.id);
        }
    }
    return unlocked;
}

export function getMilestones() {
    return MILESTONES;
}

export function isAvatarUnlocked(avatarId, stats = null) {
    const s = stats || getStats();
    const milestone = MILESTONES.find((m) => m.reward === 'avatar' && m.rewardId === avatarId);
    if (!milestone) return true;
    return s.milestonesUnlocked.includes(milestone.id);
}

export function isThemeUnlocked(themeId, stats = null) {
    const s = stats || getStats();
    const milestone = MILESTONES.find((m) => m.reward === 'theme' && m.rewardId === themeId);
    if (!milestone) return true;
    return s.milestonesUnlocked.includes(milestone.id);
}

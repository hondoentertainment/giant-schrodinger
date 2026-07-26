import { getCollisions } from './storage';
import { getJudgementForCollision } from './judgements';

const STORAGE_KEY = 'vwf_stats';
const MILESTONES = [
    { id: 'first_round', threshold: 1, type: 'rounds', reward: 'avatar', rewardId: '🎯', label: 'First Connection' },
    { id: 'five_rounds', threshold: 5, type: 'rounds', reward: 'avatar', rewardId: '⭐', label: '5 Rounds Played' },
    { id: 'ten_rounds', threshold: 10, type: 'rounds', reward: 'avatar', rewardId: '🏆', label: '10 Rounds Played' },
    { id: 'twentyfive_rounds', threshold: 25, type: 'rounds', reward: 'avatar', rewardId: '💎', label: '25 Rounds — Diamond' },
    { id: 'fifty_rounds', threshold: 50, type: 'rounds', reward: 'avatar', rewardId: '🌟', label: '50 Rounds — All-Star' },
    { id: 'hundred_rounds', threshold: 100, type: 'rounds', reward: 'avatar', rewardId: '👑', label: '100 Rounds — Centurion' },
    { id: 'streak_3', threshold: 3, type: 'streak', reward: 'avatar', rewardId: '🔥', label: '3-Day Streak' },
    { id: 'streak_7', threshold: 7, type: 'streak', reward: 'theme', rewardId: 'mystery', label: '7-Day Streak — Mystery Box' },
    { id: 'streak_14', threshold: 14, type: 'streak', reward: 'avatar', rewardId: '⚡', label: '14-Day Streak Master' },
    { id: 'streak_30', threshold: 30, type: 'streak', reward: 'avatar', rewardId: '🏅', label: '30-Day Legend' },
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
            scores: Array.isArray(parsed.scores) ? parsed.scores : [],
            dailyScores: Array.isArray(parsed.dailyScores) ? parsed.dailyScores : [],
            themesPlayed: Array.isArray(parsed.themesPlayed) ? parsed.themesPlayed : [],
            milestonesUnlocked: Array.isArray(parsed.milestonesUnlocked) ? parsed.milestonesUnlocked : [],
        };
    } catch {
        return {
            lastPlayedDate: null,
            currentStreak: 0,
            maxStreak: 0,
            totalRounds: 0,
            totalCollisions: 0,
            scores: [],
            dailyScores: [],
            themesPlayed: [],
            milestonesUnlocked: [],
        };
    }
}

export function recordPlay(score = null, options = {}) {
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
        scores: Number.isFinite(score) ? [...stats.scores, score].slice(-100) : stats.scores,
        dailyScores: options.isDailyChallenge && Number.isFinite(score)
            ? [...stats.dailyScores, score].slice(-30)
            : stats.dailyScores,
        themesPlayed: options.themeId
            ? [...new Set([...stats.themesPlayed, options.themeId])]
            : stats.themesPlayed,
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

export function getBestScore(stats = null) {
    const s = stats || getStats();
    if (!s.scores?.length) return null;
    return Math.max(...s.scores.filter((score) => Number.isFinite(score)));
}

export function getFavoriteThemeId(stats = null) {
    const s = stats || getStats();
    if (!s.themesPlayed?.length) return null;
    const counts = s.themesPlayed.reduce((acc, themeId) => {
        acc[themeId] = (acc[themeId] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function getStreakStatus(stats = null) {
    const s = stats || getStats();
    const today = getTodayKey();
    if (!s.currentStreak || !s.lastPlayedDate) return 'none';
    const days = daysBetween(s.lastPlayedDate, today);
    if (days === 0) return 'active_today';
    if (days === 1) return 'at_risk';
    return 'broken';
}

export function getProfileSummary(stats = null) {
    const s = stats || getStats();
    const bestScore = getBestScore(s);
    const favoriteThemeId = getFavoriteThemeId(s);
    const nextMilestone = MILESTONES
        .filter((m) => !s.milestonesUnlocked.includes(m.id))
        .map((m) => {
            const value = m.type === 'rounds' ? s.totalRounds : s.currentStreak;
            return { ...m, remaining: Math.max(0, m.threshold - value) };
        })
        .sort((a, b) => a.remaining - b.remaining)[0] || null;

    let savedCount = 0;
    let friendJudgedCount = 0;
    let highlightCount = 0;
    let dailySavedCount = 0;
    const judgeModeCounts = { ai: 0, human: 0, friend: 0, other: 0 };
    const mediaCounts = {};

    try {
        const collisions = getCollisions() || [];
        savedCount = collisions.length;
        for (const collision of collisions) {
            if (getJudgementForCollision(collision.id)) friendJudgedCount += 1;
            if ((collision.score || 0) >= 8) highlightCount += 1;
            if (collision.isDailyChallenge) dailySavedCount += 1;
            const mode = collision.judgeMode || collision.scoringMode || 'other';
            if (mode === 'ai' || mode === 'human' || mode === 'friend') judgeModeCounts[mode] += 1;
            else judgeModeCounts.other += 1;
            const media = collision.mediaType || 'image';
            mediaCounts[media] = (mediaCounts[media] || 0) + 1;
        }
    } catch {
        // Profile enrichment must never break lobby render.
    }

    const finiteScores = (s.scores || []).filter((score) => Number.isFinite(score));
    const averageScore = finiteScores.length
        ? finiteScores.reduce((sum, score) => sum + score, 0) / finiteScores.length
        : null;
    const streakStatus = getStreakStatus(s);
    const topMediaType = Object.entries(mediaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
        bestScore,
        favoriteThemeId,
        currentStreak: s.currentStreak,
        maxStreak: s.maxStreak,
        totalRounds: s.totalRounds,
        nextMilestone,
        averageScore,
        savedCount,
        friendJudgedCount,
        highlightCount,
        dailySavedCount,
        judgeModeCounts,
        topMediaType,
        streakStatus,
        streakAtRisk: streakStatus === 'at_risk',
    };
}

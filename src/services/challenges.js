const STORAGE_KEY = 'vwf_challenges';
const CHALLENGE_HASH_PREFIX = 'challenge=';
const MAX_STREAK_MULTIPLIER = 1.5;
const MAX_STREAK_DAYS = 5;

function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function getChallenges() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to retrieve challenges:', error);
        return [];
    }
}

function saveChallenges(challenges) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
        return true;
    } catch (error) {
        console.warn('Failed to save challenges:', error);
        return false;
    }
}

/**
 * Creates a new challenge from round data.
 * @param {Object} roundData - { assets: {left, right}, submission, score, playerName, themeId }
 * @returns {Object|null} The created challenge object, or null on failure
 */
export function createChallenge(roundData) {
    try {
        const challenge = {
            id: generateId(),
            assets: roundData.assets,
            submission: roundData.submission,
            score: roundData.score,
            playerName: roundData.playerName || 'Anonymous',
            themeId: roundData.themeId || 'default',
            createdAt: new Date().toISOString(),
            status: 'pending',
            challengerResult: null,
        };

        const challenges = getChallenges();
        challenges.unshift(challenge);
        saveChallenges(challenges);

        return challenge;
    } catch (error) {
        console.warn('Failed to create challenge:', error);
        return null;
    }
}

/**
 * Retrieves a challenge by its ID.
 * @param {string} challengeId
 * @returns {Object|null} The challenge object, or null if not found
 */
export function getChallenge(challengeId) {
    try {
        const challenges = getChallenges();
        return challenges.find(c => c.id === challengeId) || null;
    } catch (error) {
        console.warn('Failed to get challenge:', error);
        return null;
    }
}

/**
 * Resolves a challenge by adding the challenger's result and determining the winner.
 * @param {string} challengeId
 * @param {Object} challengerResult - { score, playerName, submission }
 * @returns {Object|null} The resolved challenge with winner info, or null on failure
 */
export function resolveChallenge(challengeId, challengerResult) {
    try {
        const challenges = getChallenges();
        const index = challenges.findIndex(c => c.id === challengeId);
        if (index === -1) return null;

        const challenge = challenges[index];
        const originalScore = challenge.score;
        const challengerScore = challengerResult.score;

        let winner;
        if (challengerScore > originalScore) {
            winner = challengerResult.playerName || 'Challenger';
        } else if (originalScore > challengerScore) {
            winner = challenge.playerName;
        } else {
            winner = 'tie';
        }

        challenges[index] = {
            ...challenge,
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            challengerResult: {
                score: challengerScore,
                playerName: challengerResult.playerName || 'Challenger',
                submission: challengerResult.submission,
            },
            winner,
        };

        saveChallenges(challenges);
        return challenges[index];
    } catch (error) {
        console.warn('Failed to resolve challenge:', error);
        return null;
    }
}

/**
 * Returns all challenges (sent and received).
 * @returns {Array} Array of challenge objects
 */
export function getChallengeHistory() {
    return getChallenges();
}

/**
 * Creates a shareable URL with the challenge encoded in the hash.
 * @param {Object} challenge - The challenge object to encode
 * @returns {string|null} The full URL, or null on failure
 */
export function createChallengeUrl(challenge) {
    try {
        const base = window.location.origin + window.location.pathname;
        const payload = {
            id: challenge.id,
            assets: challenge.assets,
            score: challenge.score,
            playerName: challenge.playerName,
            themeId: challenge.themeId,
        };
        const json = JSON.stringify(payload);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        return `${base}#${CHALLENGE_HASH_PREFIX}${encoded}`;
    } catch (error) {
        console.warn('Failed to create challenge URL:', error);
        return null;
    }
}

/**
 * Parses challenge data from the current URL hash.
 * @returns {Object|null} The decoded challenge payload, or null if not present
 */
export function parseChallengeUrl() {
    try {
        const hash = window.location.hash || '';
        if (!hash.startsWith('#') || !hash.includes(CHALLENGE_HASH_PREFIX)) {
            return null;
        }

        const encoded = hash.slice(hash.indexOf(CHALLENGE_HASH_PREFIX) + CHALLENGE_HASH_PREFIX.length);
        if (!encoded) return null;

        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
    } catch (error) {
        console.warn('Failed to parse challenge URL:', error);
        return null;
    }
}

/**
 * Removes challenge data from the URL without a page reload.
 */
export function clearChallengeFromUrl() {
    if (window.history.replaceState) {
        const clean = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', clean);
    }
}

/**
 * Calculates a streak bonus multiplier based on the player's current streak.
 * @param {Object} stats - Object containing at least { currentStreak }
 * @returns {number} Multiplier from 1.0 (0 days) to 1.5 (5+ days)
 */
export function getStreakBonus(stats) {
    const streak = Math.max(0, stats?.currentStreak ?? 0);
    const cappedStreak = Math.min(streak, MAX_STREAK_DAYS);
    return 1.0 + cappedStreak * 0.1;
}

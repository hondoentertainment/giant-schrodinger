const STORAGE_KEY = 'vwf_referrals';
const BONUS_POINTS_PER_REFERRAL = 50;
const MAX_REFERRAL_REWARDS = 5;
const REFERRAL_CODE_LENGTH = 6;

function getStoredData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('Failed to retrieve referral data:', error);
        return {};
    }
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.warn('Failed to save referral data:', error);
        return false;
    }
}

/**
 * Generates a short alphanumeric referral code for a player.
 * If the player already has a code, returns the existing one.
 * @param {string} playerName
 * @returns {string} A 6-character referral code
 */
export function generateReferralCode(playerName) {
    try {
        const data = getStoredData();

        if (data.myReferralCode) {
            return data.myReferralCode;
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        data.myReferralCode = code;
        data.playerName = playerName || 'Anonymous';
        data.referrals = data.referrals || [];
        saveData(data);

        return code;
    } catch (error) {
        console.warn('Failed to generate referral code:', error);
        return '';
    }
}

/**
 * Records when someone joins via a referral code.
 * @param {string} referralCode - The referral code used
 * @returns {boolean} True if the referral was tracked successfully
 */
export function trackReferral(referralCode) {
    try {
        if (!referralCode || typeof referralCode !== 'string') return false;

        const data = getStoredData();
        data.referrals = data.referrals || [];

        data.referrals.push({
            code: referralCode,
            timestamp: new Date().toISOString(),
        });

        data.joinedViaCode = data.joinedViaCode || referralCode;
        data.bonusClaimed = data.bonusClaimed || false;

        saveData(data);
        return true;
    } catch (error) {
        console.warn('Failed to track referral:', error);
        return false;
    }
}

/**
 * Returns referral statistics for the current player.
 * @returns {Object} { totalReferred, bonusPointsEarned, referralCode }
 */
export function getReferralStats() {
    try {
        const data = getStoredData();
        const referrals = data.referrals || [];
        const capped = Math.min(referrals.length, MAX_REFERRAL_REWARDS);

        return {
            totalReferred: referrals.length,
            bonusPointsEarned: capped * BONUS_POINTS_PER_REFERRAL,
            referralCode: data.myReferralCode || null,
        };
    } catch (error) {
        console.warn('Failed to get referral stats:', error);
        return { totalReferred: 0, bonusPointsEarned: 0, referralCode: null };
    }
}

/**
 * Returns the total bonus points earned from referrals (capped at max).
 * @returns {number} Bonus points (50 per referral, max 250)
 */
export function checkReferralReward() {
    try {
        const data = getStoredData();
        const referrals = data.referrals || [];
        const capped = Math.min(referrals.length, MAX_REFERRAL_REWARDS);
        return capped * BONUS_POINTS_PER_REFERRAL;
    } catch (error) {
        console.warn('Failed to check referral reward:', error);
        return 0;
    }
}

/**
 * Track a referral conversion with cohort data.
 * Records rounds played and retention flags (d1, d7).
 * @param {string} referralCode - The referral code to track
 */
export function trackReferralConversion(referralCode) {
    try {
        if (!referralCode || typeof referralCode !== 'string') return;
        const cohorts = JSON.parse(localStorage.getItem('venn_referral_cohorts') || '{}');
        if (!cohorts[referralCode]) {
            cohorts[referralCode] = { firstSeen: Date.now(), rounds: 0, d1: false, d7: false };
        }
        cohorts[referralCode].rounds++;
        cohorts[referralCode].lastSeen = Date.now();

        const daysSinceFirst = (Date.now() - cohorts[referralCode].firstSeen) / 86400000;
        if (daysSinceFirst >= 1) cohorts[referralCode].d1 = true;
        if (daysSinceFirst >= 7) cohorts[referralCode].d7 = true;

        localStorage.setItem('venn_referral_cohorts', JSON.stringify(cohorts));
    } catch (error) {
        console.warn('Failed to track referral conversion:', error);
    }
}

/**
 * Returns all referral cohort data.
 * @returns {Object} Map of referralCode -> { firstSeen, rounds, d1, d7, lastSeen }
 */
export function getReferralCohorts() {
    try {
        return JSON.parse(localStorage.getItem('venn_referral_cohorts')) || {};
    } catch {
        return {};
    }
}

/**
 * Checks the current URL query params for a referral code (?ref=CODE).
 * @returns {string|null} The referral code, or null if not present
 */
export function parseReferralFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('ref');
        return code && code.trim() ? code.trim() : null;
    } catch (error) {
        console.warn('Failed to parse referral from URL:', error);
        return null;
    }
}

/**
 * Returns true if the player joined via a referral and hasn't claimed their bonus yet.
 * @returns {boolean}
 */
export function hasReferralBonus() {
    try {
        const data = getStoredData();
        return Boolean(data.joinedViaCode) && !data.bonusClaimed;
    } catch (error) {
        console.warn('Failed to check referral bonus:', error);
        return false;
    }
}

/**
 * Marks the referral join bonus as claimed and returns the bonus points.
 * @returns {number} Bonus points awarded (50), or 0 if already claimed or not eligible
 */
export function claimReferralBonus() {
    try {
        const data = getStoredData();

        if (!data.joinedViaCode || data.bonusClaimed) {
            return 0;
        }

        data.bonusClaimed = true;
        saveData(data);

        return BONUS_POINTS_PER_REFERRAL;
    } catch (error) {
        console.warn('Failed to claim referral bonus:', error);
        return 0;
    }
}

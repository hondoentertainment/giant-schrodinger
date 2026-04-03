const FLAGS_KEY = 'venn_content_flags';
const REVIEWED_KEY = 'venn_moderation_reviewed';

// Basic profanity filter (expandable word list)
const BLOCKED_WORDS = [
    'fuck', 'shit', 'ass', 'damn', 'bitch', 'bastard', 'dick', 'crap',
    'piss', 'slut', 'whore', 'nigger', 'faggot', 'retard',
];

const BLOCKED_PATTERN = new RegExp(
    `\\b(${BLOCKED_WORDS.join('|')})\\b`,
    'i'
);

/**
 * Check if text contains blocked content.
 * @returns {{ clean: boolean, reason?: string }}
 */
export function checkContent(text) {
    if (!text || typeof text !== 'string') return { clean: true };
    const trimmed = text.trim();
    if (trimmed.length < 2) return { clean: false, reason: 'Too short' };
    if (trimmed.length > 300) return { clean: false, reason: 'Too long (max 300 chars)' };
    if (BLOCKED_PATTERN.test(trimmed)) return { clean: false, reason: 'Contains inappropriate language' };
    // Check for repetitive spam
    if (/(.)\1{9,}/.test(trimmed)) return { clean: false, reason: 'Repetitive content' };
    return { clean: true };
}

/**
 * Flag content for review.
 */
export function flagContent(contentId, reason) {
    const flags = getFlags();
    // Prevent duplicate flags
    if (flags.some(f => f.contentId === contentId)) return;
    flags.push({ contentId, reason, flaggedAt: Date.now(), status: 'pending' });
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

/**
 * Get all flags.
 */
export function getFlags() {
    try { return JSON.parse(localStorage.getItem(FLAGS_KEY)) || []; } catch { return []; }
}

/**
 * Get count of pending flags.
 */
export function getFlaggedCount() {
    return getFlags().filter(f => f.status === 'pending').length;
}

/**
 * Approve flagged content (mark as reviewed/safe).
 */
export function approveContent(contentId) {
    const flags = getFlags().map(f =>
        f.contentId === contentId ? { ...f, status: 'approved', reviewedAt: Date.now() } : f
    );
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
    addToReviewed(contentId, 'approved');
}

/**
 * Remove flagged content.
 */
export function removeContent(contentId) {
    const flags = getFlags().map(f =>
        f.contentId === contentId ? { ...f, status: 'removed', reviewedAt: Date.now() } : f
    );
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
    addToReviewed(contentId, 'removed');
}

/**
 * Remove a flag entirely.
 */
export function removeFlag(contentId) {
    const flags = getFlags().filter(f => f.contentId !== contentId);
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

/**
 * Alias for removeFlag.
 */
export function clearFlag(contentId) {
    removeFlag(contentId);
}

/**
 * Track reviewed content decisions.
 */
function addToReviewed(contentId, decision) {
    try {
        const reviewed = JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]');
        reviewed.push({ contentId, decision, reviewedAt: Date.now() });
        localStorage.setItem(REVIEWED_KEY, JSON.stringify(reviewed.slice(-200)));
    } catch { /* silent */ }
}

/**
 * Get moderation stats.
 */
export function getModerationStats() {
    const flags = getFlags();
    return {
        total: flags.length,
        pending: flags.filter(f => f.status === 'pending').length,
        approved: flags.filter(f => f.status === 'approved').length,
        removed: flags.filter(f => f.status === 'removed').length,
    };
}

<<<<<<< HEAD
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
=======
import { isBackendEnabled, supabase } from '../lib/supabase';

const LOCAL_FLAGS_KEY = 'venn_content_flags';

function readLocalFlags() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_FLAGS_KEY) || '[]');
    } catch {
        return [];
    }
}

function writeLocalFlags(flags) {
    localStorage.setItem(LOCAL_FLAGS_KEY, JSON.stringify(flags));
}

function getReporterId() {
    return localStorage.getItem('venn_user_id') || localStorage.getItem('venn_user_name') || 'anonymous';
}

export async function flagContent(contentId, reason, metadata = {}) {
    const payload = {
        contentId,
        reason,
        contentType: metadata.contentType || 'collision',
        reporterId: getReporterId(),
        metadata,
        flaggedAt: Date.now(),
    };

    if (isBackendEnabled()) {
        try {
            const { data, error } = await supabase.rpc('report_content', {
                p_content_id: contentId,
                p_reason: reason,
                p_content_type: payload.contentType,
                p_reporter_id: payload.reporterId,
                p_metadata: metadata,
            });
            if (!error && data) {
                return { ...payload, backendId: data.id, status: data.status || 'pending' };
            }
        } catch (err) {
            console.warn('flagContent backend failed, using local fallback:', err);
        }
    }

    const flags = readLocalFlags();
    flags.push(payload);
    writeLocalFlags(flags);
    return payload;
>>>>>>> origin/main
}

/**
 * Get all flags.
 */
export function getFlags() {
<<<<<<< HEAD
    try { return JSON.parse(localStorage.getItem(FLAGS_KEY)) || []; } catch { return []; }
}

/**
 * Get count of pending flags.
 */
export function getFlaggedCount() {
    return getFlags().filter(f => f.status === 'pending').length;
=======
    return readLocalFlags();
}

export async function getPendingReports(limit = 50) {
    if (isBackendEnabled()) {
        try {
            const { data, error } = await supabase.rpc('list_content_reports', { p_limit: limit });
            if (!error && Array.isArray(data)) {
                return data.map((row) => ({
                    contentId: row.content_id,
                    reason: row.reason,
                    flaggedAt: new Date(row.created_at).getTime(),
                    status: row.status,
                    backendId: row.id,
                    reporterId: row.reporter_id,
                }));
            }
        } catch (err) {
            console.warn('getPendingReports failed:', err);
        }
    }
    return getFlags();
}

export async function updateReportStatus(reportId, status) {
    if (isBackendEnabled() && reportId) {
        try {
            const { error } = await supabase.rpc('update_content_report_status', {
                p_report_id: reportId,
                p_status: status,
            });
            if (!error) return true;
        } catch (err) {
            console.warn('updateReportStatus failed:', err);
        }
    }
    return false;
}

export function getFlaggedCount() {
    return getFlags().length;
>>>>>>> origin/main
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
<<<<<<< HEAD
    const flags = getFlags().filter(f => f.contentId !== contentId);
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
=======
    const flags = getFlags().filter((flag) => flag.contentId !== contentId);
    writeLocalFlags(flags);
>>>>>>> origin/main
}

/**
 * Alias for removeFlag.
 */
export function clearFlag(contentId) {
    removeFlag(contentId);
<<<<<<< HEAD
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
=======
>>>>>>> origin/main
}

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
}

export function getFlags() {
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
}

export function removeFlag(contentId) {
    const flags = getFlags().filter((flag) => flag.contentId !== contentId);
    writeLocalFlags(flags);
}

export function clearFlag(contentId) {
    removeFlag(contentId);
}

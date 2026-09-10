export const LINK_COPIED_MESSAGE = 'Link copied';

/**
 * Prefer the native share sheet; fall back to the clipboard.
 * @param {{ title?: string, text?: string, url?: string }} payload
 * @returns {Promise<{ method: 'share_sheet' | 'clipboard' | 'dismissed' | 'failed', copied: boolean }>}
 */
export async function shareOrCopy({ title, text, url } = {}) {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({
                title: title || 'Venn with Friends',
                ...(text ? { text } : {}),
                ...(url ? { url } : {}),
            });
            return { method: 'share_sheet', copied: false };
        }
    } catch (err) {
        if (err?.name === 'AbortError') {
            return { method: 'dismissed', copied: false };
        }
    }

    const payload = [text, url].filter(Boolean).join(text && url ? ' ' : '');
    if (!payload) return { method: 'failed', copied: false };

    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload);
            return { method: 'clipboard', copied: true };
        }
    } catch {
        // Fall through to execCommand.
    }

    try {
        if (typeof document === 'undefined') return { method: 'failed', copied: false };
        const textArea = document.createElement('textarea');
        textArea.value = payload;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { method: 'clipboard', copied: true };
    } catch {
        return { method: 'failed', copied: false };
    }
}

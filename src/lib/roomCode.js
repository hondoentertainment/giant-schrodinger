/** Pull a 4–6 character room code from typed text or a pasted join URL. */
export function extractRoomCode(raw) {
    const text = String(raw || '').trim();
    if (!text) return '';
    const fromQuery = text.match(/[?&#]join=([A-Za-z0-9]{4,8})/i);
    if (fromQuery?.[1]) {
        return fromQuery[1].toUpperCase().slice(0, 6);
    }
    // A URL host is not a room code — "https://giant…" must not become "HTTPSG".
    if (/https?:\/\//i.test(text) || /[/?#]/.test(text)) {
        return '';
    }
    return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

/** Keep invite URLs intact until a join code can be pulled out. */
export function normalizeJoinInput(raw) {
    const text = String(raw ?? '');
    const extracted = extractRoomCode(text);
    if (extracted && /[?&#]join=/i.test(text)) return extracted;
    if (/https?:\/\//i.test(text) || /[?&#]join=/i.test(text) || text.includes('/')) {
        return text;
    }
    return extracted;
}

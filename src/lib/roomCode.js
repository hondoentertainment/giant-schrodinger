/** Pull a 4–6 character room code from typed text or a pasted join URL. */
export function extractRoomCode(raw) {
    const text = String(raw || '').trim();
    if (!text) return '';
    const fromQuery = text.match(/[?&#]join=([A-Za-z0-9]{4,8})/i);
    const token = fromQuery?.[1] || text;
    return token.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

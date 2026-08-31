export const PASS_PHONE_SECONDS = 30;
export const PASS_PHONE_STARE_MS = 3000;
export const PASS_PHONE_DRUMROLL_MS = 1800;

export function getCurrentWriter(seatedPlayers = [], submissions = []) {
    const submitted = new Set(
        submissions.map((entry) => String(entry?.player_name || '').trim().toLowerCase()).filter(Boolean)
    );
    return seatedPlayers.find((player) => {
        const name = String(player?.player_name || '').trim().toLowerCase();
        return name && !submitted.has(name);
    }) || null;
}

export function canWriteOnThisDevice({
    passThePhone,
    currentWriter,
    playerName,
    couchSessions = [],
} = {}) {
    if (!passThePhone) return true;
    const writer = String(currentWriter?.player_name || '').trim().toLowerCase();
    if (!writer) return false;
    if (String(playerName || '').trim().toLowerCase() === writer) return true;
    return couchSessions.some((session) => (
        String(session?.playerName || '').trim().toLowerCase() === writer
    ));
}

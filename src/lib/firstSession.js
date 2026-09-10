export const AUTOSTART_DAILY_KEY = 'vwf_autostart_daily';

export function markAutostartDaily() {
    try {
        sessionStorage.setItem(AUTOSTART_DAILY_KEY, '1');
        return true;
    } catch {
        return false;
    }
}

export function peekAutostartDaily() {
    try {
        return sessionStorage.getItem(AUTOSTART_DAILY_KEY) === '1';
    } catch {
        return false;
    }
}

export function consumeAutostartDaily() {
    try {
        const ready = sessionStorage.getItem(AUTOSTART_DAILY_KEY) === '1';
        if (ready) sessionStorage.removeItem(AUTOSTART_DAILY_KEY);
        return ready;
    } catch {
        return false;
    }
}

export const FIRST_SESSION_CELEBRATED_KEY = 'vwf_first_session_celebrated';

export function hasCelebratedFirstSession() {
    try {
        return localStorage.getItem(FIRST_SESSION_CELEBRATED_KEY) === '1';
    } catch {
        return false;
    }
}

export function markFirstSessionCelebrated() {
    try {
        localStorage.setItem(FIRST_SESSION_CELEBRATED_KEY, '1');
        return true;
    } catch {
        return false;
    }
}

/** True once: the session that just finished is also the player's first session. */
export function shouldCelebrateFirstSession({ totalRoundsPlayed = 0, sessionRoundCount = 0 } = {}) {
    if (hasCelebratedFirstSession()) return false;
    if (!sessionRoundCount || totalRoundsPlayed <= 0) return false;
    return totalRoundsPlayed <= sessionRoundCount;
}

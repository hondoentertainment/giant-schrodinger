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

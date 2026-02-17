import { THEMES, getThemeById } from '../data/themes';

const DAILY_STORAGE_KEY = 'vwf_daily';

const DAILY_PROMPTS = [
    'Connect something ancient with something futuristic.',
    'Find the link between silence and chaos.',
    'What do opposites have in common?',
    'Bridge the gap between two worlds.',
    'Discover the unexpected overlap.',
    'Connect the micro to the macro.',
    'Find meaning in the collision.',
    'What would these two create together?',
    'The universe is full of connections — find this one.',
    'Two strangers meet. What do they share?',
    'Everything is connected — prove it.',
    'See what others miss.',
    'Creative minds find unlikely links.',
    'Today\'s challenge: think sideways.',
    'The best connections are the surprising ones.',
    'One phrase to rule them both.',
    'What binds these two together?',
    'Simple concepts, clever connections.',
    'Think abstract. Think bold.',
    'Your wittiest connection wins.',
    'Stretch your creative muscles.',
    'The intersection awaits your insight.',
    'Today\'s prompt: think like a poet.',
    'Find the thread between two ideas.',
    'The overlap is where genius lives.',
    'Make the impossible connection.',
    'Two halves of a whole — what is it?',
    'Today\'s vibe: unexpected brilliance.',
    'Find harmony in contrast.',
    'The best answers are the ones nobody else would write.',
    'One phrase, two concepts, infinite possibilities.',
];

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function getDaySeed() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return year * 10000 + month * 100 + day;
}

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyChallenge() {
    const seed = getDaySeed();
    const rng = seededRandom(seed);

    const themeIndex = Math.floor(rng() * (THEMES.length - 1));
    const theme = THEMES[themeIndex];

    const promptIndex = Math.floor(rng() * DAILY_PROMPTS.length);
    const prompt = DAILY_PROMPTS[promptIndex];

    return {
        seed,
        themeId: theme.id,
        theme,
        prompt,
        date: getTodayKey(),
    };
}

export function hasDailyChallengeBeenPlayed() {
    try {
        const stored = localStorage.getItem(DAILY_STORAGE_KEY);
        if (!stored) return false;
        const data = JSON.parse(stored);
        return data.date === getTodayKey();
    } catch {
        return false;
    }
}

export function markDailyChallengeComplete(score) {
    try {
        const today = getTodayKey();
        const history = getDailyChallengeHistory();
        history.unshift({ date: today, score, completedAt: new Date().toISOString() });
        if (history.length > 30) history.length = 30;

        localStorage.setItem(
            DAILY_STORAGE_KEY,
            JSON.stringify({ date: today, score, history })
        );
    } catch {
        // Silently fail
    }
}

export function getDailyChallengeHistory() {
    try {
        const stored = localStorage.getItem(DAILY_STORAGE_KEY);
        if (!stored) return [];
        const data = JSON.parse(stored);
        return Array.isArray(data.history) ? data.history : [];
    } catch {
        return [];
    }
}

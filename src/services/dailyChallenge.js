import { getAvailableThemes, MEDIA_TYPES } from '../data/themes';
import { getDailyEditorialPair, getWeeklyEpisode } from '../data/curatedPairs';

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
    'Pair nostalgia with something brand new this week.',
    'Find the shared pulse between analog and digital.',
    'What do a memory and a meme have in common?',
    'Connect a quiet ritual with a loud celebration.',
    'Link something you cook with something you code.',
    'Bridge a childhood toy and a grown-up tool.',
    'Where do comfort food and comfort tech overlap?',
    'Make one phrase that fits both summer heat and winter quiet.',
];

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function getDaySeed() {
    return getDaySeedForDate(new Date());
}

function formatDayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayKey() {
    return formatDayKey(new Date());
}

function getDaySeedForDate(date) {
    return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
}

export function formatDailySocialLabel(date = new Date(), vibe) {
    const stamp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return vibe ? `${stamp} · ${vibe}` : stamp;
}

export function getDailyChallenge() {
    const seed = getDaySeed();
    const rng = seededRandom(seed);

    // In-season pool keeps dailies deterministic per day while letting
    // seasonal themes headline during their calendar window.
    const themePool = getAvailableThemes();
    const themeIndex = Math.floor(rng() * themePool.length);
    const theme = themePool[themeIndex];

    const promptIndex = Math.floor(rng() * DAILY_PROMPTS.length);
    const prompt = DAILY_PROMPTS[promptIndex];
    const mediaType = rng() >= 0.65 ? MEDIA_TYPES.MEMES_VIDEOS : MEDIA_TYPES.IMAGE;

    return {
        seed,
        themeId: theme.id,
        theme,
        prompt,
        pair: getDailyEditorialPair(new Date()),
        weekTitle: getWeeklyEpisode(new Date()).title,
        date: getTodayKey(),
        mediaType,
        isMemesVideosDay: mediaType === MEDIA_TYPES.MEMES_VIDEOS,
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

export function getDailyChallengeSummary() {
    const history = getDailyChallengeHistory();
    if (history.length === 0) {
        return {
            completions: 0,
            bestScore: null,
            latestScore: null,
            averageScore: null,
            shareLine: 'Today is open. Complete the daily challenge to start your streak ritual.',
            weeklyBest: null,
            weeklyCompletions: 0,
        };
    }

    const scores = history.map((entry) => Number(entry.score) || 0);
    const bestScore = Math.max(...scores);
    const latestScore = scores[0];
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const weekly = getWeeklyDailyLeaderboard();

    return {
        completions: history.length,
        bestScore,
        latestScore,
        averageScore,
        shareLine: `Daily Venn complete: ${latestScore}/10 today, best ${bestScore}/10 across ${history.length} day${history.length === 1 ? '' : 's'}.`,
        weeklyBest: weekly.bestScore,
        weeklyCompletions: weekly.completions,
    };
}

function getWeekStartKey(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYesterdayChallenge() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const seed = getDaySeedForDate(date);
    return {
        date: formatDayKey(date),
        seed,
        pair: getDailyEditorialPair(date),
    };
}

export function getDailyStampWeek(now = new Date()) {
    const history = getDailyChallengeHistory();
    const played = new Set(history.map((entry) => entry.date));
    const stamps = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(now);
        date.setDate(now.getDate() - offset);
        const key = formatDayKey(date);
        stamps.push({
            date: key,
            played: played.has(key),
            isToday: offset === 0,
            label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
        });
    }
    return stamps;
}

export function getWeeklyDailyLeaderboard() {
    const weekStart = getWeekStartKey();
    const history = getDailyChallengeHistory().filter((entry) => entry.date >= weekStart);
    if (history.length === 0) {
        return { completions: 0, bestScore: null, averageScore: null, weekStart };
    }
    const scores = history.map((entry) => Number(entry.score) || 0);
    return {
        completions: history.length,
        bestScore: Math.max(...scores),
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        weekStart,
    };
}

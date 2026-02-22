import { ASSET_THEMES, getAssetsForTheme } from "../data/assets";

// Mulberry32 seeded random number generator
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Generate a numeric seed from a date string (YYYY-MM-DD)
function generateSeed(dateString) {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Get the daily pair for a specific date (defaults to today)
export function getDailyPair(date = new Date()) {
    // Format date as YYYY-MM-DD in UTC to ensure global consistency
    const dateString = date.toISOString().split('T')[0];
    const seed = generateSeed(dateString);
    const random = mulberry32(seed);

    // Get all available assets
    const allAssets = getAssetsForTheme('random');

    // Check if we have enough assets
    if (allAssets.length < 2) return null;

    // Deterministically pick two unique indices
    const idx1 = Math.floor(random() * allAssets.length);
    let idx2 = Math.floor(random() * allAssets.length);

    // Ensure unique
    while (idx2 === idx1) {
        idx2 = Math.floor(random() * allAssets.length);
    }

    return {
        date: dateString,
        id: `#${seed.toString().slice(0, 4)}`, // Short ID for display
        assets: {
            left: allAssets[idx1],
            right: allAssets[idx2]
        }
    };
}

// Calculate time remaining until next reset (Midnight UTC)
export function getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const diff = tomorrow - now;

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, ms: diff };
}

#!/usr/bin/env node
/**
 * Resolve theme keywords to Pexels photo URLs for catalog maintenance.
 *
 * Usage:
 *   PEXELS_API_KEY=your-key npm run refresh:theme-images
 *   PEXELS_API_KEY=your-key node scripts/refresh-theme-images.mjs --theme neon --limit 5
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles } from './load-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

loadEnvFiles(repoRoot);

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

const THEME_KEYWORDS = {
    neon: ['neon city', 'nightclub dancing', 'street art', 'dj neon', 'tokyo neon'],
    nature: ['waterfall', 'northern lights', 'deer meadow', 'forest canopy', 'mountain lake'],
    'retro-tech': ['vintage computer', 'cassette tape', 'arcade', 'circuit board', 'retro futurism'],
    ocean: ['ocean waves', 'scuba diver', 'coral reef', 'lighthouse', 'whale tail'],
    sunset: ['sunset skyline', 'golden hour forest', 'hot air balloons', 'pier sunset', 'vineyard sunset'],
};

function parseArgs(argv) {
    const args = { theme: null, limit: 5, out: null };
    for (let i = 0; i < argv.length; i += 1) {
        if (argv[i] === '--theme') args.theme = argv[i + 1];
        if (argv[i] === '--limit') args.limit = Number(argv[i + 1]) || 5;
        if (argv[i] === '--out') args.out = argv[i + 1];
    }
    return args;
}

async function searchPexels(query) {
    const params = new URLSearchParams({
        query,
        per_page: '1',
        orientation: 'squarish',
    });

    const response = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
        headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Pexels ${response.status} for "${query}"`);
    }

    const data = await response.json();
    const photo = data?.photos?.[0];
    if (!photo) return null;

    return {
        query,
        id: String(photo.id),
        label: query.replace(/\b\w/g, (char) => char.toUpperCase()),
        url: photo.src?.large2x || photo.src?.large || photo.src?.medium,
        photographer: photo.photographer,
        pexelsUrl: photo.url,
    };
}

async function refreshTheme(themeId, limit) {
    const keywords = THEME_KEYWORDS[themeId];
    if (!keywords) {
        throw new Error(`Unknown theme "${themeId}". Available: ${Object.keys(THEME_KEYWORDS).join(', ')}`);
    }

    const picks = [];
    for (const keyword of keywords.slice(0, limit)) {
        const result = await searchPexels(keyword);
        if (result) picks.push(result);
    }
    return picks;
}

async function main() {
    const { theme, limit, out } = parseArgs(process.argv.slice(2));

    if (!PEXELS_API_KEY) {
        console.error('Missing PEXELS_API_KEY. Set it in the environment or .env.local.');
        process.exit(1);
    }

    const themes = theme ? [theme] : Object.keys(THEME_KEYWORDS);
    const catalog = {};

    for (const themeId of themes) {
        console.log(`Refreshing ${themeId}...`);
        catalog[themeId] = await refreshTheme(themeId, limit);
        console.log(`  ${catalog[themeId].length} assets`);
    }

    const payload = JSON.stringify(catalog, null, 2);
    if (out) {
        writeFileSync(resolve(repoRoot, out), payload);
        console.log(`Wrote ${out}`);
    } else {
        console.log(payload);
    }
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});

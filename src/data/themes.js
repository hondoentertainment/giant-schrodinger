const DEFAULT_KEYWORDS = ["abstract art", "texture", "colorful pattern", "surreal", "dreamscape"];

const IMG_WIDTH = 800;

function buildUnsplashUrl(id, width = IMG_WIDTH) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

function buildPicsumFallback(labelOrKeyword) {
    const slug = String(labelOrKeyword || 'placeholder').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://picsum.photos/seed/${slug || 'venn'}/${IMG_WIDTH}/${IMG_WIDTH}`;
}

function createImage({ id, label, fallback }) {
    return {
        id,
        label,
        url: buildUnsplashUrl(id),
        fallbackUrl: buildPicsumFallback(fallback || label),
    };
}

const DEFAULT_FUSIONS = [
    createImage({ id: "1549490349-8643362247b5", label: "Abstract Fusion", fallback: "abstract art" }),
    createImage({ id: "1519681393784-d120267933ba", label: "Dreamscape", fallback: "surreal" }),
];

export const THEMES = [
    {
        id: "neon",
        label: "Neon Nights",
        gradient: "from-pink-500 to-rose-500",
        modifier: {
            timeLimit: 55,
            scoreMultiplier: 1.1,
            hint: "Fast-paced city energy. Think bold, punchy links.",
        },
        keywords: ["neon city", "cyberpunk alley", "neon signs", "street art", "night market"],
        assets: [
            createImage({ id: "1555680202-c86f0e12f086", label: "Neon Alley", fallback: "neon city" }),
            createImage({ id: "1563089145-599997674d42", label: "Neon Glow", fallback: "neon signs" }),
            createImage({ id: "1470770841072-f978cf4d019e", label: "Night Streets", fallback: "night city" }),
            createImage({ id: "1489515217757-5fd1be406fef", label: "Light Trails", fallback: "city lights" }),
        ],
        fusionImages: [
            createImage({ id: "1469474968028-56623f02e42e", label: "Electric Atmosphere", fallback: "neon abstract" }),
            createImage({ id: "1519681393784-d120267933ba", label: "Chromatic Haze", fallback: "glow" }),
        ],
    },
    {
        id: "nature",
        label: "Wild Nature",
        gradient: "from-emerald-500 to-teal-500",
        modifier: {
            timeLimit: 65,
            scoreMultiplier: 1.0,
            hint: "Organic connections. Calm, grounded associations.",
        },
        keywords: ["forest", "waterfall", "mountain lake", "mossy rocks", "wildflowers"],
        assets: [
            createImage({ id: "1441974231531-c6227db76b6e", label: "Forest Canopy", fallback: "forest" }),
            createImage({ id: "1501785888041-af3ef285b470", label: "Mountain Lake", fallback: "mountain lake" }),
            createImage({ id: "1500530855697-b586d89ba3ee", label: "Pine Woods", fallback: "pine forest" }),
            createImage({ id: "1469474968028-56623f02e42e", label: "Misty Trail", fallback: "forest path" }),
        ],
        fusionImages: [
            createImage({ id: "1500530855697-b586d89ba3ee", label: "Natural Blend", fallback: "forest abstract" }),
            createImage({ id: "1501785888041-af3ef285b470", label: "Wild Echo", fallback: "mountain mist" }),
        ],
    },
    {
        id: "retro-tech",
        label: "Retro Tech",
        gradient: "from-purple-500 to-indigo-500",
        modifier: {
            timeLimit: 50,
            scoreMultiplier: 1.15,
            hint: "Nostalgic tech mashups. Be clever with references.",
        },
        keywords: ["vintage computer", "circuit board", "cassette tape", "arcade", "retro futurism"],
        assets: [
            createImage({ id: "1518770660439-4636190af475", label: "Circuit Board", fallback: "circuit board" }),
            createImage({ id: "1453928582365-b6ad33cbcf64", label: "Analog Console", fallback: "vintage technology" }),
            createImage({ id: "1519681393784-d120267933ba", label: "Retro Glow", fallback: "retro neon" }),
            createImage({ id: "1487058792275-0ad4aaf24ca7", label: "Arcade Lights", fallback: "arcade" }),
        ],
        fusionImages: [
            createImage({ id: "1518770660439-4636190af475", label: "Signal Merge", fallback: "tech abstract" }),
            createImage({ id: "1487058792275-0ad4aaf24ca7", label: "Retro Synth", fallback: "retro futurism" }),
        ],
    },
    {
        id: "ocean",
        label: "Ocean Drift",
        gradient: "from-cyan-500 to-blue-500",
        modifier: {
            timeLimit: 60,
            scoreMultiplier: 1.05,
            hint: "Flowing, layered ideas. Think depth and movement.",
        },
        keywords: ["ocean waves", "coral reef", "sailing", "underwater", "seaside cliffs"],
        assets: [
            createImage({ id: "1507525428034-b723cf961d3e", label: "Ocean Swell", fallback: "ocean waves" }),
            createImage({ id: "1470770841072-f978cf4d019e", label: "Storm Horizon", fallback: "sea storm" }),
            createImage({ id: "1500534314209-a25ddb2bd429", label: "Coastal Light", fallback: "coastline" }),
            createImage({ id: "1544551763-77a2d1f5b107", label: "Deep Blue", fallback: "deep ocean" }),
        ],
        fusionImages: [
            createImage({ id: "1507525428034-b723cf961d3e", label: "Tidal Merge", fallback: "ocean abstract" }),
            createImage({ id: "1500534314209-a25ddb2bd429", label: "Sea Glass", fallback: "underwater light" }),
        ],
    },
    {
        id: "sunset",
        label: "Golden Hour",
        gradient: "from-orange-500 to-amber-500",
        modifier: {
            timeLimit: 58,
            scoreMultiplier: 1.1,
            hint: "Warm contrasts. Aim for poetic connections.",
        },
        keywords: ["sunset skyline", "golden hour", "warm glow", "desert dusk", "sunlit city"],
        assets: [
            createImage({ id: "1500530855697-b586d89ba3ee", label: "Golden Forest", fallback: "golden hour" }),
            createImage({ id: "1500534314209-a25ddb2bd429", label: "Amber Coast", fallback: "sunset coast" }),
            createImage({ id: "1501785888041-af3ef285b470", label: "Warm Peaks", fallback: "sunset mountains" }),
            createImage({ id: "1470770841072-f978cf4d019e", label: "Dusk Glow", fallback: "sunset skyline" }),
        ],
        fusionImages: [
            createImage({ id: "1501785888041-af3ef285b470", label: "Golden Blend", fallback: "sunset abstract" }),
            createImage({ id: "1500534314209-a25ddb2bd429", label: "Afterglow", fallback: "warm glow" }),
        ],
    },
    {
        id: "mystery",
        label: "Mystery Box",
        gradient: "from-violet-500 to-fuchsia-500",
        modifier: {
            timeLimit: 45,
            scoreMultiplier: 1.2,
            hint: "Unlock with 7-day streak! Random surprise connections.",
        },
        keywords: DEFAULT_KEYWORDS,
        assets: [
            createImage({ id: "1519681393784-d120267933ba", label: "???", fallback: "abstract" }),
            createImage({ id: "1469474968028-56623f02e42e", label: "???", fallback: "dreamscape" }),
            createImage({ id: "1549490349-8643362247b5", label: "???", fallback: "surreal" }),
            createImage({ id: "1500530855697-b586d89ba3ee", label: "???", fallback: "texture" }),
        ],
        fusionImages: DEFAULT_FUSIONS,
        unlockMilestone: "streak_7",
    },
];

export function getThemeById(themeId) {
    return THEMES.find((theme) => theme.id === themeId) || THEMES[0];
}

export function getThemeKeywords(theme) {
    if (!theme || !Array.isArray(theme.keywords) || theme.keywords.length === 0) {
        return DEFAULT_KEYWORDS;
    }

    return theme.keywords;
}

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function buildThemeAssets(theme, count = 2) {
    const seed = Date.now();
    const curated = Array.isArray(theme?.assets) && theme.assets.length > 0 ? theme.assets : null;
    if (curated) {
        const byUrl = new Map();
        for (const a of curated) {
            if (!byUrl.has(a.url)) byUrl.set(a.url, a);
        }
        const unique = [...byUrl.values()];
        const shuffled = shuffle(unique);
        const picked = shuffled.slice(0, count);
        return picked.map((asset, index) => ({
            ...asset,
            id: asset.id || `${theme?.id || "theme"}-${seed}-${index}`,
        }));
    }

    const keywords = shuffle(getThemeKeywords(theme));
    const chosen = keywords.slice(0, count);
    return chosen.map((keyword, index) => ({
        id: `${theme?.id || "theme"}-${seed}-${index}`,
        label: keyword,
        url: buildPicsumFallback(`${keyword}-${seed + index}`),
        fallbackUrl: buildPicsumFallback(keyword),
    }));
}

export function getFusionImage(theme) {
    const sources = Array.isArray(theme?.fusionImages) && theme.fusionImages.length > 0
        ? theme.fusionImages
        : DEFAULT_FUSIONS;
    const picked = sources[Math.floor(Math.random() * sources.length)];
    return {
        ...picked,
        id: picked.id || `${theme?.id || "fusion"}-${Date.now()}`,
    };
}

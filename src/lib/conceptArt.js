/**
 * Same-origin concept stills for round, reveal, and gallery.
 * Named frames (Sunday scaries, leftover sparkler, fusion) stay on their
 * Grok plates. Every other prompt maps to its own centered plate in
 * public/art/plates, and a round never gives both circles the same file
 * when the prompts differ.
 * Solo play needs no API key. Pexels and Giphy stay optional edge upgrades.
 */

export const IMG_WIDTH = 1080;

/** Exact attached frames. JPEG bytes, served from public/art/source. */
export const CONCEPT_ART_SOURCES = [
    'source/sunday-scaries.jpg',
    'source/leftover-sparkler.jpg',
    'source/fusion-scaries-sparkler.jpg',
];

/**
 * Centered stills for prompt families. Order is the deterministic catalog
 * for prompts that do not match a keyword: each label hashes into this list,
 * never into the shared Sunday/sparkler crops.
 */
export const CONCEPT_FAMILIES = [
    { id: 'kite', file: 'plates/concept-kite.jpg', keywords: ['kite'] },
    { id: 'deadline', file: 'plates/concept-deadline.jpg', keywords: ['deadline', 'monday', 'calendar', 'rent'] },
    { id: 'lighthouse', file: 'plates/concept-lighthouse.jpg', keywords: ['lighthouse', 'foghorn'] },
    { id: 'inbox', file: 'plates/concept-inbox.jpg', keywords: ['inbox', 'email', 'reply all'] },
    { id: 'coffee', file: 'plates/concept-coffee.jpg', keywords: ['coffee', 'cocoa'] },
    { id: 'robot', file: 'plates/concept-robot.jpg', keywords: ['robot', 'snooze'] },
    { id: 'ocean', file: 'plates/concept-ocean.jpg', keywords: ['ocean', 'tide pool', 'tide', 'sandcastle', 'message in a bottle', 'paper boat', 'wishing well', 'pool'] },
    { id: 'library', file: 'plates/concept-library.jpg', keywords: ['library', 'yearbook', 'comic'] },
    { id: 'campfire', file: 'plates/concept-campfire.jpg', keywords: ['campfire', 'camp fire'] },
    { id: 'wifi', file: 'plates/concept-wifi.jpg', keywords: ['wifi', 'wi fi', 'bluetooth'] },
    { id: 'subway', file: 'plates/concept-subway.jpg', keywords: ['subway', 'train', 'ferry', 'bus', 'bike chain', 'elevator', 'missed connection'] },
    { id: 'lullaby', file: 'plates/concept-lullaby.jpg', keywords: ['lullaby', 'music box', 'hold music', 'teddy'] },
    { id: 'umbrella', file: 'plates/concept-umbrella.jpg', keywords: ['umbrella'] },
    { id: 'chat', file: 'plates/concept-chat.jpg', keywords: ['group chat', 'chat', 'slack', 'ghosted', 'comment', 'typing', 'online now', 'text', 'gossip', 'rumor', 'confession', 'secret', 'dm', 'payphone', 'facetime', 'telephone', 'phone'] },
    { id: 'museum', file: 'plates/concept-museum.jpg', keywords: ['museum', 'movie theater', 'drive in', 'theater', 'gallery'] },
    { id: 'leftovers', file: 'plates/concept-leftovers.jpg', keywords: ['leftover', 'leftovers', 'vending', 'lunchbox', 'recipe', 'menu'] },
    { id: 'balloon', file: 'plates/concept-balloon.jpg', keywords: ['balloon', 'helium'] },
    { id: 'password', file: 'plates/concept-password.jpg', keywords: ['password', 'passcode', 'two factor', 'incognito', 'login', 'autofill', 'paywall', 'folder'] },
    { id: 'chess', file: 'plates/concept-chess.jpg', keywords: ['chess'] },
    { id: 'traffic', file: 'plates/concept-traffic.jpg', keywords: ['traffic', 'pothole', 'parking'] },
    { id: 'snowglobe', file: 'plates/concept-snowglobe.jpg', keywords: ['snow globe', 'snowglobe'] },
    { id: 'news', file: 'plates/concept-news.jpg', keywords: ['breaking news', 'news', 'ticker', 'headline', 'blackout', 'outage', 'meme'] },
    { id: 'vinyl', file: 'plates/concept-vinyl.jpg', keywords: ['vinyl', 'cassette', 'record', 'boombox', 'jukebox', 'mix tape', 'stereo'] },
    { id: 'playlist', file: 'plates/concept-playlist.jpg', keywords: ['playlist', 'podcast', 'for you', 'discover weekly', 'algorithm', 'radio', 'guitar', 'drum', 'album', 'stream'] },
    { id: 'garden', file: 'plates/concept-garden.jpg', keywords: ['office plant', 'garden', 'beehive', 'dandelion', 'spiderweb', 'hay', 'plant'] },
    { id: 'notification', file: 'plates/concept-notification.jpg', keywords: ['notification', 'server ping', 'low power', 'pager', 'battery', 'screenshot', 'cookie banner'] },
    { id: 'compass', file: 'plates/concept-compass.jpg', keywords: ['compass'] },
    { id: 'diner', file: 'plates/concept-diner.jpg', keywords: ['diner', 'motel'] },
    { id: 'spaceship', file: 'plates/concept-spaceship.jpg', keywords: ['spaceship', 'satellite'] },
    { id: 'moon', file: 'plates/concept-moon.jpg', keywords: ['supermoon', 'moon', 'eclipse'] },
    { id: 'key', file: 'plates/concept-key.jpg', keywords: ['key'] },
    { id: 'lantern', file: 'plates/concept-lantern.jpg', keywords: ['lantern', 'glowstick', 'flashlight', 'fireflies', 'firefly', 'nightlight', 'candle', 'streetlamp', 'glow worm', 'lamp'] },
    { id: 'map', file: 'plates/concept-map.jpg', keywords: ['road map', 'paper map', 'roadmap', 'gps', 'map'] },
    { id: 'firework', file: 'plates/concept-firework.jpg', keywords: ['firework', 'bottle rocket'] },
    { id: 'mirror', file: 'plates/concept-mirror.jpg', keywords: ['mirror', 'windshield', 'lipstick', 'soap'] },
    { id: 'voicemail', file: 'plates/concept-voicemail.jpg', keywords: ['voicemail', 'voice memo'] },
    { id: 'porch', file: 'plates/concept-porch.jpg', keywords: ['porch', 'rooftop', 'goodbye', 'swing'] },
    { id: 'jacket', file: 'plates/concept-jacket.jpg', keywords: ['jacket', 'hoodie', 'dress', 'glove', 'sock', 'quilt', 'laundromat'] },
    { id: 'letter', file: 'plates/concept-letter.jpg', keywords: ['typewriter', 'invitation', 'invite', 'apology', 'postcard', 'letter', 'crayon', 'lease', 'typo', 'therapy', 'receipt', 'nda', 'terms', 'draft', 'note'] },
    { id: 'rain', file: 'plates/concept-rain.jpg', keywords: ['thunder', 'rain', 'storm'] },
    { id: 'office', file: 'plates/concept-office.jpg', keywords: ['open plan office', 'slide deck', 'org chart', 'pitch deck', 'server room', 'status page', 'office', 'boardroom', 'webinar', 'zoom', 'spreadsheet', 'standup', 'meeting', 'layoff', 'reorg', 'promotion', 'bonus', 'raise', 'ipo', 'sprint', 'okr', 'kpi', 'admin', 'icloud', 'archive', 'cache', 'tabs', 'usb', 'qr'] },
    { id: 'heart', file: 'plates/concept-heart.jpg', keywords: ['heartbreak', 'breakup', 'heart', 'crush', 'kiss'] },
    { id: 'alarm', file: 'plates/concept-alarm.jpg', keywords: ['alarm', 'church bell', 'fire drill'] },
    { id: 'stars', file: 'plates/concept-stars.jpg', keywords: ['constellation', 'northern lights', 'shooting star', 'meteorite', 'meteor', 'comet', 'orion', 'telescope', 'observatory'] },
    { id: 'icecream', file: 'plates/concept-icecream.jpg', keywords: ['ice cream', 'popsicle', 'seltzer', 'lemonade', 'candy', 'whoopie', 'whoopee'] },
    { id: 'carnival', file: 'plates/concept-carnival.jpg', keywords: ['dance floor', 'roller rink', 'carousel', 'carnival', 'pinball', 'arcade', 'bowling', 'gutter ball', 'pinata', 'goldfish', 'bleachers', 'hayride', 'hopscotch', 'kazoo', 'karaoke', 'parade', 'choir', 'concert', 'skate'] },
    { id: 'snow', file: 'plates/concept-snow.jpg', keywords: ['snow day', 'snow', 'frost', 'glacier', 'ice rink'] },
];

/** Square crops for concept circles. Order is the deterministic catalog. */
export const CONCEPT_PLATES = [
    'plates/sunday-scaries-lamp.jpg',
    'plates/sunday-scaries-window.jpg',
    'plates/sunday-scaries-close.jpg',
    'plates/leftover-sparkler-hand.jpg',
    'plates/leftover-sparkler-flare.jpg',
    'plates/leftover-sparkler-room.jpg',
    ...CONCEPT_FAMILIES.map((family) => family.file),
];

/** Plates a round may use when the prompt is not one of the named Grok frames. */
export const DIVERSE_CONCEPT_PLATES = CONCEPT_FAMILIES.map((family) => family.file);

/** Square fusion stills for reveal and gallery cards. */
export const FUSION_PLATES = [
    'plates/fusion-scaries-sparkler.jpg',
    'plates/fusion-scaries-sparkler-wide.jpg',
];

const artCache = new Map();

function hashString(value) {
    let hash = 2166136261;
    const text = String(value || 'venn');
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function artBase() {
    const base = import.meta.env?.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
}

export function conceptArtUrl(file) {
    return `${artBase()}art/${file}`;
}

export function conceptArtSeed(labelOrKeyword, options = {}) {
    const categories = Array.isArray(options.categories) ? options.categories.join('.') : '';
    return [options.role, options.id, labelOrKeyword, categories, options.variant].filter(Boolean).join('|') || 'venn';
}

/** Captions that should show one specific still, not a random plate. */
const NAMED_CONCEPT_PLATES = {
    'sunday scaries': ['plates/sunday-scaries-lamp.jpg', 'plates/sunday-scaries-close.jpg'],
    'a leftover sparkler': ['plates/leftover-sparkler-hand.jpg', 'plates/leftover-sparkler-flare.jpg'],
};

function namedConceptPlates(label) {
    const value = String(label || '').toLowerCase();
    const exact = Object.keys(NAMED_CONCEPT_PLATES).find((key) => value.includes(key));
    if (exact) return NAMED_CONCEPT_PLATES[exact];
    const sunday = /sunday|scaries/.test(value);
    const sparkler = /sparkler/.test(value);
    if (sunday && !sparkler) {
        return [
            'plates/sunday-scaries-lamp.jpg',
            'plates/sunday-scaries-close.jpg',
            'plates/sunday-scaries-window.jpg',
        ];
    }
    if (sparkler && !sunday) {
        return [
            'plates/leftover-sparkler-hand.jpg',
            'plates/leftover-sparkler-flare.jpg',
            'plates/leftover-sparkler-room.jpg',
        ];
    }
    return null;
}

function normalizeLabel(value) {
    return ` ${String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()} `;
}

function labelHasKeyword(normalized, keyword) {
    const needle = ` ${keyword} `;
    return normalized.includes(needle) || normalized.includes(` ${keyword}s `);
}

function matchConceptFamily(label) {
    const normalized = normalizeLabel(label);
    let best = null;
    let score = 0;
    for (const family of CONCEPT_FAMILIES) {
        for (const keyword of family.keywords) {
            if (labelHasKeyword(normalized, keyword) && keyword.length > score) {
                score = keyword.length;
                best = family;
            }
        }
    }
    return best;
}

function plateFileFromReference(value) {
    if (!value) return '';
    const match = String(value).match(/plates\/[^/?#]+/);
    return match ? match[0] : '';
}

function pickFromPool(pool, startIndex, avoidFile) {
    const size = pool.length;
    const start = ((startIndex % size) + size) % size;
    if (!avoidFile) return pool[start];
    for (let step = 0; step < size; step += 1) {
        const candidate = pool[(start + step) % size];
        if (candidate !== avoidFile) return candidate;
    }
    return pool[start];
}

function plateFileForSeed(seed, options = {}) {
    if (options.role === 'fusion') {
        const pool = FUSION_PLATES;
        const start = options.variant ? 1 : 0;
        return pickFromPool(pool, start, plateFileFromReference(options.avoid));
    }
    const label = options.label || seed;
    const avoidFile = plateFileFromReference(options.avoid);
    const named = namedConceptPlates(label);
    if (named) {
        const start = options.variant && named.length > 1 ? 1 : 0;
        return pickFromPool(named, start, avoidFile);
    }
    const family = matchConceptFamily(label);
    if (family) {
        const start = DIVERSE_CONCEPT_PLATES.indexOf(family.file);
        return pickFromPool(
            DIVERSE_CONCEPT_PLATES,
            options.variant ? start + 1 : start,
            avoidFile,
        );
    }
    const hashSeed = conceptArtSeed(label, {
        id: options.id,
        role: options.role,
        categories: options.categories,
    });
    const start = hashString(hashSeed) % DIVERSE_CONCEPT_PLATES.length;
    return pickFromPool(
        DIVERSE_CONCEPT_PLATES,
        options.variant ? start + 1 : start,
        avoidFile,
    );
}

/**
 * Where the subject sits inside a square plate.
 * object-cover on a square is a no-op unless the face or sparkler is off center.
 */
export function conceptObjectPosition(url = '') {
    const value = String(url);
    if (value.includes('sunday-scaries-close')) return 'center 38%';
    if (value.includes('sunday-scaries')) return 'center 42%';
    if (value.includes('leftover-sparkler')) return 'center 58%';
    if (value.includes('fusion-scaries-sparkler')) return 'center 46%';
    if (value.includes('concept-')) return 'center';
    return 'center';
}

export function buildLocalConceptImage(labelOrKeyword, options = {}) {
    const seed = conceptArtSeed(labelOrKeyword, options);
    const avoidFile = plateFileFromReference(options.avoid);
    const cacheKey = avoidFile ? `${seed}@@${avoidFile}` : seed;
    const cached = artCache.get(cacheKey);
    if (cached) return cached;
    const url = conceptArtUrl(plateFileForSeed(seed, { ...options, label: options.label || labelOrKeyword }));
    artCache.set(cacheKey, url);
    return url;
}

/**
 * Two prompts in one round. Different wording never shares one plate file.
 */
export function conceptPlateUrlsForPair(leftLabel, rightLabel, options = {}) {
    const left = buildLocalConceptImage(leftLabel, {
        id: options.leftId,
        label: leftLabel,
        categories: options.categories,
    });
    const right = buildLocalConceptImage(rightLabel, {
        id: options.rightId,
        label: rightLabel,
        categories: options.categories,
        avoid: left,
    });
    return [left, right];
}

/**
 * If a round already assigned the same bundled plate to two different prompts,
 * move the right circle onto the next still.
 */
export function withDistinctConceptPlates(left, right) {
    if (!left || !right) return [left, right];
    const leftLabel = left.label || '';
    const rightLabel = right.label || '';
    if (!left.url || left.url !== right.url) return [left, right];
    if (!leftLabel || leftLabel === rightLabel) return [left, right];
    if (!isBundledConceptArtUrl(left.url)) return [left, right];
    const url = buildLocalConceptImage(rightLabel, {
        id: right.id,
        label: rightLabel,
        categories: right.categories,
        avoid: left.url,
    });
    if (!url || url === left.url) return [left, right];
    const fallback = buildLocalConceptImage(rightLabel, {
        id: right.id,
        label: rightLabel,
        categories: right.categories,
        variant: 'fallback',
        avoid: url,
    });
    return [left, {
        ...right,
        url,
        fallbackUrl: fallback && fallback !== url ? fallback : right.fallbackUrl,
    }];
}

/** @deprecated Use buildLocalConceptImage. Kept so existing imports stay valid. */
export function buildPicsumFallback(labelOrKeyword, options) {
    return buildLocalConceptImage(labelOrKeyword, options);
}

export function isBrittleImageUrl(url) {
    if (typeof url !== 'string' || !url) return false;
    const value = url.toLowerCase();
    return value.includes('images.unsplash.com')
        || value.includes('source.unsplash.com')
        || value.includes('picsum.photos');
}

export function isPexelsPhotoUrl(url) {
    return typeof url === 'string'
        && url.includes('images.pexels.com')
        && !url.includes('/videos/');
}

export function isBundledConceptArtUrl(url) {
    return typeof url === 'string' && url.includes('/art/');
}

function isSvgPlaceholder(url) {
    return typeof url === 'string' && url.startsWith('data:image/svg+xml');
}

/** Missing, hotlinked, or flat SVG placeholders. Real photos and uploads stay. */
export function isPlaceholderArtUrl(url) {
    return !url || isBrittleImageUrl(url) || isSvgPlaceholder(url);
}

/**
 * Replace missing, hotlinked, or SVG placeholder art with bundled stills.
 * Leaves Pexels, Giphy, user uploads, and same-origin files untouched.
 */
function shouldUseBundledStill(url, options, seed) {
    if (!(isPlaceholderArtUrl(url) || isBundledConceptArtUrl(url))) return false;
    if (options.role === 'fusion') return true;
    return Boolean(namedConceptPlates(options.label || seed));
}

export function reliableImageUrl(url, seed = 'venn', options = {}) {
    if (shouldUseBundledStill(url, options, seed)) {
        return buildLocalConceptImage(options.label || seed, { ...options, label: options.label || seed });
    }
    if (isPlaceholderArtUrl(url)) {
        return buildLocalConceptImage(seed, options);
    }
    return url;
}

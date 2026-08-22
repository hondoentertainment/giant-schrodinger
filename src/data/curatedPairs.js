/**
 * Hand-picked concept pairs for first rounds and the daily ritual.
 * Images still come from the active theme; these labels are the prompts.
 */
export const CURATED_PAIRS = [
    { id: 'coffee-robot', left: 'Morning coffee', right: 'A robot hitting snooze' },
    { id: 'ocean-library', left: 'The deep ocean', right: 'A midnight library' },
    { id: 'kite-deadline', left: 'A tangled kite', right: 'A Monday deadline' },
    { id: 'lighthouse-inbox', left: 'A lonely lighthouse', right: 'An overflowing inbox' },
    { id: 'campfire-wifi', left: 'A dying campfire', right: 'One bar of wifi' },
    { id: 'subway-lullaby', left: 'A packed subway', right: 'A childhood lullaby' },
    { id: 'umbrella-secret', left: 'A broken umbrella', right: 'A group chat secret' },
    { id: 'museum-leftovers', left: 'A quiet museum', right: 'Last night\'s leftovers' },
    { id: 'balloon-password', left: 'A helium balloon', right: 'A forgotten password' },
    { id: 'chess-traffic', left: 'A chess clock', right: 'Rush-hour traffic' },
    { id: 'snowglobe-news', left: 'A snow globe', right: 'Breaking news' },
    { id: 'vinyl-algorithm', left: 'A scratched vinyl', right: 'A recommendation algorithm' },
    { id: 'garden-notification', left: 'An overgrown garden', right: 'A silenced notification' },
    { id: 'compass-playlist', left: 'A rusty compass', right: 'A shuffled playlist' },
    { id: 'diner-spaceship', left: 'A 24-hour diner', right: 'A stalled spaceship' },
    { id: 'mirror-caption', left: 'A fogged bathroom mirror', right: 'A caption you almost posted' },
    { id: 'firework-voicemail', left: 'The last firework', right: 'An unplayed voicemail' },
    { id: 'bridge-apology', left: 'A rickety bridge', right: 'A half-written apology' },
    { id: 'telescope-gossip', left: 'A backyard telescope', right: 'Neighborhood gossip' },
    { id: 'typewriter-autofill', left: 'A jammed typewriter', right: 'Phone autofill' },
    { id: 'ferry-friday', left: 'An empty ferry', right: 'Sunday-night dread' },
    { id: 'lantern-battery', left: 'A paper lantern', right: 'A 2% battery' },
    { id: 'map-memory', left: 'A folded road map', right: 'A childhood nickname' },
    { id: 'thunder-groupchat', left: 'Distant thunder', right: 'A group chat going quiet' },
    { id: 'carousel-standup', left: 'A carnival carousel', right: 'A standup meeting' },
    { id: 'postcard-screenshot', left: 'An unsent postcard', right: 'A screenshot you kept' },
    { id: 'beehive-office', left: 'A beehive', right: 'An open-plan office' },
    { id: 'icecream-heartbreak', left: 'Melting ice cream', right: 'A polite heartbreak' },
    { id: 'key-invitation', left: 'A spare house key', right: 'An invitation you ignored' },
    { id: 'fog-password2', left: 'Morning fog', right: 'Incognito mode' },
    { id: 'drum-heartbeat', left: 'A marching drum', right: 'A resting heartbeat' },
    { id: 'origami-spreadsheet', left: 'A failed origami crane', right: 'A color-coded spreadsheet' },
    { id: 'moon-streetlamp', left: 'A full moon', right: 'A buzzing streetlamp' },
    { id: 'recipe-rumor', left: 'A family recipe', right: 'A rumor with no source' },
    { id: 'suitcase-tab', left: 'An overstuffed suitcase', right: 'Forty open tabs' },
    { id: 'echo-readreceipt', left: 'A canyon echo', right: 'A read receipt' },
];

export function getCuratedPairForSeed(seed = 0) {
    const index = Math.abs(Math.floor(Number(seed) || 0)) % CURATED_PAIRS.length;
    return CURATED_PAIRS[index];
}

export function getCuratedPairById(id) {
    return CURATED_PAIRS.find((pair) => pair.id === id) || null;
}

/**
 * Hand-picked concept pairs for first rounds and the daily ritual.
 * Images still come from the active theme; these labels are the prompts.
 * vibe: tender | spicy | workplace | cosmic | nostalgic | chaotic
 */
const RAW = [
    ['coffee-robot', 'Morning coffee', 'A robot hitting snooze', 'chaotic'],
    ['ocean-library', 'The deep ocean', 'A midnight library', 'tender'],
    ['kite-deadline', 'A tangled kite', 'A Monday deadline', 'workplace'],
    ['lighthouse-inbox', 'A lonely lighthouse', 'An overflowing inbox', 'workplace'],
    ['campfire-wifi', 'A dying campfire', 'One bar of wifi', 'nostalgic'],
    ['subway-lullaby', 'A packed subway', 'A childhood lullaby', 'tender'],
    ['umbrella-secret', 'A broken umbrella', 'A group chat secret', 'spicy'],
    ['museum-leftovers', 'A quiet museum', 'Last night\'s leftovers', 'chaotic'],
    ['balloon-password', 'A helium balloon', 'A forgotten password', 'chaotic'],
    ['chess-traffic', 'A chess clock', 'Rush-hour traffic', 'workplace'],
    ['snowglobe-news', 'A snow globe', 'Breaking news', 'chaotic'],
    ['vinyl-algorithm', 'A scratched vinyl', 'A recommendation algorithm', 'nostalgic'],
    ['garden-notification', 'An overgrown garden', 'A silenced notification', 'tender'],
    ['compass-playlist', 'A rusty compass', 'A shuffled playlist', 'nostalgic'],
    ['diner-spaceship', 'A 24-hour diner', 'A stalled spaceship', 'cosmic'],
    ['mirror-caption', 'A fogged bathroom mirror', 'A caption you almost posted', 'spicy'],
    ['firework-voicemail', 'The last firework', 'An unplayed voicemail', 'tender'],
    ['bridge-apology', 'A rickety bridge', 'A half-written apology', 'tender'],
    ['telescope-gossip', 'A backyard telescope', 'Neighborhood gossip', 'spicy'],
    ['typewriter-autofill', 'A jammed typewriter', 'Phone autofill', 'workplace'],
    ['ferry-friday', 'An empty ferry', 'Sunday-night dread', 'tender'],
    ['lantern-battery', 'A paper lantern', 'A 2% battery', 'chaotic'],
    ['map-memory', 'A folded road map', 'A childhood nickname', 'nostalgic'],
    ['thunder-groupchat', 'Distant thunder', 'A group chat going quiet', 'spicy'],
    ['carousel-standup', 'A carnival carousel', 'A standup meeting', 'workplace'],
    ['postcard-screenshot', 'An unsent postcard', 'A screenshot you kept', 'tender'],
    ['beehive-office', 'A beehive', 'An open-plan office', 'workplace'],
    ['icecream-heartbreak', 'Melting ice cream', 'A polite heartbreak', 'tender'],
    ['key-invitation', 'A spare house key', 'An invitation you ignored', 'spicy'],
    ['fog-password2', 'A fogged windshield', 'Incognito mode', 'spicy'],
    ['drum-heartbeat', 'A marching drum', 'A resting heartbeat', 'tender'],
    ['origami-spreadsheet', 'A failed origami crane', 'A color-coded spreadsheet', 'workplace'],
    ['moon-streetlamp', 'A full moon', 'A buzzing streetlamp', 'cosmic'],
    ['recipe-rumor', 'A family recipe', 'A rumor with no source', 'nostalgic'],
    ['suitcase-tab', 'An overstuffed suitcase', 'Forty open tabs', 'chaotic'],
    ['echo-readreceipt', 'A canyon echo', 'A read receipt', 'spicy'],
    ['porch-zoom', 'A creaky porch swing', 'A muted Zoom call', 'workplace'],
    [' thrift-nft', 'A thrift-store jacket', 'An expired NFT', 'chaotic'],
    ['lullaby-alarm', 'A music-box lullaby', 'A 5 a.m. alarm', 'chaotic'],
    ['soap-confession', 'Hotel soap', 'A 2 a.m. confession', 'spicy'],
    ['glacier-deadline2', 'A melting glacier', 'A sliding deadline', 'workplace'],
    ['arcade-401k', 'A dying arcade cabinet', 'A 401(k) login', 'nostalgic'],
    ['pigeon-influencer', 'A city pigeon', 'An influencer brand deal', 'chaotic'],
    ['attict-cloud', 'A dusty attic box', 'A full iCloud', 'nostalgic'],
    ['train-whistle-slack', 'A midnight train whistle', 'A Slack huddle', 'workplace'],
    ['candle-loading', 'A birthday candle', 'An infinite loading spinner', 'chaotic'],
    ['first-snow-email', 'The first snow day', 'An email marked URGENT', 'workplace'],
    ['diner-booth-dating', 'A sticky diner booth', 'A dating-app bio', 'spicy'],
    ['library-fine-rent', 'An overdue library book', 'This month\'s rent', 'chaotic'],
    ['kite-string-thread', 'A snapped guitar string', 'A group-chat thread', 'chaotic'],
    ['lighthouse-keep', 'A lighthouse keeper', 'A group admin', 'workplace'],
    ['camp-song-hold', 'A campfire song', 'Please hold music', 'nostalgic'],
    ['pool-float-layoff', 'A plastic pool float', 'A quiet layoff', 'workplace'],
    ['fortune-cookie-terms', 'A fortune cookie', 'Terms and conditions', 'chaotic'],
    ['payphone-ghost', 'A payphone that still rings', 'A ghosted text', 'tender'],
    ['skate-park-boardroom', 'An empty skate park', 'A glass boardroom', 'workplace'],
    ['laundry-secret', 'A laundromat at 11 p.m.', 'A secret you almost told', 'spicy'],
    ['comet-push', 'A passing comet', 'A push notification', 'cosmic'],
    ['yard-sale-algorithm', 'A yard-sale lamp', 'A For You page', 'nostalgic'],
    ['choir-karaoke', 'A church choir', 'Drunk karaoke', 'chaotic'],
    ['vending-heart', 'A jammed vending machine', 'A heart on delivered', 'spicy'],
    ['ferry-horn-calendar', 'A ferry horn', 'A shared calendar invite', 'workplace'],
    ['teddy-password', 'A childhood teddy bear', 'A password hint', 'nostalgic'],
    ['eclipse-outage', 'A solar eclipse', 'A city-wide outage', 'cosmic'],
    [' thrift-polaroid', 'A thrifted Polaroid', 'A locked notes app', 'tender'],
    ['rain-gutter-podcast', 'Rain in the gutters', 'A true-crime podcast', 'chaotic'],
    ['bleachers-slack', 'Empty bleachers', 'An after-hours Slack', 'workplace'],
    ['lipstick-voicemail', 'A smudged lipstick', 'A voicemail you saved', 'spicy'],
    ['paper-boat-stock', 'A paper boat', 'A crashing stock ticker', 'chaotic'],
    ['quilt-wifi', 'A handmade quilt', 'Public wifi terms', 'nostalgic'],
    ['meteor-dm', 'A meteor shower', 'An unsolicited DM', 'spicy'],
    ['toolbox-therapy', 'A rusted toolbox', 'A therapy intake form', 'tender'],
    ['parade-standup2', 'A rained-out parade', 'A stand-up that dies', 'chaotic'],
    ['milk-crate-cloud', 'A milk-crate stereo', 'A cloud playlist', 'nostalgic'],
    ['fire-escape-deadline', 'A fire escape', 'A hard deadline', 'workplace'],
    ['dandelion-cache', 'A dandelion wish', 'A cleared cache', 'tender'],
    ['bowling-okr', 'A gutter ball', 'A missed OKR', 'workplace'],
    ['drive-in-stream', 'A drive-in movie', 'A buffering stream', 'nostalgic'],
    ['tattoo-typo', 'A fresh tattoo', 'A public typo', 'spicy'],
    ['hay-loft-server', 'A hay loft', 'A humming server room', 'cosmic'],
    ['popsicle-nda', 'A melting popsicle', 'An NDA', 'workplace'],
    ['bus-transfer-heart', 'A bus transfer ticket', 'A second-chance text', 'tender'],
    ['carousel-horse-ai', 'A wooden carousel horse', 'A chatbot apology', 'chaotic'],
    ['storm-cellar-inbox', 'A storm cellar', 'An archive folder', 'workplace'],
    ['glowstick-memory', 'A dead glowstick', 'A core memory', 'nostalgic'],
    ['rooftop-readreceipt', 'A rooftop at 1 a.m.', 'Seen at 1:02', 'spicy'],
    ['tin-can-phone', 'A tin-can telephone', 'A dropped FaceTime', 'nostalgic'],
    ['sandcastle-sprint', 'A sandcastle', 'A two-week sprint', 'workplace'],
    ['owl-nightshift', 'A barn owl', 'A night-shift nurse', 'tender'],
    ['pinball-credit', 'A pinball tilt', 'A credit-score dip', 'chaotic'],
    ['window-seat-layover', 'A window-seat sunset', 'A missed connection', 'tender'],
    ['jukebox-algorithm2', 'A diner jukebox', 'A Discover Weekly', 'nostalgic'],
    ['spiderweb-orgchart', 'A spiderweb', 'An org chart', 'workplace'],
    ['camp-letter-leave', 'A summer-camp letter', 'A leave of absence', 'tender'],
    ['neon-motel-otp', 'A neon motel sign', 'A one-time passcode', 'spicy'],
    ['ice-rink-deadline', 'A midnight ice rink', 'A frozen ticket', 'workplace'],
    ['paper-plane-pitch', 'A paper airplane', 'A pitch deck', 'workplace'],
    ['firefly-lowpower', 'A jar of fireflies', 'Low Power Mode', 'cosmic'],
    ['lost-glove-ex', 'A lost winter glove', 'An ex\'s hoodie', 'tender'],
    ['roller-rink-kpi', 'A roller rink', 'A quarterly KPI', 'chaotic'],
    ['church-bell-alarm2', 'A church bell', 'A recurring alarm', 'nostalgic'],
    ['tide-pool-comment', 'A tide pool', 'A comment you deleted', 'spicy'],
    ['toolbox-radio', 'A crackling radio', 'A status page', 'workplace'],
    ['lemonade-stand-ipo', 'A lemonade stand', 'An IPO roadshow', 'chaotic'],
    ['sleepover-secret2', 'A sleepover secret', 'A locked folder', 'spicy'],
    ['harvest-moon-pager', 'A harvest moon', 'An on-call pager', 'cosmic'],
    ['bike-chain-thread', 'A slipped bike chain', 'A group-chat spiral', 'chaotic'],
    ['grandma-candy-cookie', 'Grandma\'s candy dish', 'A cookie banner', 'nostalgic'],
    ['loading-dock-heart', 'A loading dock at dawn', 'A heart you never sent', 'tender'],
    ['whoopee-standup', 'A whoopee cushion', 'An all-hands meeting', 'workplace'],
    ['constellation-wifi', 'A backyard constellation', 'A neighbor\'s wifi name', 'cosmic'],
    [' thrift-yearbook', 'A thrifted yearbook', 'A tagged photo', 'nostalgic'],
    ['pothole-roadmap', 'A city pothole', 'A product roadmap', 'workplace'],
    ['first-kiss-draft', 'A first-kiss memory', 'An unsent draft', 'spicy'],
    ['snow-day-outage', 'A snow day', 'A regional outage', 'chaotic'],
    ['porch-light-online', 'A porch light left on', 'Online now', 'tender'],
    ['kazoo-webinar', 'A kazoo solo', 'A mandatory webinar', 'workplace'],
    ['meteorite-usb', 'A pocket meteorite', 'A mystery USB', 'cosmic'],
    ['comic-book-terms', 'A rain-warped comic', 'Updated privacy terms', 'nostalgic'],
    ['empty-swing-calendar', 'An empty swing set', 'A cancelled 1:1', 'tender'],
    ['ketchup-packet-raise', 'A leftover ketchup packet', 'A raise you didn\'t ask for', 'workplace'],
    ['boombox-bluetooth', 'A shoulder boombox', 'A Bluetooth fail', 'nostalgic'],
    ['secret-handshake-2fa', 'A secret handshake', 'Two-factor authentication', 'chaotic'],
    ['lantern-fish-night', 'A lantern fish', 'A 3 a.m. thought', 'cosmic'],
    ['chalk-hopscotch-okr', 'Chalk hopscotch', 'A stretch goal', 'workplace'],
    ['mix-tape-cloud', 'A mix tape', 'A shared album', 'nostalgic'],
    ['broken-elevator-silence', 'A stuck elevator', 'An awkward silence', 'spicy'],
    ['paper-crown-promo', 'A paper birthday crown', 'A surprise promotion', 'workplace'],
    ['tide-moon-rent', 'An incoming tide', 'Rent due Friday', 'chaotic'],
    ['treehouse-password', 'A childhood treehouse', 'A password you still use', 'nostalgic'],
    ['seltzer-heartbreak', 'A warm seltzer', 'A soft launch breakup', 'spicy'],
    ['foghorn-standup', 'A foghorn', 'A daily standup that runs long', 'workplace'],
    ['shooting-star-ad', 'A shooting star', 'A mid-roll ad', 'cosmic'],
    ['lost-and-found-drafts', 'A lost-and-found box', 'Your drafts folder', 'tender'],
    ['rubber-chicken-board', 'A rubber chicken', 'A board update', 'chaotic'],
    ['window-frost-zoom', 'Frost on the window', 'A camera-off meeting', 'workplace'],
    ['carnival-goldfish-stock', 'A carnival goldfish', 'A meme stock', 'chaotic'],
    ['lullaby-hold2', 'A hummed lullaby', 'Estimated wait: 47 minutes', 'tender'],
    ['picnic-ants-pings', 'Picnic ants', 'Weekend Slack pings', 'workplace'],
    ['observatory-groupchat', 'A locked observatory', 'A dying group chat', 'cosmic'],
    [' thrift-prom', 'A thrifted prom dress', 'A reunion invite', 'nostalgic'],
    ['parking-ticket-karma', 'A parking ticket', 'Instant karma', 'chaotic'],
    ['front-step-goodbye', 'A front-step goodbye', 'A last-seen timestamp', 'tender'],
    ['whoopie-pie-bonus', 'A leftover whoopie pie', 'An unexpected bonus', 'workplace'],
    ['northern-lights-buffer', 'Northern lights', 'A spinning buffer wheel', 'cosmic'],
    ['comic-panel-receipt', 'A torn comic panel', 'A grocery receipt poem', 'nostalgic'],
    ['empty-dancefloor-zoom', 'An empty dance floor', 'A birthday Zoom', 'tender'],
    ['sticky-note-resignation', 'A sticky-note reminder', 'A resignation letter', 'workplace'],
    ['bottle-message-dm', 'A message in a bottle', 'A disappearing DM', 'spicy'],
    ['lawn-flamingo-outage', 'A plastic lawn flamingo', 'A CDN outage', 'chaotic'],
    ['camp-flashlight-battery', 'A camp flashlight', 'A dying phone battery', 'nostalgic'],
    ['train-platform-almost', 'A train you almost catch', 'A text you almost send', 'tender'],
    ['office-plant-layoff', 'A neglected office plant', 'A reorg rumor', 'workplace'],
    ['supermoon-screenshot', 'A supermoon', 'A screenshot you regret', 'spicy'],
    ['pinata-roadmap', 'A stubborn piñata', 'A locked roadmap', 'workplace'],
    ['record-skip-memory', 'A skipping record', 'A memory that loops', 'nostalgic'],
    ['hot-cocoa-outage', 'Hot cocoa on the stoop', 'A neighborhood blackout', 'tender'],
    ['whoopee-email', 'A whoopee cushion', 'Reply all', 'chaotic'],
    ['satellite-voicemail', 'A lost satellite', 'A full voicemail box', 'cosmic'],
    ['crayon-portrait-id', 'A crayon self-portrait', 'A passport photo', 'nostalgic'],
    ['empty-bleacher-heart', 'The last person in the bleachers', 'A heart you left on read', 'tender'],
    ['coffee-ring-contract', 'A coffee-ring contract', 'A handshake deal', 'workplace'],
    ['sparkler-notification', 'A dying sparkler', 'A breaking-news banner', 'chaotic'],
    ['wishing-well-search', 'A wishing well', 'A search history', 'spicy'],
    ['hayride-standdown', 'A hayride', 'An incident stand-down', 'workplace'],
    ['glow-worm-nightlight', 'A glow-worm cave', 'A hallway nightlight', 'cosmic'],
    ['lunchbox-note-slack', 'A lunchbox love note', 'A public Slack kudos', 'tender'],
    ['whoopee-pie-sprint', 'A bakery whoopie pie', 'A sprint review', 'workplace'],
    ['paper-map-gps', 'A paper map in the rain', 'A GPS that lies', 'chaotic'],
    ['first-apartment-key', 'A first-apartment key', 'A forwarded lease', 'nostalgic'],
    ['rooftop-pigeon-ipo', 'A rooftop pigeon', 'A delayed IPO', 'chaotic'],
    ['lullaby-box-hold', 'A broken music box', 'Your call is important', 'tender'],
    ['constellation-org', 'Orion\'s belt', 'A leadership offsite', 'cosmic'],
    [' thrift-cassette', 'A thrifted cassette', 'A voice memo you keep', 'nostalgic'],
    ['fire-drill-reorg', 'A fire drill', 'A surprise reorg', 'workplace'],
    ['snowglobe-groupchat', 'A shaken snow globe', 'A group chat exploding', 'chaotic'],
    ['porch-swing-seen', 'A porch swing at dusk', 'Last seen yesterday', 'tender'],
    ['rubber-stamp-viral', 'A rubber stamp', 'A post that went too far', 'spicy'],
    ['comet-tail-wifi', 'A comet tail', 'A cafe wifi splash page', 'cosmic'],
    ['cookie-tin-archive', 'A sewing-cookie tin', 'A zip archive named final_final', 'nostalgic'],
    ['empty-theater-webinar', 'An empty movie theater', 'A webinar of twelve', 'workplace'],
    ['bottle-rocket-alert', 'A bottle rocket', 'A severe-weather alert', 'chaotic'],
    ['handwritten-menu-qr', 'A handwritten menu', 'A broken QR code', 'nostalgic'],
    ['late-bus-almost-love', 'The last night bus', 'A crush you never asked', 'tender'],
    ['sticky-floor-bonus', 'A sticky concert floor', 'A spot bonus', 'chaotic'],
    ['eclipse-glasses-paywall', 'Eclipse glasses', 'A paywall', 'cosmic'],
    ['paper-fortune-okrs', 'A paper fortune teller', 'Next quarter\'s OKRs', 'workplace'],
    ['lost-sock-ex', 'A dryer-lost sock', 'A hoodie that isn\'t yours', 'spicy'],
    ['camp-bug-juice-stand', 'Camp bug juice', 'An energy-drink standup', 'chaotic'],
    ['lighthouse-beam-ping', 'A lighthouse beam', 'A server ping', 'cosmic'],
    ['first-snow-day-off', 'A snow-day radio list', 'A calendar marked OOO', 'nostalgic'],
    ['empty-diner-seen', 'The last booth in a diner', 'Typing… then nothing', 'spicy'],
    ['sunday-scaries-sparkler', 'Sunday scaries', 'A leftover sparkler', 'chaotic'],
    ['voicemail-constellation', 'An unplayed voicemail', 'A new constellation', 'cosmic'],
    ['office-plant-first-date', 'A neglected office plant', 'A first-date playlist', 'spicy'],
    ['thrift-jacket-okrs', 'A thrift-store jacket', 'A slide deck of OKRs', 'workplace'],
    ['porch-light-groupchat', 'A porch light left on', 'A group chat going silent', 'tender'],
    ['cassette-for-you', 'A warped cassette', 'Your For You page', 'nostalgic'],
    ['rain-delay-apology', 'A rain delay', 'A typed-then-deleted apology', 'tender'],
];

const WEEKLY_EPISODES = [
    {
        title: 'Week of leftover sparklers',
        ids: [
            'sunday-scaries-sparkler',
            'voicemail-constellation',
            'office-plant-first-date',
            'thrift-jacket-okrs',
            'porch-light-groupchat',
            'cassette-for-you',
            'rain-delay-apology',
        ],
    },
    {
        title: 'Week of Monday deadlines',
        ids: ['coffee-robot', 'ocean-library', 'kite-deadline', 'lighthouse-inbox', 'campfire-wifi', 'subway-lullaby', 'umbrella-secret'],
    },
    {
        title: 'Week of forgotten passwords',
        ids: ['museum-leftovers', 'balloon-password', 'chess-traffic', 'snowglobe-news', 'vinyl-algorithm', 'garden-notification', 'compass-playlist'],
    },
];

export const CURATED_PAIRS = RAW.map(([id, left, right, vibe]) => ({
    id: id.trim(),
    left,
    right,
    vibe,
}));

export function getCuratedPairForSeed(seed = 0) {
    const index = Math.abs(Math.floor(Number(seed) || 0)) % CURATED_PAIRS.length;
    return CURATED_PAIRS[index];
}

export function getCuratedPairById(id) {
    return CURATED_PAIRS.find((pair) => pair.id === id) || null;
}

export function getPairVibe(pair) {
    return pair?.vibe || 'classic';
}

export function getIsoWeekNumber(date = new Date()) {
    const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
}

export function getWeeklyEpisode(date = new Date()) {
    const episode = WEEKLY_EPISODES[getIsoWeekNumber(date) % WEEKLY_EPISODES.length] || WEEKLY_EPISODES[0];
    return {
        title: episode.title,
        pairs: episode.ids.map((id) => getCuratedPairById(id)).filter(Boolean),
    };
}

export function getWeeklyPairDrop(date = new Date()) {
    return getWeeklyEpisode(date).pairs;
}

export function getDailyEditorialPair(date = new Date()) {
    const drop = getWeeklyPairDrop(date);
    return drop[date.getDay()] || getCuratedPairForSeed(
        date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate()
    );
}

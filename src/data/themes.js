import { getSupplementalConcepts } from '../services/conceptGenerator';

const DEFAULT_KEYWORDS = ["abstract art", "texture", "colorful pattern", "surreal", "dreamscape"];

const IMG_WIDTH = 1080;

// ── Media type constants ──
export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
};

export function buildUnsplashUrl(id, width = 1080) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

function buildPicsumFallback(labelOrKeyword) {
    const slug = String(labelOrKeyword || 'placeholder').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://picsum.photos/seed/${slug || 'venn'}/${IMG_WIDTH}/${IMG_WIDTH}`;
}

function createImage({ id, label, fallback, categories = [] }) {
    return {
        id,
        label,
        type: MEDIA_TYPES.IMAGE,
        url: buildUnsplashUrl(id),
        fallbackUrl: buildPicsumFallback(fallback || label),
        categories,
    };
}

function createVideo({ id, label, url, fallbackUrl, posterUrl }) {
    return {
        id,
        label,
        type: MEDIA_TYPES.VIDEO,
        url,
        fallbackUrl: fallbackUrl || url,
        posterUrl: posterUrl || '',
    };
}

function createAudio({ id, label, url, fallbackUrl, coverUrl, coverFallbackUrl }) {
    return {
        id,
        label,
        type: MEDIA_TYPES.AUDIO,
        url,
        fallbackUrl: fallbackUrl || url,
        coverUrl: coverUrl || '',
        coverFallbackUrl: coverFallbackUrl || '',
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
            // People & nightlife
            createImage({ id: "1516450360452-9258136e97a1", label: "The Girl Who Never Stopped Dancing", fallback: "nightclub dancing", categories: ['human', 'music', 'emotion'] }),
            createImage({ id: "1492684223066-81342ee5ff30", label: "Sidewalk Serenade at 2AM", fallback: "street performer night", categories: ['human', 'music', 'urban'] }),
            createImage({ id: "1571266028243-3716f02d3f50", label: "Spray Can Confessions", fallback: "graffiti artist", categories: ['art', 'urban', 'human'] }),
            createImage({ id: "1551818255-6b0f0d59b3e6", label: "The Heartbeat Behind the Decks", fallback: "dj neon", categories: ['music', 'technology', 'human'] }),
            createImage({ id: "1582719508461-905c673c1ae0", label: "A Thousand Flavors After Dark", fallback: "night market crowd", categories: ['urban', 'human', 'nostalgia'] }),
            // Viral city vibes
            createImage({ id: "1555680202-c86f0e12f086", label: "The Alley That Glows Back", fallback: "neon city", categories: ['urban', 'art', 'emotion'] }),
            createImage({ id: "1563089145-599997674d42", label: "Tokyo's Electric Dreams", fallback: "neon signs", categories: ['urban', 'technology', 'art'] }),
            createImage({ id: "1514565131-fce0801e5785", label: "3AM Taxi Ride Through Shinjuku", fallback: "tokyo neon", categories: ['urban', 'adventure', 'nostalgia'] }),
            createImage({ id: "1533174072545-7a4b6ad7a6c3", label: "Ten Thousand Strangers Singing Along", fallback: "concert crowd", categories: ['music', 'human', 'emotion'] }),
            createImage({ id: "1470225620780-dba8ba36b745", label: "When the Bass Drops at Dawn", fallback: "rave party", categories: ['music', 'emotion', 'abstract'] }),
            createImage({ id: "1504893524553-b855bce32c67", label: "Neon Tears on the Windshield", fallback: "city rain night", categories: ['urban', 'emotion', 'water'] }),
            createImage({ id: "1557683316-973673baf926", label: "The Last Umbrella on the Block", fallback: "umbrella rain neon", categories: ['urban', 'human', 'emotion'] }),
            // New images
            createImage({ id: "1558618666-fcd25c85f1d7", label: "Midnight Arcade Fever", fallback: "arcade", categories: ['nostalgia', 'technology', 'urban'] }),
            createImage({ id: "1517999144091-3d9dca6d1e43", label: "Rooftop Secrets in Pink Light", fallback: "rooftop neon", categories: ['urban', 'emotion', 'human'] }),
            createImage({ id: "1542038784456-1ea8df5aa738", label: "The Subway That Never Sleeps", fallback: "subway neon", categories: ['urban', 'adventure', 'nostalgia'] }),
            createImage({ id: "1519389950473-47ba0277781c", label: "Flickering Promises on a Marquee", fallback: "theater marquee", categories: ['art', 'nostalgia', 'urban'] }),
            createImage({ id: "1506792006437-256b665541e2", label: "Puddle Reflecting a Parallel City", fallback: "rain puddle neon", categories: ['urban', 'abstract', 'water'] }),
            createImage({ id: "1521412644187-c49fa049e84d", label: "A Vending Machine's Lonely Glow", fallback: "vending machine", categories: ['technology', 'nostalgia', 'urban'] }),
            createImage({ id: "1531747118685-64e4e3893e04", label: "Crossed Wires and Crossed Hearts", fallback: "electric wires night", categories: ['technology', 'emotion', 'urban'] }),
            createImage({ id: "1579546929518-9e396f3cc509", label: "Chinatown's Whispering Lanterns", fallback: "chinatown lanterns", categories: ['urban', 'nostalgia', 'art'] }),
            createImage({ id: "1548345680-f5475ea5b5ed", label: "Smoke and Strobe Confessions", fallback: "smoke neon", categories: ['abstract', 'music', 'emotion'] }),
            createImage({ id: "1504703395950-b89145a5425b", label: "The Bridge Between Midnight and Dawn", fallback: "bridge night city", categories: ['urban', 'adventure', 'emotion'] }),
            createImage({ id: "1520045892732-304bc3ac77d4", label: "Taxi Cab Oracle", fallback: "taxi night", categories: ['urban', 'human', 'nostalgia'] }),
            createImage({ id: "1465847899084-d164df4dedc6", label: "Electric Veins of the City", fallback: "city lights aerial", categories: ['urban', 'technology', 'abstract'] }),
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
            // People in nature
            createImage({ id: "1551632811-561732d1e306", label: "Standing on the Edge of Everything", fallback: "hiker cliff", categories: ['adventure', 'human', 'nature'] }),
            createImage({ id: "1486915309851-b0cc1f8a0084", label: "Where the River Decides Your Path", fallback: "kayak nature", categories: ['adventure', 'water', 'nature'] }),
            createImage({ id: "1544735716-ea9ef790f501", label: "Gravity's Day Off", fallback: "hammock forest", categories: ['human', 'nature', 'emotion'] }),
            createImage({ id: "1502680390548-bca8fcc47c11", label: "Sparks Telling Stories to the Stars", fallback: "campfire friends", categories: ['human', 'nature', 'nostalgia'] }),
            createImage({ id: "1522163182402-834f871fd851", label: "Chasing the Horizon on Foot", fallback: "trail runner", categories: ['adventure', 'human', 'nature'] }),
            // Stunning nature
            createImage({ id: "1433086966358-54859d0ed716", label: "Where Gravity Learns to Sing", fallback: "waterfall", categories: ['nature', 'water', 'emotion'] }),
            createImage({ id: "1540206395-68808572332f", label: "The Sky's Secret Light Show", fallback: "northern lights", categories: ['nature', 'space', 'abstract'] }),
            createImage({ id: "1472396961693-142e6e269027", label: "Morning's First Witness", fallback: "deer meadow", categories: ['animal', 'nature', 'emotion'] }),
            createImage({ id: "1518495973542-4542f68e80bf", label: "A Thousand Years of Patience", fallback: "mossy rocks", categories: ['nature', 'abstract', 'nostalgia'] }),
            createImage({ id: "1470071459604-3b5ec3a7fe05", label: "The Valley That Swallowed the Clouds", fallback: "fog valley", categories: ['nature', 'abstract', 'emotion'] }),
            createImage({ id: "1501785888041-af3ef285b470", label: "A Mirror the Mountains Built", fallback: "mountain lake", categories: ['nature', 'water', 'emotion'] }),
            createImage({ id: "1441974231531-c6227db76b6e", label: "The Last Tree Standing's Cathedral", fallback: "forest canopy", categories: ['nature', 'abstract', 'emotion'] }),
            // New images
            createImage({ id: "1469474968028-56623f02e42e", label: "The Path Nobody Took Twice", fallback: "forest path", categories: ['nature', 'adventure', 'emotion'] }),
            createImage({ id: "1507003211169-0a1dd7228f2d", label: "Morning's First Songbird", fallback: "bird branch", categories: ['animal', 'nature', 'music'] }),
            createImage({ id: "1475113548554-5a36f1f523d6", label: "Roots That Remember Everything", fallback: "ancient tree roots", categories: ['nature', 'nostalgia', 'abstract'] }),
            createImage({ id: "1516298773066-f6b860f8ea84", label: "The Mushroom Kingdom's Parliament", fallback: "mushrooms forest floor", categories: ['nature', 'science', 'abstract'] }),
            createImage({ id: "1504567961542-e24d9439a724", label: "Lightning's Autograph", fallback: "lightning storm", categories: ['nature', 'science', 'emotion'] }),
            createImage({ id: "1520262494112-9fe481d36ec2", label: "Dandelion's Last Wish", fallback: "dandelion seeds", categories: ['nature', 'abstract', 'emotion'] }),
            createImage({ id: "1509316975850-ff9c5deb0cd9", label: "A Fox Who Knows Your Name", fallback: "fox snow", categories: ['animal', 'nature', 'emotion'] }),
            createImage({ id: "1518173946687-403870c84f25", label: "The Glacier's Slow Confession", fallback: "glacier", categories: ['nature', 'water', 'science'] }),
            createImage({ id: "1490682143684-14369e18dce8", label: "Fireflies Writing in Cursive", fallback: "fireflies night", categories: ['nature', 'abstract', 'nostalgia'] }),
            createImage({ id: "1505852679233-d9fd70aff56d", label: "Petals Before the Storm", fallback: "wildflowers field", categories: ['nature', 'emotion', 'art'] }),
            createImage({ id: "1494500764479-0c8f2919a3d8", label: "The River That Carved a Canyon's Heart", fallback: "river canyon", categories: ['nature', 'water', 'adventure'] }),
            createImage({ id: "1508739773434-c26b3d09e071", label: "Sunset Teaching the Leaves to Glow", fallback: "autumn forest sunset", categories: ['nature', 'emotion', 'nostalgia'] }),
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
            // People & tech culture
            createImage({ id: "1542751371-adc38448a05e", label: "Wearing Tomorrow's Eyes Today", fallback: "vr headset person", categories: ['technology', 'human', 'science'] }),
            createImage({ id: "1511512578047-dfb367046420", label: "Quarter-Fed Childhood Memories", fallback: "arcade playing", categories: ['nostalgia', 'technology', 'human'] }),
            createImage({ id: "1558618666-fcd25c85f82e", label: "Static Between the Channels of Sleep", fallback: "retro tv", categories: ['nostalgia', 'technology', 'abstract'] }),
            createImage({ id: "1593508512255-86ab42a8e620", label: "Where Ideas Go to Become Real", fallback: "retro desk setup", categories: ['technology', 'human', 'nostalgia'] }),
            createImage({ id: "1485827404703-89b55fcc595e", label: "The Machine That Learned to Wave", fallback: "robot", categories: ['technology', 'science', 'emotion'] }),
            // Iconic tech objects
            createImage({ id: "1550745165-9bc0b252726f", label: "90 Minutes of Someone's Soul", fallback: "cassette tape", categories: ['nostalgia', 'music', 'emotion'] }),
            createImage({ id: "1550751827-4bd374c3f58b", label: "The Crackle Before the First Note", fallback: "vinyl record", categories: ['music', 'nostalgia', 'art'] }),
            createImage({ id: "1518770660439-4636190af475", label: "A City Built for Electrons", fallback: "circuit board", categories: ['technology', 'science', 'abstract'] }),
            createImage({ id: "1531297484001-80022131f5a1", label: "Rainbow Fingers on a Midnight Keyboard", fallback: "keyboard rgb", categories: ['technology', 'art', 'human'] }),
            createImage({ id: "1498050108023-c5249f4df085", label: "Poetry Written in Semicolons", fallback: "code screen", categories: ['technology', 'art', 'abstract'] }),
            createImage({ id: "1487058792275-0ad4aaf24ca7", label: "Ghosts of High Scores Past", fallback: "arcade", categories: ['nostalgia', 'technology', 'emotion'] }),
            createImage({ id: "1526374965328-7f61d4dc18c5", label: "Dialing the Number You Still Remember", fallback: "rotary phone", categories: ['nostalgia', 'technology', 'emotion'] }),
            // New images
            createImage({ id: "1558618666-fcd25c85f1d7", label: "Midnight Arcade Fever", fallback: "arcade night", categories: ['nostalgia', 'technology', 'urban'] }),
            createImage({ id: "1517420704952-d9f39e95b43b", label: "The Floppy Disk That Held a Universe", fallback: "floppy disk", categories: ['nostalgia', 'technology', 'science'] }),
            createImage({ id: "1525547719571-a2d4ac8945e2", label: "Laptop Campfire Stories", fallback: "laptop dark", categories: ['technology', 'human', 'emotion'] }),
            createImage({ id: "1496181133206-80ce9b88a853", label: "The Cursor That Blinked Like a Heartbeat", fallback: "computer cursor", categories: ['technology', 'abstract', 'emotion'] }),
            createImage({ id: "1558098329-a11cff621064", label: "The Server Room's Lullaby", fallback: "server room", categories: ['technology', 'science', 'abstract'] }),
            createImage({ id: "1548092372-0d1bd40894a3", label: "A Joystick's Worn-Down Memories", fallback: "retro joystick", categories: ['nostalgia', 'technology', 'emotion'] }),
            createImage({ id: "1515940175183-6798529cb860", label: "Where the Wires All Converge", fallback: "tangled cables", categories: ['technology', 'abstract', 'art'] }),
            createImage({ id: "1561883088-039e53143d73", label: "The Blueprint of an Impossible Machine", fallback: "technical blueprint", categories: ['science', 'technology', 'art'] }),
            createImage({ id: "1504384308090-c894fdcc538d", label: "Radar Ghosts and Satellite Prayers", fallback: "satellite dish", categories: ['technology', 'space', 'science'] }),
            createImage({ id: "1550009158-9ebf69173e03", label: "A Motherboard's Family Portrait", fallback: "motherboard closeup", categories: ['technology', 'science', 'abstract'] }),
            createImage({ id: "1519389950473-47ba0277781c", label: "The First Pixel of a Revolution", fallback: "pixel art", categories: ['technology', 'art', 'nostalgia'] }),
            createImage({ id: "1563770660331-4e1b460168f4", label: "Rewinding Saturday Morning Cartoons", fallback: "vhs tape", categories: ['nostalgia', 'art', 'emotion'] }),
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
            // People & ocean life
            createImage({ id: "1530053969600-cacd65653d22", label: "Borrowed Time on a Borrowed Wave", fallback: "surfer wave", categories: ['adventure', 'water', 'human'] }),
            createImage({ id: "1544551763-46a013bb70d5", label: "Breathing in an Alien World", fallback: "scuba diver", categories: ['adventure', 'water', 'science'] }),
            createImage({ id: "1502680390548-bca8fcc47c11", label: "Salt on Your Skin, Stars in Your Hair", fallback: "beach party", categories: ['human', 'water', 'emotion'] }),
            createImage({ id: "1505228395891-9a51e7e86bf6", label: "The Leap Before the Splash", fallback: "cliff jumping ocean", categories: ['adventure', 'human', 'emotion'] }),
            createImage({ id: "1437622368342-7a3d73a34c8f", label: "A Compass Pointing to Freedom", fallback: "sailing boat", categories: ['adventure', 'water', 'nostalgia'] }),
            // Viral ocean imagery
            createImage({ id: "1507525428034-b723cf961d3e", label: "Poseidon's Living Room", fallback: "ocean waves", categories: ['water', 'nature', 'abstract'] }),
            createImage({ id: "1544027993-215b52db5e3c", label: "Time Stopped Mid-Crash", fallback: "frozen wave", categories: ['water', 'abstract', 'art'] }),
            createImage({ id: "1468581264429-2548a9948e97", label: "The Ocean's Floating Lanterns", fallback: "jellyfish", categories: ['animal', 'water', 'abstract'] }),
            createImage({ id: "1518837695005-2083093ee35b", label: "An Underwater City That Grew Itself", fallback: "coral reef", categories: ['nature', 'water', 'science'] }),
            createImage({ id: "1544551763-77a2d1f5b107", label: "The Silence Below the Silence", fallback: "deep ocean", categories: ['water', 'abstract', 'emotion'] }),
            createImage({ id: "1505118380757-91f5816e5e04", label: "The Last Light Before the Storm", fallback: "lighthouse", categories: ['urban', 'water', 'emotion'] }),
            createImage({ id: "1498462440456-0dba182e007b", label: "Where the Sand Remembers Your Footprints", fallback: "tropical shore", categories: ['nature', 'water', 'nostalgia'] }),
            // New images
            createImage({ id: "1518882575700-5e30b5468d4f", label: "The Whale's Unfinished Symphony", fallback: "whale tail", categories: ['animal', 'water', 'music'] }),
            createImage({ id: "1559827260435-44836119a2d0", label: "A Message in a Bottle That Arrived", fallback: "bottle shore", categories: ['nostalgia', 'water', 'emotion'] }),
            createImage({ id: "1504701954957-2010ec3bcec1", label: "Tide Pools Holding Tiny Universes", fallback: "tide pool", categories: ['nature', 'water', 'science'] }),
            createImage({ id: "1494790108377-be9c29b29330", label: "The Anchor's Rusty Autobiography", fallback: "rusty anchor", categories: ['nostalgia', 'water', 'art'] }),
            createImage({ id: "1517483000871-1dbf64a6e1c6", label: "Bioluminescence Writing the Dark", fallback: "bioluminescence", categories: ['science', 'water', 'abstract'] }),
            createImage({ id: "1540979388789-6cee28a1cdc9", label: "The Shipwreck That Became a Reef", fallback: "shipwreck underwater", categories: ['adventure', 'water', 'nostalgia'] }),
            createImage({ id: "1559827291814-023a161a3e2b", label: "Seahorse Holding On for Dear Life", fallback: "seahorse", categories: ['animal', 'water', 'emotion'] }),
            createImage({ id: "1510414842594-a61c69b5ae57", label: "Driftwood's Long Journey Home", fallback: "driftwood beach", categories: ['nature', 'water', 'nostalgia'] }),
            createImage({ id: "1504472478235-9bc48ba4d60f", label: "The Ocean Floor's Starless Sky", fallback: "deep sea floor", categories: ['water', 'space', 'abstract'] }),
            createImage({ id: "1519451241324-20b4ea2c4220", label: "A Pelican's Perfect Patience", fallback: "pelican dock", categories: ['animal', 'water', 'emotion'] }),
            createImage({ id: "1513553404607-988bf2703777", label: "Mist Rising Like Ghosts at Sunrise", fallback: "ocean mist sunrise", categories: ['water', 'nature', 'emotion'] }),
            createImage({ id: "1520942702018-0862200e6873", label: "The Dock That Heard Every Goodbye", fallback: "old dock", categories: ['nostalgia', 'water', 'human'] }),
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
            // People in golden light
            createImage({ id: "1502680390548-bca8fcc47c16", label: "Clinking Glasses Above the Skyline", fallback: "friends rooftop sunset", categories: ['human', 'urban', 'emotion'] }),
            createImage({ id: "1476900164809-ff19b8ae5968", label: "Balancing Between Earth and Sun", fallback: "yoga sunset", categories: ['human', 'nature', 'emotion'] }),
            createImage({ id: "1495616811223-4d98c6e9c869", label: "Embers That Outlast the Daylight", fallback: "beach bonfire friends", categories: ['human', 'nature', 'nostalgia'] }),
            createImage({ id: "1529156069898-49953bc91ac4", label: "The Last Song Before the Lights Came On", fallback: "music festival sunset", categories: ['music', 'human', 'emotion'] }),
            createImage({ id: "1506905925346-21bda4d32df4", label: "A Silhouette Writing Its Own Story", fallback: "desert sunset", categories: ['adventure', 'nature', 'emotion'] }),
            // Viral sunset moments
            createImage({ id: "1472120435266-95a3f747eb47", label: "Trees Rehearsing for a Shadow Play", fallback: "tree silhouette", categories: ['nature', 'art', 'abstract'] }),
            createImage({ id: "1490750967868-88aa4f44baee", label: "The Rooftop Where Time Slows Down", fallback: "rooftop sunset", categories: ['urban', 'emotion', 'nostalgia'] }),
            createImage({ id: "1476842634003-7dcca8f832de", label: "Wishes Floating Into the Atmosphere", fallback: "sky lanterns", categories: ['emotion', 'art', 'adventure'] }),
            createImage({ id: "1508739773434-c26b3d09e071", label: "A Canyon Blushing at Golden Hour", fallback: "canyon sunset", categories: ['nature', 'adventure', 'art'] }),
            createImage({ id: "1500530855697-b586d89ba3ee", label: "The Forest Dipped in Honey", fallback: "golden hour forest", categories: ['nature', 'emotion', 'art'] }),
            createImage({ id: "1504701954957-2010ec3bcec1", label: "The Harvest That Painted Itself Gold", fallback: "harvest field", categories: ['nature', 'nostalgia', 'art'] }),
            createImage({ id: "1470770841072-f978cf4d019e", label: "The Sky's Resignation Letter", fallback: "sunset skyline", categories: ['urban', 'nature', 'emotion'] }),
            // New images
            createImage({ id: "1495584816685-4bdbeb2b982c", label: "A Stairway Climbing Into the Blaze", fallback: "stairway sunset", categories: ['urban', 'adventure', 'abstract'] }),
            createImage({ id: "1519681393784-d120267933ba", label: "Stars Arriving for the Night Shift", fallback: "twilight stars", categories: ['space', 'nature', 'emotion'] }),
            createImage({ id: "1473496169904-658ba7c44d8a", label: "Bicycle Silhouette Against Amber Sky", fallback: "bicycle sunset", categories: ['human', 'nostalgia', 'adventure'] }),
            createImage({ id: "1500382017468-9049fed747ef", label: "The Vineyard's Golden Farewell", fallback: "vineyard sunset", categories: ['nature', 'nostalgia', 'art'] }),
            createImage({ id: "1518173946687-403870c84f25", label: "Clouds Wearing Their Evening Gowns", fallback: "dramatic clouds sunset", categories: ['nature', 'abstract', 'art'] }),
            createImage({ id: "1502899576159-f224dc2349fa", label: "Window Seat to the End of the Day", fallback: "window sunset view", categories: ['human', 'emotion', 'nostalgia'] }),
            createImage({ id: "1505765050516-f72dcac9c60e", label: "Hot Air Balloons Chasing the Sun", fallback: "hot air balloons", categories: ['adventure', 'art', 'emotion'] }),
            createImage({ id: "1496483648148-47c686dc86c4", label: "The Pier That Reaches for Tomorrow", fallback: "pier sunset", categories: ['water', 'nostalgia', 'emotion'] }),
            createImage({ id: "1489516408517-0c0a15fc1d85", label: "Shadows Growing Longer Than Dreams", fallback: "long shadows sunset", categories: ['abstract', 'nature', 'emotion'] }),
            createImage({ id: "1500534314209-a25ddb2bd429", label: "Lighthouse Painting the Fog in Gold", fallback: "lighthouse sunset", categories: ['water', 'urban', 'art'] }),
            createImage({ id: "1517483000871-1dbf64a6e1c6", label: "The Fisherman's Golden Hour Ritual", fallback: "fisherman sunset", categories: ['human', 'water', 'nostalgia'] }),
            createImage({ id: "1486870591958-9b9d0d1dda99", label: "Mountains Wearing Crowns of Light", fallback: "mountains golden hour", categories: ['nature', 'adventure', 'emotion'] }),
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
        keywords: ["abstract art", "street culture", "viral moment", "surreal", "pop culture"],
        assets: [
            // Wild mix of viral & people moments
            createImage({ id: "1529156069898-49953bc91ac4", label: "???", fallback: "crowd", categories: ['human', 'music', 'emotion'] }),
            createImage({ id: "1534430480872-3498386e7856", label: "???", fallback: "tunnel", categories: ['urban', 'abstract', 'adventure'] }),
            createImage({ id: "1502680390548-bca8fcc47c11", label: "???", fallback: "bonfire", categories: ['nature', 'human', 'nostalgia'] }),
            createImage({ id: "1519681393784-d120267933ba", label: "???", fallback: "stars", categories: ['space', 'nature', 'abstract'] }),
            createImage({ id: "1533174072545-7a4b6ad7a6c3", label: "???", fallback: "concert", categories: ['music', 'human', 'emotion'] }),
            createImage({ id: "1551632811-561732d1e306", label: "???", fallback: "adventure", categories: ['adventure', 'nature', 'human'] }),
            createImage({ id: "1540206395-68808572332f", label: "???", fallback: "aurora", categories: ['nature', 'space', 'abstract'] }),
            createImage({ id: "1542751371-adc38448a05e", label: "???", fallback: "future", categories: ['technology', 'science', 'human'] }),
            createImage({ id: "1470225620780-dba8ba36b745", label: "???", fallback: "party", categories: ['music', 'emotion', 'human'] }),
            createImage({ id: "1544027993-215b52db5e3c", label: "???", fallback: "frozen", categories: ['water', 'abstract', 'nature'] }),
            // New mystery images
            createImage({ id: "1507003211169-0a1dd7228f2d", label: "???", fallback: "portrait", categories: ['human', 'emotion', 'art'] }),
            createImage({ id: "1518770660439-4636190af475", label: "???", fallback: "circuits", categories: ['technology', 'science', 'abstract'] }),
            createImage({ id: "1468581264429-2548a9948e97", label: "???", fallback: "glow", categories: ['animal', 'water', 'abstract'] }),
            createImage({ id: "1441974231531-c6227db76b6e", label: "???", fallback: "green", categories: ['nature', 'emotion', 'abstract'] }),
            createImage({ id: "1487058792275-0ad4aaf24ca7", label: "???", fallback: "game", categories: ['nostalgia', 'technology', 'art'] }),
            createImage({ id: "1476842634003-7dcca8f832de", label: "???", fallback: "floating", categories: ['emotion', 'art', 'adventure'] }),
            createImage({ id: "1472396961693-142e6e269027", label: "???", fallback: "wild", categories: ['animal', 'nature', 'emotion'] }),
            createImage({ id: "1558618666-fcd25c85f1d7", label: "???", fallback: "neon", categories: ['nostalgia', 'technology', 'urban'] }),
            createImage({ id: "1505118380757-91f5816e5e04", label: "???", fallback: "beacon", categories: ['urban', 'water', 'emotion'] }),
            createImage({ id: "1504567961542-e24d9439a724", label: "???", fallback: "flash", categories: ['nature', 'science', 'emotion'] }),
            createImage({ id: "1505765050516-f72dcac9c60e", label: "???", fallback: "flying", categories: ['adventure', 'art', 'emotion'] }),
            createImage({ id: "1509316975850-ff9c5deb0cd9", label: "???", fallback: "creature", categories: ['animal', 'nature', 'emotion'] }),
        ],
        fusionImages: DEFAULT_FUSIONS,
        unlockMilestone: "streak_7",
    },
];

// ── Video assets (royalty-free Pexels/Pixabay hosted) ──
const VIDEO_ASSETS = {
    neon: [
        createVideo({ id: "neon-v1", label: "City Pulse", url: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4", posterUrl: "https://images.pexels.com/videos/3129671/free-video-3129671.jpg?w=800" }),
        createVideo({ id: "neon-v2", label: "Neon Rain", url: "https://videos.pexels.com/video-files/2795173/2795173-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/2795173/free-video-2795173.jpg?w=800" }),
        createVideo({ id: "neon-v3", label: "Electric Flow", url: "https://videos.pexels.com/video-files/856974/856974-hd_1920_1080_30fps.mp4", posterUrl: "https://images.pexels.com/videos/856974/free-video-856974.jpg?w=800" }),
        createVideo({ id: "neon-v4", label: "Night Drive", url: "https://videos.pexels.com/video-files/2519660/2519660-uhd_2560_1440_24fps.mp4", posterUrl: "https://images.pexels.com/videos/2519660/free-video-2519660.jpg?w=800" }),
    ],
    nature: [
        createVideo({ id: "nature-v1", label: "Flowing River", url: "https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_24fps.mp4", posterUrl: "https://images.pexels.com/videos/1448735/free-video-1448735.jpg?w=800" }),
        createVideo({ id: "nature-v2", label: "Forest Mist", url: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4", posterUrl: "https://images.pexels.com/videos/3571264/free-video-3571264.jpg?w=800" }),
        createVideo({ id: "nature-v3", label: "Mountain Dawn", url: "https://videos.pexels.com/video-files/1666465/1666465-uhd_2560_1440_24fps.mp4", posterUrl: "https://images.pexels.com/videos/1666465/free-video-1666465.jpg?w=800" }),
        createVideo({ id: "nature-v4", label: "Meadow Wind", url: "https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_25fps.mp4", posterUrl: "https://images.pexels.com/videos/857195/free-video-857195.jpg?w=800" }),
    ],
    "retro-tech": [
        createVideo({ id: "retro-v1", label: "CRT Static", url: "https://videos.pexels.com/video-files/6981411/6981411-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/6981411/free-video-6981411.jpg?w=800" }),
        createVideo({ id: "retro-v2", label: "Data Stream", url: "https://videos.pexels.com/video-files/5377700/5377700-uhd_2560_1440_30fps.mp4", posterUrl: "https://images.pexels.com/videos/5377700/free-video-5377700.jpg?w=800" }),
        createVideo({ id: "retro-v3", label: "Pixel Rain", url: "https://videos.pexels.com/video-files/6963744/6963744-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/6963744/free-video-6963744.jpg?w=800" }),
        createVideo({ id: "retro-v4", label: "Analog Wave", url: "https://videos.pexels.com/video-files/5532771/5532771-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/5532771/free-video-5532771.jpg?w=800" }),
    ],
    ocean: [
        createVideo({ id: "ocean-v1", label: "Wave Crash", url: "https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4", posterUrl: "https://images.pexels.com/videos/1093662/free-video-1093662.jpg?w=800" }),
        createVideo({ id: "ocean-v2", label: "Deep Current", url: "https://videos.pexels.com/video-files/2614236/2614236-uhd_2560_1440_30fps.mp4", posterUrl: "https://images.pexels.com/videos/2614236/free-video-2614236.jpg?w=800" }),
        createVideo({ id: "ocean-v3", label: "Reef Life", url: "https://videos.pexels.com/video-files/855029/855029-hd_1920_1080_30fps.mp4", posterUrl: "https://images.pexels.com/videos/855029/free-video-855029.jpg?w=800" }),
        createVideo({ id: "ocean-v4", label: "Tidal Pull", url: "https://videos.pexels.com/video-files/1409899/1409899-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/1409899/free-video-1409899.jpg?w=800" }),
    ],
    sunset: [
        createVideo({ id: "sunset-v1", label: "Golden Fade", url: "https://videos.pexels.com/video-files/1268209/1268209-hd_1920_1080_24fps.mp4", posterUrl: "https://images.pexels.com/videos/1268209/free-video-1268209.jpg?w=800" }),
        createVideo({ id: "sunset-v2", label: "Dusk Sky", url: "https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4", posterUrl: "https://images.pexels.com/videos/857251/free-video-857251.jpg?w=800" }),
        createVideo({ id: "sunset-v3", label: "Amber Haze", url: "https://videos.pexels.com/video-files/2098989/2098989-uhd_2560_1440_30fps.mp4", posterUrl: "https://images.pexels.com/videos/2098989/free-video-2098989.jpg?w=800" }),
        createVideo({ id: "sunset-v4", label: "Warm Horizon", url: "https://videos.pexels.com/video-files/856947/856947-hd_1920_1080_25fps.mp4", posterUrl: "https://images.pexels.com/videos/856947/free-video-856947.jpg?w=800" }),
    ],
    mystery: [
        createVideo({ id: "mystery-v1", label: "???", url: "https://videos.pexels.com/video-files/3141210/3141210-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/3141210/free-video-3141210.jpg?w=800" }),
        createVideo({ id: "mystery-v2", label: "???", url: "https://videos.pexels.com/video-files/4812203/4812203-uhd_2560_1440_25fps.mp4", posterUrl: "https://images.pexels.com/videos/4812203/free-video-4812203.jpg?w=800" }),
        createVideo({ id: "mystery-v3", label: "???", url: "https://videos.pexels.com/video-files/5045401/5045401-uhd_2560_1440_24fps.mp4", posterUrl: "https://images.pexels.com/videos/5045401/free-video-5045401.jpg?w=800" }),
        createVideo({ id: "mystery-v4", label: "???", url: "https://videos.pexels.com/video-files/4920811/4920811-uhd_2560_1440_24fps.mp4", posterUrl: "https://images.pexels.com/videos/4920811/free-video-4920811.jpg?w=800" }),
    ],
};

// ── Audio assets (royalty-free Pixabay audio) ──
const AUDIO_ASSETS = {
    neon: [
        createAudio({ id: "neon-a1", label: "Synthwave Pulse", url: "https://cdn.pixabay.com/audio/2022/10/25/audio_33fbc1a816.mp3", coverUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("synthwave") }),
        createAudio({ id: "neon-a2", label: "Night Circuit", url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("circuit") }),
        createAudio({ id: "neon-a3", label: "Electric Dream", url: "https://cdn.pixabay.com/audio/2023/07/11/audio_e07e8e4014.mp3", coverUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("electric") }),
        createAudio({ id: "neon-a4", label: "Vapor Trail", url: "https://cdn.pixabay.com/audio/2023/10/07/audio_7605c31ee4.mp3", coverUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("vapor") }),
    ],
    nature: [
        createAudio({ id: "nature-a1", label: "Birdsong Dawn", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_48ad24fcc1.mp3", coverUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("birdsong") }),
        createAudio({ id: "nature-a2", label: "Rain on Leaves", url: "https://cdn.pixabay.com/audio/2022/09/01/audio_1e1ccc5a68.mp3", coverUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("rain") }),
        createAudio({ id: "nature-a3", label: "Creek Flow", url: "https://cdn.pixabay.com/audio/2022/02/07/audio_b9bc1cd118.mp3", coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("creek") }),
        createAudio({ id: "nature-a4", label: "Forest Wind", url: "https://cdn.pixabay.com/audio/2021/08/08/audio_2237a35222.mp3", coverUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("wind") }),
    ],
    "retro-tech": [
        createAudio({ id: "retro-a1", label: "8-Bit Quest", url: "https://cdn.pixabay.com/audio/2022/07/11/audio_5e3920e34e.mp3", coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("8bit") }),
        createAudio({ id: "retro-a2", label: "Dial-Up Memory", url: "https://cdn.pixabay.com/audio/2023/04/27/audio_10fdd3bd12.mp3", coverUrl: "https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("dialup") }),
        createAudio({ id: "retro-a3", label: "Arcade Coin", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_a2f4a71ed3.mp3", coverUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("arcade") }),
        createAudio({ id: "retro-a4", label: "Synth Boot", url: "https://cdn.pixabay.com/audio/2022/11/22/audio_a1e4feb4d0.mp3", coverUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("synth") }),
    ],
    ocean: [
        createAudio({ id: "ocean-a1", label: "Whale Song", url: "https://cdn.pixabay.com/audio/2022/06/07/audio_37e8fe8dfa.mp3", coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("whale") }),
        createAudio({ id: "ocean-a2", label: "Shore Break", url: "https://cdn.pixabay.com/audio/2022/01/20/audio_bdb6ea6b4a.mp3", coverUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("shore") }),
        createAudio({ id: "ocean-a3", label: "Deep Sonar", url: "https://cdn.pixabay.com/audio/2023/01/17/audio_a69b706cfe.mp3", coverUrl: "https://images.unsplash.com/photo-1544551763-77a2d1f5b107?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("sonar") }),
        createAudio({ id: "ocean-a4", label: "Harbor Bell", url: "https://cdn.pixabay.com/audio/2022/03/09/audio_18e1cacb98.mp3", coverUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("harbor") }),
    ],
    sunset: [
        createAudio({ id: "sunset-a1", label: "Golden Strings", url: "https://cdn.pixabay.com/audio/2022/08/31/audio_419263b458.mp3", coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("strings") }),
        createAudio({ id: "sunset-a2", label: "Dusk Piano", url: "https://cdn.pixabay.com/audio/2023/09/04/audio_5546f7cbb7.mp3", coverUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("piano") }),
        createAudio({ id: "sunset-a3", label: "Amber Hum", url: "https://cdn.pixabay.com/audio/2022/11/21/audio_c2c0d49e31.mp3", coverUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("amber") }),
        createAudio({ id: "sunset-a4", label: "Twilight Chimes", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112240f.mp3", coverUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("chimes") }),
    ],
    mystery: [
        createAudio({ id: "mystery-a1", label: "???", url: "https://cdn.pixabay.com/audio/2023/03/27/audio_24cba72520.mp3", coverUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("mystery1") }),
        createAudio({ id: "mystery-a2", label: "???", url: "https://cdn.pixabay.com/audio/2022/10/02/audio_4e0a0e4394.mp3", coverUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("mystery2") }),
        createAudio({ id: "mystery-a3", label: "???", url: "https://cdn.pixabay.com/audio/2023/06/15/audio_3cdce93c1f.mp3", coverUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("mystery3") }),
        createAudio({ id: "mystery-a4", label: "???", url: "https://cdn.pixabay.com/audio/2022/09/28/audio_1da2d8dfbd.mp3", coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80", coverFallbackUrl: buildPicsumFallback("mystery4") }),
    ],
};

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

export function buildThemeAssets(theme, count = 2, mediaType = MEDIA_TYPES.IMAGE) {
    const seed = Date.now();

    // Pick the right asset pool based on media type
    let pool;
    if (mediaType === MEDIA_TYPES.VIDEO) {
        pool = VIDEO_ASSETS[theme?.id] || [];
    } else if (mediaType === MEDIA_TYPES.AUDIO) {
        pool = AUDIO_ASSETS[theme?.id] || [];
    } else {
        pool = Array.isArray(theme?.assets) && theme.assets.length > 0 ? theme.assets : null;
    }

    if (pool && pool.length > 0) {
        const byUrl = new Map();
        for (const a of pool) {
            if (!byUrl.has(a.url)) byUrl.set(a.url, a);
        }
        const unique = [...byUrl.values()];
        const shuffled = shuffle(unique);

        // If the static pool is getting thin, supplement with AI-generated concepts
        if (unique.length - count < 4 && mediaType === MEDIA_TYPES.IMAGE) {
            try {
                const usedIds = new Set(unique.map(a => a.label));
                const supplemental = getSupplementalConcepts(usedIds, theme);
                for (const concept of supplemental) {
                    shuffled.push({
                        id: `ai-${seed}-${concept.left.label}`,
                        label: concept.left.label,
                        type: MEDIA_TYPES.IMAGE,
                        url: concept.left.url,
                        fallbackUrl: buildPicsumFallback(concept.left.label),
                        categories: concept.left.categories,
                    });
                    shuffled.push({
                        id: `ai-${seed}-${concept.right.label}`,
                        label: concept.right.label,
                        type: MEDIA_TYPES.IMAGE,
                        url: concept.right.url,
                        fallbackUrl: buildPicsumFallback(concept.right.label),
                        categories: concept.right.categories,
                    });
                }
            } catch {
                // conceptGenerator not available or failed — continue with static pool
            }
        }

        const picked = shuffled.slice(0, count);
        return picked.map((asset, index) => ({
            ...asset,
            id: asset.id || `${theme?.id || "theme"}-${seed}-${index}`,
        }));
    }

    // Fallback to image keywords
    const keywords = shuffle(getThemeKeywords(theme));
    const chosen = keywords.slice(0, count);
    return chosen.map((keyword, index) => ({
        id: `${theme?.id || "theme"}-${seed}-${index}`,
        label: keyword,
        type: MEDIA_TYPES.IMAGE,
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

const DEFAULT_KEYWORDS = ["abstract art", "texture", "colorful pattern", "surreal", "dreamscape"];

const IMG_WIDTH = 800;

// ── Media type constants ──
export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
};

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
        type: MEDIA_TYPES.IMAGE,
        url: buildUnsplashUrl(id),
        fallbackUrl: buildPicsumFallback(fallback || label),
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
            createImage({ id: "1555680202-c86f0e12f086", label: "Neon Alley", fallback: "neon city" }),
            createImage({ id: "1563089145-599997674d42", label: "Neon Glow", fallback: "neon signs" }),
            createImage({ id: "1470770841072-f978cf4d019e", label: "Night Streets", fallback: "night city" }),
            createImage({ id: "1489515217757-5fd1be406fef", label: "Light Trails", fallback: "city lights" }),
            createImage({ id: "1514565131-fce0801e5785", label: "Tokyo Glow", fallback: "tokyo neon" }),
            createImage({ id: "1520175480354-4c0787c55809", label: "Arcade Entrance", fallback: "arcade neon" }),
            createImage({ id: "1557683316-973673baf926", label: "Cyberpunk Rain", fallback: "cyber rain" }),
            createImage({ id: "1516054575922-f0b8eeadec19", label: "Purple Haze", fallback: "purple neon" }),
            createImage({ id: "1582719508461-905c673c1ae0", label: "Night Market", fallback: "night market" }),
            createImage({ id: "1534430480872-3498386e7856", label: "Neon Tunnel", fallback: "neon tunnel" }),
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
            createImage({ id: "1472396961693-142e6e269027", label: "Deer Meadow", fallback: "deer meadow" }),
            createImage({ id: "1433086966358-54859d0ed716", label: "Waterfall Pool", fallback: "waterfall" }),
            createImage({ id: "1518495973542-4542f68e80bf", label: "Mossy Stones", fallback: "mossy rocks" }),
            createImage({ id: "1507041957456-9c397ce39c97", label: "Autumn Path", fallback: "autumn forest" }),
            createImage({ id: "1426604966848-d7adac402bff", label: "Wildflowers", fallback: "wildflowers" }),
            createImage({ id: "1470071459604-3b5ec3a7fe05", label: "Fog Valley", fallback: "fog valley" }),
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
            createImage({ id: "1550745165-9bc0b252726f", label: "Cassette Tape", fallback: "cassette tape" }),
            createImage({ id: "1558618666-fcd25c85f82e", label: "Old TV Static", fallback: "tv static" }),
            createImage({ id: "1531297484001-80022131f5a1", label: "Keyboard Matrix", fallback: "keyboard vintage" }),
            createImage({ id: "1461749280684-dccba630e2f6", label: "Game Cartridge", fallback: "game cartridge" }),
            createImage({ id: "1550751827-4bd374c3f58b", label: "Vinyl Record", fallback: "vinyl record" }),
            createImage({ id: "1498050108023-c5249f4df085", label: "Code Screen", fallback: "code screen" }),
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
            createImage({ id: "1518837695005-2083093ee35b", label: "Coral Reef", fallback: "coral reef" }),
            createImage({ id: "1468581264429-2548a9948e97", label: "Jellyfish Drift", fallback: "jellyfish" }),
            createImage({ id: "1505118380757-91f5816e5e04", label: "Lighthouse", fallback: "lighthouse" }),
            createImage({ id: "1437622368342-7a3d73a34c8f", label: "Sailing Boat", fallback: "sailing" }),
            createImage({ id: "1544027993-215b52db5e3c", label: "Frozen Wave", fallback: "frozen wave" }),
            createImage({ id: "1498462440456-0dba182e007b", label: "Tropical Shore", fallback: "tropical shore" }),
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
            createImage({ id: "1506905925346-21bda4d32df4", label: "Desert Sunset", fallback: "desert sunset" }),
            createImage({ id: "1472120435266-95a3f747eb47", label: "Silhouette Trees", fallback: "tree silhouette" }),
            createImage({ id: "1495616811223-4d98c6e9c869", label: "Beach Bonfire", fallback: "beach bonfire" }),
            createImage({ id: "1518998053901-5348d3961a04", label: "Window Light", fallback: "window light" }),
            createImage({ id: "1490750967868-88aa4f44baee", label: "City Rooftop", fallback: "rooftop sunset" }),
            createImage({ id: "1504701954957-2010ec3bcec1", label: "Harvest Field", fallback: "harvest field" }),
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
            createImage({ id: "1534796636101-874c2f80e0b5", label: "???", fallback: "abstract pattern" }),
            createImage({ id: "1502318217862-aa2e3680c490", label: "???", fallback: "surreal landscape" }),
            createImage({ id: "1509114397022-ed747cca3f65", label: "???", fallback: "colorful abstract" }),
            createImage({ id: "1506792006437-256b665541e2", label: "???", fallback: "mysterious" }),
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

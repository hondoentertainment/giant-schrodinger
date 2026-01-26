// Themed asset packs with Unsplash images
export const ASSET_THEMES = {
    random: {
        name: 'Random',
        emoji: '🎲',
        assets: [] // Will pull from all themes
    },
    nature: {
        name: 'Nature',
        emoji: '🌿',
        assets: [
            { id: 'n1', label: 'Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
            { id: 'n2', label: 'Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
            { id: 'n3', label: 'Mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
            { id: 'n4', label: 'Desert', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80' },
            { id: 'n5', label: 'Waterfall', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80' },
            { id: 'n6', label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80' }
        ]
    },
    tech: {
        name: 'Technology',
        emoji: '🤖',
        assets: [
            { id: 't1', label: 'Circuit', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' },
            { id: 't2', label: 'Robot', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80' },
            { id: 't3', label: 'Code', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80' },
            { id: 't4', label: 'VR', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&q=80' },
            { id: 't5', label: 'Drone', url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80' },
            { id: 't6', label: 'Neon', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80' }
        ]
    },
    food: {
        name: 'Food',
        emoji: '🍕',
        assets: [
            { id: 'f1', label: 'Pizza', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
            { id: 'f2', label: 'Sushi', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80' },
            { id: 'f3', label: 'Coffee', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80' },
            { id: 'f4', label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80' },
            { id: 'f5', label: 'Ice Cream', url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=600&q=80' },
            { id: 'f6', label: 'Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80' }
        ]
    },
    animals: {
        name: 'Animals',
        emoji: '🐾',
        assets: [
            { id: 'a1', label: 'Lion', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80' },
            { id: 'a2', label: 'Owl', url: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=600&q=80' },
            { id: 'a3', label: 'Dolphin', url: 'https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=600&q=80' },
            { id: 'a4', label: 'Butterfly', url: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600&q=80' },
            { id: 'a5', label: 'Fox', url: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&q=80' },
            { id: 'a6', label: 'Panda', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&q=80' }
        ]
    },
    art: {
        name: 'Art & Culture',
        emoji: '🎨',
        assets: [
            { id: 'ar1', label: 'Painting', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80' },
            { id: 'ar2', label: 'Sculpture', url: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=600&q=80' },
            { id: 'ar3', label: 'Music', url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80' },
            { id: 'ar4', label: 'Dance', url: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&q=80' },
            { id: 'ar5', label: 'Theater', url: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=600&q=80' },
            { id: 'ar6', label: 'Graffiti', url: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&q=80' }
        ]
    }
};

export function getAssetsForTheme(themeKey) {
    if (themeKey === 'random') {
        // Combine all themes
        const allAssets = Object.entries(ASSET_THEMES)
            .filter(([key]) => key !== 'random')
            .flatMap(([_, theme]) => theme.assets);
        return allAssets;
    }
    return ASSET_THEMES[themeKey]?.assets || [];
}

export function getRandomPair(themeKey) {
    const assets = getAssetsForTheme(themeKey);
    const shuffled = [...assets].sort(() => 0.5 - Math.random());
    return { left: shuffled[0], right: shuffled[1] };
}

---
description: Add a new themed image pack to the game
---
# Add New Theme

## Steps

1. Open `src/data/assets.js`

2. Add a new theme object to `ASSET_THEMES`:
```javascript
newTheme: {
    name: 'Theme Display Name',
    emoji: '🎯',
    assets: [
        { id: 'nt1', label: 'Image Label', url: 'https://images.unsplash.com/photo-XXXXX?w=600&q=80' },
        // Add 6-18 images for variety
    ]
},
```

3. Image requirements:
   - Use Unsplash URLs with `?w=600&q=80` for optimal loading
   - Each asset needs: `id` (unique), `label` (display name), `url` (image URL)
   - Aim for 6-18 images per theme

4. Test locally with `npm run dev` and select the new theme from Game Options

5. Deploy with `/deploy` workflow

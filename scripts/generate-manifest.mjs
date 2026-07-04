import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generateManifest(basePath) {
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return {
        name: 'Venn with Friends',
        short_name: 'Venn',
        description: 'Connect two concepts with one witty phrase. Challenge your friends!',
        start_url: normalizedBase,
        scope: normalizedBase,
        display: 'standalone',
        background_color: '#0a0118',
        theme_color: '#1a0533',
        orientation: 'portrait',
        lang: 'en',
        dir: 'ltr',
        categories: ['games', 'entertainment', 'social'],
        icons: [
            {
                src: `${normalizedBase}icon-192.svg`,
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: `${normalizedBase}icon-512.svg`,
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Daily Challenge',
                short_name: 'Daily',
                url: `${normalizedBase}#daily`,
                icons: [{ src: `${normalizedBase}icon-192.svg`, sizes: '192x192' }],
            },
            {
                name: 'Ranked',
                short_name: 'Ranked',
                url: `${normalizedBase}#ranked`,
                icons: [{ src: `${normalizedBase}icon-192.svg`, sizes: '192x192' }],
            },
        ],
        related_applications: [],
        prefer_related_applications: false,
    };
}

export function writeManifest(distDir, basePath) {
    const manifest = generateManifest(basePath);
    fs.writeFileSync(
        path.join(distDir, 'manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
    );
}

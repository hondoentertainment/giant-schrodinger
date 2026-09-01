import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(relPath) {
    return readFileSync(join(root, relPath));
}

describe('public site assets', () => {
    it('ships a real OG PNG and home-screen icons', () => {
        const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
        expect(read('public/og-image.png').subarray(0, 4)).toEqual(pngMagic);
        expect(read('public/icon-192.png').subarray(0, 4)).toEqual(pngMagic);
        expect(read('public/icon-512.png').subarray(0, 4)).toEqual(pngMagic);
    });

    it('publishes Vercel canonical tags, robots, and sitemap', () => {
        const html = read('index.html').toString('utf8');
        expect(html).toContain('https://giant-schrodinger.vercel.app/');
        expect(html).toContain('https://giant-schrodinger.vercel.app/og-image.png');
        expect(html).toContain('rel="canonical"');
        expect(html).not.toContain('github.io');
        expect(html).not.toContain('data:image/svg+xml');

        const robots = read('public/robots.txt').toString('utf8');
        expect(robots).toContain('Sitemap: https://giant-schrodinger.vercel.app/sitemap.xml');

        const sitemap = read('public/sitemap.xml').toString('utf8');
        expect(sitemap).toContain('https://giant-schrodinger.vercel.app/');
        expect(sitemap).not.toContain('github.io');

        const ogTags = read('supabase/functions/og-tags/index.ts').toString('utf8');
        expect(ogTags).toContain('og-image.png');
        expect(ogTags).toContain('Beat this.');
        expect(ogTags).toContain('https://giant-schrodinger.vercel.app');
    });
});

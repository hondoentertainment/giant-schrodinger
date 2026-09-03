#!/usr/bin/env node
/**
 * Confirm the live public face: Vercel OG tags, robots, sitemap, and hosted og-tags.
 * Usage: node scripts/check-public-face.mjs
 */
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const productionUrl = (process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app').replace(/\/$/, '');
const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anon = process.env.VITE_SUPABASE_ANON_KEY || '';

function fail(message) {
    console.error(`✗ ${message}`);
    process.exitCode = 1;
}

function ok(message) {
    console.log(`✓ ${message}`);
}

async function fetchText(url, headers = {}) {
    const response = await fetch(url, { headers, redirect: 'follow' });
    const text = await response.text();
    return { response, text };
}

async function main() {
    console.log(`Public-face check — ${productionUrl}\n`);

    const home = await fetchText(`${productionUrl}/`);
    if (!home.response.ok) {
        fail(`home — HTTP ${home.response.status}`);
    } else {
        const html = home.text;
        if (!html.includes('og:image') || !html.includes(`${productionUrl}/og-image.png`)) {
            fail('home is missing the Vercel OG PNG');
        } else if (!html.includes('Beat this.')) {
            fail('home OG copy is missing Beat this.');
        } else if (html.includes('github.io') || html.includes('og-image.svg')) {
            fail('home still points at GitHub Pages or the old SVG card');
        } else {
            ok('home OG tags use og-image.png and Beat this.');
        }
    }

    const robots = await fetchText(`${productionUrl}/robots.txt`);
    if (!robots.response.ok || !robots.text.includes(`${productionUrl}/sitemap.xml`)) {
        fail('robots.txt is missing the Vercel sitemap');
    } else {
        ok('robots.txt');
    }

    const sitemap = await fetchText(`${productionUrl}/sitemap.xml`);
    if (!sitemap.response.ok || !sitemap.text.includes(`${productionUrl}/`)) {
        fail('sitemap.xml is missing the canonical URL');
    } else {
        ok('sitemap.xml');
    }

    const ogImage = await fetch(`${productionUrl}/og-image.png`, { method: 'GET' });
    const ogType = ogImage.headers.get('content-type') || '';
    if (!ogImage.ok || !ogType.includes('image/png')) {
        fail(`og-image.png — HTTP ${ogImage.status} ${ogType}`);
    } else {
        ok(`og-image.png (${ogType})`);
    }

    if (!supabaseUrl || supabaseUrl.includes('your-')) {
        console.log('○ og-tags skipped — set VITE_SUPABASE_URL in .env.local');
        process.exit(process.exitCode || 0);
    }

    const headers = anon
        ? { apikey: anon, Authorization: `Bearer ${anon}` }
        : {};
    const ogTags = await fetchText(`${supabaseUrl}/functions/v1/og-tags`, headers);
    if (!ogTags.response.ok) {
        fail(`og-tags — HTTP ${ogTags.response.status}`);
    } else if (!ogTags.text.includes('og-image.png') || !ogTags.text.includes('Beat this.')) {
        fail('og-tags is still the old SVG / Challenge your friends card — redeploy with npm run deploy:edge-functions');
    } else if (ogTags.text.includes('og-image.svg')) {
        fail('og-tags still advertises og-image.svg');
    } else {
        ok('og-tags uses og-image.png and Beat this.');
    }

    if (process.exitCode) {
        console.log('\nPublic face is not live yet.');
        process.exit(1);
    }
    console.log('\nPublic face matches Vercel.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

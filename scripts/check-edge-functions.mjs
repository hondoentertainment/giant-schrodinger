#!/usr/bin/env node
/**
 * Probe deployed Supabase edge functions (resolve-image, og-tags).
 */
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const base = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const productionUrl = process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';

async function probe(name, url, { acceptStatuses = [200, 400, 404, 405], headers = {} } = {}) {
    try {
        const response = await fetch(url, { method: 'GET', redirect: 'manual', headers });
        const ok = acceptStatuses.includes(response.status);
        console.log(`${ok ? '✓' : '✗'} ${name} — HTTP ${response.status}`);
        return ok;
    } catch (err) {
        console.log(`✗ ${name} — ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('Supabase edge function probe\n');

    if (!base || base.includes('your-')) {
        console.log('○ Skipped — set VITE_SUPABASE_URL in .env.local');
        console.log('  Run: npm run init:env');
        process.exit(0);
    }

    const anon = process.env.VITE_SUPABASE_ANON_KEY || '';
    const authHeaders = anon
        ? { apikey: anon, Authorization: `Bearer ${anon}` }
        : {};

    let failures = 0;
    const checks = [
        ['resolve-image', `${base}/functions/v1/resolve-image`],
        ['resolve-meme', `${base}/functions/v1/resolve-meme`],
        ['score-submission', `${base}/functions/v1/score-submission`],
        ['og-tags (round)', `${base}/functions/v1/og-tags?roundId=probe`],
    ];

    for (const [name, url] of checks) {
        const ok = await probe(name, url, { headers: authHeaders });
        if (!ok) failures += 1;
    }

    console.log(`\nAPP_URL hint: ${productionUrl}`);
    console.log(failures
        ? '\nDeploy with: npm run deploy:edge-functions'
        : '\nEdge functions respond. Confirm secrets in Supabase dashboard.');
    process.exit(failures ? 1 : 0);
}

main();

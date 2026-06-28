#!/usr/bin/env node
/**
 * Run the full automated hosted rehearsal pipeline (local + deployed checks).
 * Usage: node scripts/run-hosted-rehearsal.mjs [--skip-e2e] [--skip-smoke]
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles } from './load-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const skipE2e = process.argv.includes('--skip-e2e');
const skipSmoke = process.argv.includes('--skip-smoke');

loadEnvFiles();

function run(label, command, args = [], { optional = false } = {}) {
    console.log(`\n── ${label} ──\n`);
    const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0 && !optional) {
        console.error(`\n✗ ${label} failed`);
        process.exit(result.status ?? 1);
    }
    return result.status === 0;
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const productionUrl = process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';

console.log('Venn with Friends — full hosted rehearsal runner\n');

run('Init env (if needed)', process.execPath, ['scripts/init-env-local.mjs'], { optional: true });
run('Hosted preflight', npm, ['run', 'rehearsal:preflight']);

if (!skipSmoke) {
    run('Production smoke', process.execPath, ['scripts/production-smoke.mjs'], {
        optional: !process.env.VITE_SUPABASE_URL,
    });
}

if (!skipE2e) {
    process.env.PRODUCTION_URL = productionUrl;
    run(`Deployed E2E (${productionUrl})`, npm, ['run', 'test:e2e:rehearsal'], { optional: true });
}

run('Manual checklist', process.execPath, ['scripts/record-rehearsal-checklist.mjs'], { optional: true });
run('Telemetry validation guide', process.execPath, ['scripts/validate-telemetry-sink.mjs'], { optional: true });

console.log('\nAutomated rehearsal complete. Finish manual checks in PRODUCTION_REHEARSAL.md §4–6.\n');

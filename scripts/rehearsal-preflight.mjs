#!/usr/bin/env node
/**
 * Hosted rehearsal preflight — env vars, optional Supabase RPC probe, local release gate.
 * Usage: node scripts/rehearsal-preflight.mjs [--skip-verify]
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const skipVerify = process.argv.includes('--skip-verify');

function run(label, scriptRelative, extraArgs = [], { optional = false } = {}) {
    console.log(`\n── ${label} ──\n`);
    const scriptPath = resolve(root, scriptRelative);
    const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
        cwd: root,
        stdio: 'inherit',
        shell: false,
    });
    if (result.status !== 0 && !optional) {
        console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
        process.exit(result.status ?? 1);
    }
    return result.status === 0;
}

console.log('Venn with Friends — hosted rehearsal preflight\n');

run('Environment variables', 'scripts/check-hosted-env.mjs');
run('Supabase RPCs', 'scripts/check-supabase-rpcs.mjs', [], { optional: true });
run('Edge functions', 'scripts/check-edge-functions.mjs', [], { optional: true });

if (!skipVerify) {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    run('Release verification (lint + test + e2e + build)', npmCmd, ['run', 'verify:release']);
}

console.log('\n── Manual steps (deployed site) ──\n');
console.log('1. Open the deployed URL and confirm Runtime Status shows expected services.');
console.log('2. Complete solo, memes & videos, friend-judge, and multiplayer flows.');
console.log('3. Follow PRODUCTION_REHEARSAL.md sections 4–6 for the full launch gate.');
console.log('\nOptional: npm run smoke:production  (set PRODUCTION_URL if not using Vercel default)');
console.log('Optional: PRODUCTION_URL=https://your-site npm run test:e2e:rehearsal\n');
console.log('Preflight complete.\n');

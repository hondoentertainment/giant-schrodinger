#!/usr/bin/env node
/**
 * Runs every automated launch-gate check that does not require manual two-browser QA.
 * Credential-dependent probes warn instead of failing when Supabase is not configured.
 * Usage: npm run launch:gate
 */
import { spawnSync } from 'node:child_process';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';

function run(label, command, args = [], { env = {}, optional = false } = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    if (optional) {
      console.warn(`⚠ ${label} skipped or incomplete (credentials may be missing)`);
      return false;
    }
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
  return true;
}

console.log('Venn with Friends — automated launch gate\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

run('Local rehearsal status', 'npm', ['run', 'rehearsal:status'], { optional: true });
const envOk = run('Hosted env check', 'npm', ['run', 'check:hosted-env'], { optional: true });
if (envOk) {
  run('Supabase RPC probe', 'npm', ['run', 'check:supabase-rpcs'], { optional: true });
  run('Edge function probe', 'npm', ['run', 'check:edge-functions'], { optional: true });
} else {
  console.log('\n○ Skipping RPC + edge probes — set VITE_SUPABASE_* in .env.local first');
}

run('Production smoke', 'npm', ['run', 'smoke:production'], { env: { PRODUCTION_URL } });
run('Deployed E2E rehearsal', 'npm', ['run', 'test:e2e:rehearsal'], { env: { PRODUCTION_URL } });

console.log(`
Automated launch gate complete.

${envOk ? 'Backend probes ran.' : 'Backend probes skipped — add Supabase credentials to .env.local and Vercel.'}

Manual steps still required (PRODUCTION_REHEARSAL.md §4–6):
  1. Apply supabase/schema.sql in Supabase SQL editor
  2. Deploy edge functions — npm run deploy:edge-functions
  3. Set secrets — .github/SECRETS.template.md
  4. Two-browser friend judging + multiplayer vote finalize
  5. npm run rehearsal:telemetry in browser
`);

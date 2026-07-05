#!/usr/bin/env node
/**
 * Backend launch setup orchestrator — runs every automated step that does not
 * require the Supabase dashboard login in this shell.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const schemaPath = resolve(root, 'supabase', 'schema.sql');

function run(label, command, args = [], { optional = false } = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0 && !optional) {
    console.error(`\n✗ ${label} failed`);
    return false;
  }
  if (result.status !== 0) {
    console.warn(`⚠ ${label} incomplete`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

console.log('Venn with Friends — backend setup\n');

run('Bootstrap .env.local', 'npm', ['run', 'init:env'], { optional: true });
run('Sync Vercel production env', 'npm', ['run', 'sync:env'], { optional: true });
run('Rehearsal status', 'npm', ['run', 'rehearsal:status'], { optional: true });
run('Vercel env check', 'npm', ['run', 'check:vercel-env'], { optional: true });
run('Hosted env check', 'npm', ['run', 'check:hosted-env'], { optional: true });

const hasSupabase = spawnSync('npm', ['run', 'check:hosted-env'], {
  cwd: root,
  stdio: 'ignore',
  shell: process.platform === 'win32',
}).status === 0;

if (hasSupabase) {
  run('Supabase RPC probe', 'npm', ['run', 'check:supabase-rpcs'], { optional: true });
  run('Edge function probe', 'npm', ['run', 'check:edge-functions'], { optional: true });
}

console.log(`
────────────────────────────────────────────────────────
Manual steps (Supabase dashboard — cannot automate here):

1. Create a project at https://supabase.com
2. SQL Editor → paste contents of:
   ${schemaPath}
3. Project Settings → API → copy URL + anon key into:
   • .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   • Vercel production env (vercel env add …)
   • GitHub repo secrets (.github/SECRETS.template.md)
4. Install Supabase CLI: npm i -g supabase
5. Edge function secrets + deploy:
   npm run deploy:edge-functions
6. Re-run: npm run launch:gate
7. Two-browser rehearsal: PRODUCTION_REHEARSAL.md §4–6
────────────────────────────────────────────────────────
`);

process.exit(0);

#!/usr/bin/env node
/**
 * Deploy Supabase edge functions when the CLI is linked; otherwise print setup steps.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const configPath = resolve(root, 'supabase', 'config.toml');

const FUNCTIONS = ['resolve-image', 'resolve-meme', 'score-submission', 'og-tags'];

function run(label, command, args, { optional = false } = {}) {
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
  return result.status === 0;
}

function isLinked() {
  if (!existsSync(configPath)) return false;
  const config = readFileSync(configPath, 'utf8');
  return /project_id\s*=\s*"(?!YOUR_PROJECT_REF)[^"]+"/.test(config);
}

console.log('Supabase edge function deploy\n');

const cliCheck = spawnSync('npx', ['supabase', '--version'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (cliCheck.status !== 0) {
  console.log('Install CLI: npm i -g supabase   (or use npx supabase)');
}

if (!isLinked()) {
  console.log(`
Project not linked yet. Complete these steps:

1. Create a project at https://supabase.com
2. SQL Editor → paste supabase/schema.sql
3. supabase login
4. supabase link --project-ref YOUR_PROJECT_REF

Set secrets (Supabase dashboard → Edge Functions → Secrets):
  GEMINI_API_KEY, PEXELS_API_KEY, GIPHY_API_KEY
  APP_URL=https://giant-schrodinger.vercel.app
  ALLOWED_ORIGINS=https://giant-schrodinger.vercel.app
  SUPABASE_URL, SUPABASE_ANON_KEY

Then re-run: npm run deploy:edge-functions
`);
  process.exit(1);
}

let ok = true;
for (const fn of FUNCTIONS) {
  if (!run(`Deploy ${fn}`, 'npx', ['supabase', 'functions', 'deploy', fn])) {
    ok = false;
  }
}

if (ok) {
  console.log('\n✓ Edge functions deployed');
  console.log('Verify: npm run check:edge-functions && npm run launch:gate');
}

process.exit(ok ? 0 : 1);

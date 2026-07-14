#!/usr/bin/env node
/**
 * Configure GitHub Actions secrets for hosted rehearsal CI.
 * Sets PRODUCTION_URL always; sets Supabase secrets when provided.
 *
 * Usage:
 *   npm run configure:github-secrets
 *   VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npm run configure:github-secrets
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles } from './load-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

loadEnvFiles();

const PRODUCTION_URL =
  process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI = process.env.VITE_GEMINI_API_KEY;

function setSecret(name, value) {
  if (!value || value.includes('your-')) {
    console.log(`○ skip ${name} (not set)`);
    return false;
  }
  console.log(`▶ set ${name}`);
  const result = spawnSync('gh', ['secret', 'set', name], {
    cwd: root,
    input: value,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`✗ failed to set ${name}`);
    if (result.stderr) console.error(result.stderr.trim());
    return false;
  }
  console.log(`✓ ${name}`);
  return true;
}

console.log('Configure GitHub Actions secrets\n');

const auth = spawnSync('gh', ['auth', 'status'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (auth.status !== 0) {
  console.error('✗ gh not authenticated. Run: gh auth login');
  process.exit(1);
}

let ok = true;
ok = setSecret('PRODUCTION_URL', PRODUCTION_URL) && ok;

if (SUPABASE_URL && SUPABASE_ANON && !SUPABASE_URL.includes('your-')) {
  ok = setSecret('VITE_SUPABASE_URL', SUPABASE_URL) && ok;
  ok = setSecret('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON) && ok;
} else {
  console.log('○ VITE_SUPABASE_* skipped — set after configure:supabase');
}

if (GEMINI && GEMINI.length > 10) {
  ok = setSecret('VITE_GEMINI_API_KEY', GEMINI) && ok;
} else {
  console.log('○ VITE_GEMINI_API_KEY skipped (optional / invalid)');
}

console.log(`
Next:
  • With Supabase: npm run configure:supabase then re-run this script
  • Verify: gh secret list
  • Full gate: npm run launch:gate
`);

process.exit(ok ? 0 : 1);

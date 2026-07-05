#!/usr/bin/env node
/**
 * Report which required Vercel environment variables are missing.
 */
import { spawnSync } from 'node:child_process';

const REQUIRED = [
  { key: 'VITE_SUPABASE_URL', label: 'Supabase project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase anon key' },
];

const OPTIONAL = [
  { key: 'VITE_GEMINI_API_KEY', label: 'Gemini (fusion images in dev)' },
  { key: 'VITE_SENTRY_DSN', label: 'Sentry error monitoring' },
  { key: 'VITE_POSTHOG_KEY', label: 'PostHog analytics' },
];

function parseVercelEnvList(output) {
  const found = new Set();
  for (const line of output.split(/\r?\n/)) {
    for (const { key } of [...REQUIRED, ...OPTIONAL]) {
      if (line.includes(key)) found.add(key);
    }
  }
  return found;
}

console.log('Vercel production environment check\n');

const result = spawnSync('vercel', ['env', 'ls'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.log('○ Could not read Vercel env (run vercel link in project root)');
  process.exit(0);
}

const found = parseVercelEnvList(result.stdout || '');
let missingRequired = 0;

for (const { key, label } of REQUIRED) {
  if (found.has(key)) {
    console.log(`✓ ${key} — set on Vercel`);
  } else {
    console.log(`✗ ${key} — missing (${label})`);
    missingRequired += 1;
  }
}

for (const { key, label } of OPTIONAL) {
  console.log(`${found.has(key) ? '✓' : '○'} ${key} — ${found.has(key) ? 'set' : `optional (${label})`}`);
}

if (missingRequired) {
  console.log('\nAdd missing vars: vercel env add VITE_SUPABASE_URL production');
  console.log('                 vercel env add VITE_SUPABASE_ANON_KEY production');
  process.exit(1);
}

console.log('\nVercel production env looks ready for Supabase-backed features.');
process.exit(0);

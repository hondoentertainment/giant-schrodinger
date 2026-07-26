#!/usr/bin/env node
/**
 * Write Supabase credentials to .env.local and push them to Vercel production.
 *
 * Usage:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... npm run configure:supabase
 *
 * Or pass as CLI args:
 *   npm run configure:supabase -- https://xxx.supabase.co eyJ...
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const localPath = resolve(root, '.env.local');

const url = process.env.VITE_SUPABASE_URL || process.argv[2];
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.argv[3];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

if (!url || !anonKey) {
  console.log(`Configure Supabase for local dev + Vercel production.

Required environment variables:
  VITE_SUPABASE_URL       https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY  anon public key from Supabase → Settings → API

Example:
  VITE_SUPABASE_URL=https://abc.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... npm run configure:supabase

After schema + edge functions are ready:
  npm run launch:gate
`);
  process.exit(1);
}

if (!isValidUrl(url)) fail('VITE_SUPABASE_URL must be https://YOUR_PROJECT.supabase.co');
if (anonKey.length < 20 || anonKey.includes('your-')) {
  fail('VITE_SUPABASE_ANON_KEY looks invalid');
}

function parseEnv(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

function serializeEnv(map, original = '') {
  const lines = original.split(/\r?\n/);
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (!trimmed.startsWith('VERCEL_')) output.push(line);
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      output.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (key.startsWith('VERCEL_')) continue;
    if (map.has(key)) {
      output.push(`${key}=${map.get(key)}`);
      seen.add(key);
    } else {
      output.push(line);
    }
  }

  for (const [key, value] of map) {
    if (!seen.has(key) && value) output.push(`${key}=${value}`);
  }

  return `${output.filter((line, index, arr) => !(index === arr.length - 1 && line === '')).join('\n')}\n`;
}

const keys = {
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_ANON_KEY: anonKey,
};

if (!existsSync(localPath)) {
  writeFileSync(localPath, '# Venn with Friends local env\n');
}

const localMap = parseEnv(readFileSync(localPath, 'utf8'));
if (!localMap.get('PRODUCTION_URL')) {
  localMap.set('PRODUCTION_URL', 'https://giant-schrodinger.vercel.app');
}
for (const [key, value] of Object.entries(keys)) {
  localMap.set(key, value);
}

writeFileSync(localPath, serializeEnv(localMap, readFileSync(localPath, 'utf8')));
console.log('✓ Updated .env.local with Supabase credentials');

function pushVercelEnv(key, value) {
  console.log(`\n▶ vercel env add ${key} production`);
  const result = spawnSync('vercel', ['env', 'add', key, 'production'], {
    cwd: root,
    input: value,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status === 0) {
    console.log(`✓ ${key} added to Vercel production`);
    return true;
  }
  const combined = `${result.stdout || ''}${result.stderr || ''}`;
  if (/already exists|Environment Variable .* already/i.test(combined)) {
    console.log(`○ ${key} already on Vercel — run "vercel env rm ${key} production" then re-run to rotate`);
    return false;
  }
  console.warn(`⚠ Could not add ${key} to Vercel (is the project linked?)`);
  if (combined.trim()) console.warn(combined.trim());
  return false;
}

let vercelOk = true;
for (const [key, value] of Object.entries(keys)) {
  if (!pushVercelEnv(key, value)) vercelOk = false;
}

console.log(`
Next steps:
  1. Supabase SQL Editor → run supabase/schema.sql
  2. supabase login && supabase link --project-ref YOUR_REF
  3. Set edge secrets + npm run deploy:edge-functions
  4. npm run launch:gate
`);

process.exit(vercelOk ? 0 : 1);

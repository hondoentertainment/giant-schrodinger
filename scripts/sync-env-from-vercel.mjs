#!/usr/bin/env node
/**
 * Merge VITE_* and PRODUCTION_URL from Vercel production into .env.local.
 * Requires: vercel CLI linked to the project.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const localPath = resolve(root, '.env.local');
const vercelEnvPath = resolve(root, '.env.vercel.production');
const examplePath = resolve(root, '.env.example');

const MERGE_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
  'VITE_POSTHOG_HOST',
  'PRODUCTION_URL',
];

function parseEnv(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\r/g, '').trim();
    map.set(key, value);
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
      output.push(line);
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      output.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (map.has(key)) {
      output.push(`${key}=${map.get(key)}`);
      seen.add(key);
    } else {
      output.push(line);
    }
  }

  for (const key of MERGE_KEYS) {
    if (!seen.has(key) && map.has(key) && map.get(key)) {
      output.push(`${key}=${map.get(key)}`);
    }
  }

  return `${output.filter((line, index, arr) => !(index === arr.length - 1 && line === '')).join('\n')}\n`;
}

if (!existsSync(localPath)) {
  if (existsSync(examplePath)) {
    writeFileSync(localPath, readFileSync(examplePath, 'utf8'));
    console.log('Created .env.local from .env.example');
  } else {
    writeFileSync(localPath, '# Venn with Friends local env\n');
  }
}

console.log('Pulling Vercel production environment variables…');
const pull = spawnSync('vercel', ['env', 'pull', '.env.vercel.production', '--environment=production', '-y'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (pull.status !== 0) {
  console.error('Failed to pull Vercel env. Run: vercel link');
  process.exit(pull.status ?? 1);
}

if (!existsSync(vercelEnvPath)) {
  console.error('Expected .env.vercel.production after pull');
  process.exit(1);
}

const vercelMap = parseEnv(readFileSync(vercelEnvPath, 'utf8'));
const localMap = parseEnv(readFileSync(localPath, 'utf8'));

if (!localMap.get('PRODUCTION_URL')) {
  localMap.set('PRODUCTION_URL', 'https://giant-schrodinger.vercel.app');
}

let merged = 0;
for (const key of MERGE_KEYS) {
  const value = vercelMap.get(key);
  if (!value || value.includes('your-')) continue;
  const current = localMap.get(key);
  if (!current || current.includes('your-')) {
    localMap.set(key, value);
    merged += 1;
    console.log(`✓ merged ${key}`);
  }
}

writeFileSync(localPath, serializeEnv(localMap, readFileSync(localPath, 'utf8')));
console.log(`\nUpdated .env.local (${merged} key(s) merged from Vercel).`);
console.log('Still required manually: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
console.log('Next: npm run setup:backend');

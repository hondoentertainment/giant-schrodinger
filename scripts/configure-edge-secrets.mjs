#!/usr/bin/env node
/**
 * Set Supabase Edge Function secrets from .env.local / process env.
 *
 * Usage:
 *   npm run configure:edge-secrets
 *   PEXELS_API_KEY=… GIPHY_API_KEY=… npm run configure:edge-secrets
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFiles } from './load-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const configPath = resolve(root, 'supabase', 'config.toml');

loadEnvFiles();

function readProjectRef() {
  if (!existsSync(configPath)) return null;
  const config = readFileSync(configPath, 'utf8');
  const match = config.match(/project_id\s*=\s*"([^"]+)"/);
  if (!match || match[1] === 'YOUR_PROJECT_REF') return null;
  return match[1];
}

function isPlaceholder(value) {
  if (!value) return true;
  const lower = String(value).toLowerCase();
  return lower.includes('your-') || lower.includes('changeme') || lower === 'xxx';
}

function clean(value) {
  return String(value || '').replace(/\r?\n/g, '').trim();
}

const projectRef = readProjectRef();
if (!projectRef) {
  console.error('✗ No project_id in supabase/config.toml. Run: npx supabase link --project-ref …');
  process.exit(1);
}

const APP_URL = clean(process.env.APP_URL || process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app');
const ALLOWED_ORIGINS = clean(process.env.ALLOWED_ORIGINS || APP_URL);
const GEMINI = clean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
const PEXELS = clean(process.env.PEXELS_API_KEY);
const GIPHY = clean(process.env.GIPHY_API_KEY);
const DISCORD_PUBLIC_KEY = clean(process.env.DISCORD_PUBLIC_KEY);

const secrets = {
  APP_URL,
  ALLOWED_ORIGINS,
};

console.log(`Configure Supabase edge secrets for ${projectRef}\n`);

const optional = [
  ['GEMINI_API_KEY', GEMINI],
  ['PEXELS_API_KEY', PEXELS],
  ['GIPHY_API_KEY', GIPHY],
  ['DISCORD_PUBLIC_KEY', DISCORD_PUBLIC_KEY],
];

for (const [name, value] of optional) {
  if (isPlaceholder(value)) {
    console.log(`○ skip ${name} (not set in env)`);
  } else {
    secrets[name] = value;
    console.log(`• will set ${name}`);
  }
}

const envFile = join(tmpdir(), `vwf-edge-secrets-${Date.now()}.env`);
const body = Object.entries(secrets)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');
writeFileSync(envFile, `${body}\n`, 'utf8');

console.log(`▶ supabase secrets set --env-file (${Object.keys(secrets).length} values)`);
const result = spawnSync(
  'npx',
  ['supabase', 'secrets', 'set', '--env-file', envFile, '--project-ref', projectRef],
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

try {
  unlinkSync(envFile);
} catch {
  // ignore cleanup failures
}

if (result.status !== 0) {
  console.error('\n✗ Failed to set secrets. Ensure: npx supabase login');
  process.exit(1);
}

console.log(`
✓ Edge secrets updated.

Next:
  • npm run deploy:edge-functions
  • For richer stock/meme media, add PEXELS_API_KEY / GIPHY_API_KEY to .env.local and re-run
  • For Discord interactions, set DISCORD_PUBLIC_KEY then redeploy discord-bot
`);

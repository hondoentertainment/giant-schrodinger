#!/usr/bin/env node
/**
 * Summarize hosted rehearsal readiness from .env.local (no network required).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles } from './load-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

loadEnvFiles();

function envStatus(key, { optional = false } = {}) {
    const value = process.env[key];
    if (!value || value.includes('your-')) {
        return optional ? 'optional (missing)' : 'missing';
    }
    return 'set';
}

const checks = [
    ['VITE_SUPABASE_URL', envStatus('VITE_SUPABASE_URL')],
    ['VITE_SUPABASE_ANON_KEY', envStatus('VITE_SUPABASE_ANON_KEY')],
    ['VITE_GEMINI_API_KEY', envStatus('VITE_GEMINI_API_KEY', { optional: true })],
    ['PRODUCTION_URL', envStatus('PRODUCTION_URL', { optional: true })],
    ['VITE_POSTHOG_KEY', envStatus('VITE_POSTHOG_KEY', { optional: true })],
    ['VITE_SENTRY_DSN', envStatus('VITE_SENTRY_DSN', { optional: true })],
];

const envLocal = resolve(root, '.env.local');
const hasEnvLocal = existsSync(envLocal);

console.log('Venn with Friends — hosted rehearsal status\n');
console.log(`.env.local: ${hasEnvLocal ? 'present' : 'missing (run npm run init:env)'}\n`);

for (const [key, status] of checks) {
    console.log(`  ${status === 'set' ? '✓' : status.startsWith('optional') ? '○' : '✗'} ${key}: ${status}`);
}

console.log('\nNext commands:');
if (!hasEnvLocal) console.log('  npm run init:env');
console.log('  npm run rehearsal:preflight:fast   # env + RPC probe');
console.log('  npm run rehearsal:run              # full automated pipeline');
console.log('  npm run rehearsal:checklist        # manual two-browser steps');
console.log('\nLaunch gate still requires: Supabase schema, edge functions, and manual §4–6 in PRODUCTION_REHEARSAL.md');

if (hasEnvLocal) {
    const content = readFileSync(envLocal, 'utf8');
    if (content.includes('your-project') || content.includes('your-anon')) {
        console.log('\n⚠ Replace placeholder values in .env.local before expecting RPC probes to pass.');
    }
}

#!/usr/bin/env node
/**
 * Pre-flight check for hosted rehearsal env vars.
 * Loads .env / .env.local automatically.
 * Usage: node scripts/check-hosted-env.mjs
 */
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const required = [
    { key: 'VITE_SUPABASE_URL', label: 'Supabase project URL', validate: (v) => /^https:\/\/.+\.supabase\.co/.test(v) },
    { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase anon key', validate: (v) => v.length > 20 },
];

const optional = [
    { key: 'VITE_GEMINI_API_KEY', label: 'Gemini API key (AI scoring + fusion images)', validate: (v) => v.length > 10 },
];

let hasErrors = false;

console.log('Hosted rehearsal environment check\n');

for (const { key, label, validate } of required) {
    const value = process.env[key];
    if (!value || value.includes('your-') || !validate(value)) {
        console.log(`✗ ${key} — missing or invalid (${label})`);
        hasErrors = true;
    } else {
        console.log(`✓ ${key}`);
    }
}

for (const { key, label, validate } of optional) {
    const value = process.env[key];
    if (!value || value.includes('your-') || !validate(value)) {
        console.log(`○ ${key} — not set (${label})`);
    } else {
        console.log(`✓ ${key}`);
    }
}

console.log('\nNext: npm run check:supabase-rpcs  →  npm run rehearsal:preflight');

process.exit(hasErrors ? 1 : 0);

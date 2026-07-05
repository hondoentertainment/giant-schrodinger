#!/usr/bin/env node
/**
 * Bootstrap .env.local from .env.example when missing.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const examplePath = resolve(root, '.env.example');
const localPath = resolve(root, '.env.local');

if (!existsSync(examplePath)) {
    console.error('Missing .env.example');
    process.exit(1);
}

if (existsSync(localPath)) {
    console.log('.env.local already exists — edit it with your Supabase and Gemini keys.');
    console.log('\nNext: npm run check:hosted-env');
    process.exit(0);
}

copyFileSync(examplePath, localPath);
let content = readFileSync(localPath, 'utf8');
if (!content.includes('PRODUCTION_URL=')) {
    content = `${content.trim()}\nPRODUCTION_URL=https://giant-schrodinger.vercel.app\n`;
    writeFileSync(localPath, content);
}
console.log('Created .env.local from .env.example');
console.log('\nFill in at minimum:');
console.log('  VITE_SUPABASE_URL');
console.log('  VITE_SUPABASE_ANON_KEY');
console.log('\nOptional: VITE_GEMINI_API_KEY for live AI scoring');
console.log('\nThen run: npm run setup:backend');

const content = readFileSync(localPath, 'utf8');
if (content.includes('your-project') || content.includes('your-anon')) {
    console.log('\n⚠ Replace placeholder values before running hosted rehearsal.');
}

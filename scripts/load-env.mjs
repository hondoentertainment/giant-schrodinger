#!/usr/bin/env node
/**
 * Load .env and .env.local into process.env (does not overwrite existing vars).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function parseEnvFile(content) {
    const vars = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        vars[key] = value;
    }
    return vars;
}

export function loadEnvFiles(root = repoRoot) {
    const files = ['.env', '.env.local'];
    for (const file of files) {
        const path = resolve(root, file);
        if (!existsSync(path)) continue;
        const parsed = parseEnvFile(readFileSync(path, 'utf8'));
        for (const [key, value] of Object.entries(parsed)) {
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
    loadEnvFiles();
    console.log('Loaded env files into process.env (existing vars preserved).');
}

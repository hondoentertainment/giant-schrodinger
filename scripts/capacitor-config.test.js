import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('capacitor.config', () => {
    const source = readFileSync(join(root, 'capacitor.config.json'), 'utf8');

    it('ships the App Store identity and webDir', () => {
        expect(source).toContain('"appId": "com.hondoentertainment.vennwithfriends"');
        expect(source).toContain('"appName": "Venn with Friends"');
        expect(source).toContain('"webDir": "dist"');
        expect(source).toContain('"limitsNavigationsToAppBoundDomains": true');
        expect(source).toContain('giant-schrodinger.vercel.app');
    });
});

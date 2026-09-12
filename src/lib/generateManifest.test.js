import { describe, expect, it } from 'vitest';
import { generateManifest } from '../../scripts/generate-manifest.mjs';

describe('generateManifest', () => {
    it('installs as Venn, not a ranked demo', () => {
        const manifest = generateManifest('/');
        expect(manifest.start_url).toBe('/');
        expect(manifest.scope).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(manifest.display_override).toContain('standalone');
        expect(manifest.icons.some((icon) => icon.src === '/apple-touch-icon.png')).toBe(true);
        expect(manifest.icons.some((icon) => icon.src === '/icon-192.png')).toBe(true);
        expect(manifest.shortcuts.map((item) => item.name)).toEqual(["Today's pair", 'Play with friends']);
        expect(manifest.shortcuts.map((item) => item.url)).toEqual(['/#daily', '/#friends']);
        expect(JSON.stringify(manifest)).not.toMatch(/ranked/i);
        expect(JSON.stringify(manifest)).not.toMatch(/github\.io/);
    });
});

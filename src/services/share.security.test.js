import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseJudgeShareUrl, createJudgeShareUrl } from './share';

vi.mock('./backend.js', () => ({
    saveSharedRound: vi.fn().mockResolvedValue(null),
}));
vi.mock('../lib/supabase.js', () => ({
    isBackendEnabled: vi.fn().mockReturnValue(false),
}));

/**
 * Security tests: share URL parsing and payload handling.
 * Ensures malicious or malformed payloads do not cause XSS, prototype pollution,
 * or unexpected behavior.
 */
describe('share service - security', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            value: {
                origin: 'http://localhost:5173',
                pathname: '/',
                hash: '',
                search: '',
                replaceState: () => {},
            },
            writable: true,
        });
    });

    it('rejects payload with __proto__ (prototype pollution)', () => {
        const malicious = JSON.stringify({
            __proto__: { admin: true },
            assets: { left: {}, right: {} },
            submission: 'test',
        });
        const encoded = btoa(unescape(encodeURIComponent(malicious)));
        window.location.hash = `#judge=${encoded}`;
        const result = parseJudgeShareUrl();
        expect(result).not.toHaveProperty('__proto__');
        if (result) {
            expect(Object.getPrototypeOf(result)).not.toHaveProperty('admin');
        }
    });

    it('parses payload with constructor key as plain data (no exploit)', () => {
        const payload = JSON.stringify({
            constructor: 'some value',
            assets: { left: {}, right: {} },
            submission: 'test',
        });
        const encoded = btoa(unescape(encodeURIComponent(payload)));
        window.location.hash = `#judge=${encoded}`;
        const result = parseJudgeShareUrl();
        expect(result).toBeDefined();
        expect(result.assets).toBeDefined();
        expect(result.submission).toBe('test');
    });

    it('handles empty string in hash', () => {
        window.location.hash = '#judge=';
        expect(parseJudgeShareUrl()).toBeNull();
    });

    it('handles extremely long base64 string gracefully', () => {
        const long = 'x'.repeat(100000);
        const encoded = btoa(long);
        window.location.hash = `#judge=${encoded}`;
        expect(() => parseJudgeShareUrl()).not.toThrow();
        expect(parseJudgeShareUrl()).toBeNull();
    });

    it('does not execute script in parsed payload', async () => {
        const payload = {
            assets: {
                left: { label: '<script>alert(1)</script>' },
                right: { label: 'B' },
            },
            submission: '<img src=x onerror=alert(1)>',
        };
        const url = await createJudgeShareUrl(payload);
        expect(url).toBeTruthy();
        const encoded = url?.split('#judge_')[1] || url?.split('#judge=')[1];
        if (encoded) {
            window.location.hash = `#judge_${encoded}`;
            const result = parseJudgeShareUrl();
            expect(result).toBeDefined();
            expect(result.assets.left.label).toContain('script');
            expect(result.submission).toContain('onerror');
            // Values are strings, not executed - React will escape when rendering
        }
    });

    it('handles null/undefined in payload', async () => {
        const payload = { assets: null, submission: undefined };
        const url = await createJudgeShareUrl(payload);
        expect(url).toBeTruthy();
    });

    it('rejects non-UUID strings in query param', () => {
        window.location.search = '?judge=../../../etc/passwd';
        window.location.hash = '';
        const result = parseJudgeShareUrl();
        expect(result).toBeNull();
    });

    it('accepts valid UUID with different casing', () => {
        window.location.search = '?judge=A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
        window.location.hash = '';
        const result = parseJudgeShareUrl();
        expect(result).toEqual({ backendId: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890' });
    });
});

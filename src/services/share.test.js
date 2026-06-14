import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createJudgeShareUrl,
    parseJudgeShareUrl,
    clearJudgeFromUrl,
} from './share';

// Mock backend imports so createJudgeShareUrl falls through to hash encoding
vi.mock('./backend.js', () => ({
    saveSharedRound: vi.fn().mockResolvedValue(null),
}));
vi.mock('../lib/supabase.js', () => ({
    isBackendEnabled: vi.fn().mockReturnValue(false),
}));

describe('share service', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            value: {
                origin: 'http://localhost:5173',
                pathname: '/',
                hash: '',
                search: '',
                replaceState: vi.fn(),
            },
            writable: true,
        });
    });

    describe('createJudgeShareUrl', () => {
        it('creates URL with encoded payload (backend unavailable)', async () => {
            const payload = {
                assets: { left: { label: 'A' }, right: { label: 'B' } },
                submission: 'test',
            };
            const url = await createJudgeShareUrl(payload);
            expect(url).toContain('#judge_');
            expect(url).toMatch(/^http:\/\/localhost:5173\/#judge_/);
        });

        it('returns null on serialization error', async () => {
            const circular = {};
            circular.self = circular;
            const url = await createJudgeShareUrl(circular);
            expect(url).toBeNull();
        });
    });

    describe('parseJudgeShareUrl', () => {
        it('returns null when no judge param in hash or search', () => {
            window.location.hash = '';
            window.location.search = '';
            expect(parseJudgeShareUrl()).toBeNull();
        });

        it('parses UUID from query param as backendId', () => {
            window.location.search = '?judge=a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            window.location.hash = '';
            const result = parseJudgeShareUrl();
            expect(result).toEqual({ backendId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
        });

        it('parses base64 JSON from hash (legacy judge= prefix)', () => {
            const payload = {
                assets: { left: { label: 'Cat' }, right: { label: 'Dog' } },
                submission: 'both are fluffy',
            };
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
            window.location.hash = `#judge=${encoded}`;
            window.location.search = '';
            const result = parseJudgeShareUrl();
            expect(result).toEqual(payload);
        });

        it('parses base64 JSON from hash (new judge_ prefix)', () => {
            const payload = {
                assets: { left: { label: 'Cat' }, right: { label: 'Dog' } },
                submission: 'both are fluffy',
            };
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
            window.location.hash = `#judge_${encoded}`;
            window.location.search = '';
            const result = parseJudgeShareUrl();
            expect(result).toEqual(payload);
        });

        it('returns null for malformed base64', () => {
            window.location.hash = '#judge=not-valid-base64!!!';
            window.location.search = '';
            expect(parseJudgeShareUrl()).toBeNull();
        });

        it('returns null for invalid JSON in base64', () => {
            const badJson = btoa('{invalid json}');
            window.location.hash = `#judge=${badJson}`;
            expect(parseJudgeShareUrl()).toBeNull();
        });
    });

    describe('clearJudgeFromUrl', () => {
        it('calls history.replaceState when available', () => {
            const replaceState = vi.fn();
            const orig = window.history.replaceState;
            window.history.replaceState = replaceState;
            try {
                clearJudgeFromUrl();
                expect(replaceState).toHaveBeenCalledWith(null, '', expect.any(String));
            } finally {
                window.history.replaceState = orig;
            }
        });
    });
});

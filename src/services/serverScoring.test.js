import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock supabase module - controlled per-test via isBackendEnabled mock
vi.mock('../lib/supabase', () => ({
    isBackendEnabled: vi.fn(() => true),
    supabase: {},
}));

// Mock errorMonitoring so we can assert logError calls
vi.mock('./errorMonitoring', () => ({
    logError: vi.fn(),
}));

const ORIGINAL_URL = import.meta.env.VITE_SUPABASE_URL;
const ORIGINAL_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function freshImport({ url = 'https://example.supabase.co', anonKey = 'test-anon-key', backendEnabled = true } = {}) {
    vi.resetModules();
    // Set env before (re)import so module-level SERVER_SCORE_URL picks it up
    import.meta.env.VITE_SUPABASE_URL = url;
    import.meta.env.VITE_SUPABASE_ANON_KEY = anonKey;

    // Re-mock isBackendEnabled with the fresh value
    const supabaseMod = await import('../lib/supabase');
    supabaseMod.isBackendEnabled.mockReturnValue(backendEnabled);

    return await import('./serverScoring');
}

describe('serverScoring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        import.meta.env.VITE_SUPABASE_URL = ORIGINAL_URL;
        import.meta.env.VITE_SUPABASE_ANON_KEY = ORIGINAL_ANON;
    });

    it('returns null when VITE_SUPABASE_URL is not set', async () => {
        const { scoreViaServer } = await freshImport({ url: '' });

        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('my answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns null when backend is disabled', async () => {
        const { scoreViaServer } = await freshImport({ backendEnabled: false });

        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends POST to score-submission endpoint with the correct body', async () => {
        const { scoreViaServer } = await freshImport();

        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ score: 7 }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const conceptLeft = { label: 'Cat' };
        const conceptRight = { label: 'Dog' };
        await scoreViaServer('fuzzy', conceptLeft, conceptRight, 'hard');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0];
        expect(url).toBe('https://example.supabase.co/functions/v1/score-submission');
        expect(opts.method).toBe('POST');
        expect(JSON.parse(opts.body)).toEqual({
            conceptLeft,
            conceptRight,
            submission: 'fuzzy',
            difficulty: 'hard',
        });
    });

    it('includes Authorization Bearer header with anon key', async () => {
        const { scoreViaServer } = await freshImport();

        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ score: 5 }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, opts] = fetchMock.mock.calls[0];
        expect(opts.headers.Authorization).toBe('Bearer test-anon-key');
        expect(opts.headers['Content-Type']).toBe('application/json');
    });

    it('returns parsed JSON when response is 200 OK', async () => {
        const { scoreViaServer } = await freshImport();

        const payload = { score: 8, breakdown: { wit: 2, logic: 2, originality: 2, clarity: 2 } };
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => payload,
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toEqual(payload);
    });

    it('returns null on non-200 response', async () => {
        const { scoreViaServer } = await freshImport();

        const fetchMock = vi.fn(async () => ({
            ok: false,
            status: 500,
            json: async () => ({ error: 'boom' }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
    });

    it('defaults difficulty to "normal" when omitted', async () => {
        const { scoreViaServer } = await freshImport();

        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ score: 5 }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, opts] = fetchMock.mock.calls[0];
        const body = JSON.parse(opts.body);
        expect(body.difficulty).toBe('normal');
    });

    it('returns null and logs error when fetch rejects', async () => {
        const { scoreViaServer } = await freshImport();
        const { logError } = await import('./errorMonitoring');

        const fetchMock = vi.fn(async () => {
            throw new Error('network down');
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
        expect(logError).toHaveBeenCalledWith({
            message: 'serverScoring.fetch failed: network down',
            source: 'serverScoring',
        });
    });

    it('returns null and logs error when response JSON is malformed', async () => {
        const { scoreViaServer } = await freshImport();
        const { logError } = await import('./errorMonitoring');

        const fetchMock = vi.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('Unexpected token < in JSON');
            },
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
        expect(logError).toHaveBeenCalledWith({
            message: 'serverScoring.json parse failed: Unexpected token < in JSON',
            source: 'serverScoring',
        });
    });

    it('logs auth error and returns null on 401 response', async () => {
        const { scoreViaServer } = await freshImport();
        const { logError } = await import('./errorMonitoring');

        const fetchMock = vi.fn(async () => ({
            ok: false,
            status: 401,
            json: async () => ({ error: 'unauthorized' }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await scoreViaServer('answer', { label: 'A' }, { label: 'B' });
        expect(result).toBeNull();
        expect(logError).toHaveBeenCalledWith({
            message: 'serverScoring.auth 401',
            source: 'serverScoring',
        });
    });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Re-import the module with a fresh state (fresh reporters array + DSN cache).
 */
async function freshImport({ dsn } = {}) {
    vi.resetModules();
    if (dsn === undefined) {
        delete import.meta.env.VITE_SENTRY_DSN;
    } else {
        import.meta.env.VITE_SENTRY_DSN = dsn;
    }
    return await import('./errorMonitoring');
}

describe('errorMonitoring', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        if (ORIGINAL_DSN === undefined) {
            delete import.meta.env.VITE_SENTRY_DSN;
        } else {
            import.meta.env.VITE_SENTRY_DSN = ORIGINAL_DSN;
        }
    });

    describe('parseSentryDsn', () => {
        it('parses a well-formed DSN', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn('https://abc@o1.ingest.sentry.io/2')).toEqual({
                publicKey: 'abc',
                host: 'o1.ingest.sentry.io',
                projectId: '2',
            });
        });

        it('returns null for garbage input', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn('garbage')).toBeNull();
        });

        it('returns null for empty string', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn('')).toBeNull();
        });

        it('returns null for null/undefined', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn(null)).toBeNull();
            expect(parseSentryDsn(undefined)).toBeNull();
        });

        it('returns null when public key is missing', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn('https://o1.ingest.sentry.io/2')).toBeNull();
        });

        it('returns null when project id is missing', async () => {
            const { parseSentryDsn } = await freshImport();
            expect(parseSentryDsn('https://abc@o1.ingest.sentry.io/')).toBeNull();
        });
    });

    describe('LocalStorageReporter', () => {
        it('writes errors to localStorage', async () => {
            const { LocalStorageReporter, getErrors } = await freshImport();
            LocalStorageReporter.report(
                { message: 'boom' },
                { userId: 'u1', url: 'http://x', userAgent: 'ua', timestamp: 't' }
            );
            const errors = getErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({ message: 'boom', userId: 'u1' });
        });

        it('trims stored errors to MAX_ERRORS (50)', async () => {
            const { LocalStorageReporter, getErrors } = await freshImport();
            for (let i = 0; i < 60; i += 1) {
                LocalStorageReporter.report(
                    { message: `err-${i}` },
                    { userId: 'u', url: '', userAgent: '', timestamp: '' }
                );
            }
            const errors = getErrors();
            expect(errors).toHaveLength(50);
            // Should have kept the most recent 50 (err-10 .. err-59).
            expect(errors[0].message).toBe('err-10');
            expect(errors[errors.length - 1].message).toBe('err-59');
        });
    });

    describe('registerErrorReporter + logError', () => {
        it('dispatches to every registered reporter', async () => {
            const { registerErrorReporter, logError } = await freshImport();
            const r1 = { report: vi.fn() };
            const r2 = { report: vi.fn() };
            registerErrorReporter(r1);
            registerErrorReporter(r2);

            logError({ message: 'x' });

            expect(r1.report).toHaveBeenCalledTimes(1);
            expect(r2.report).toHaveBeenCalledTimes(1);
            expect(r1.report.mock.calls[0][0]).toEqual({ message: 'x' });
            // context object is second arg
            const ctx = r1.report.mock.calls[0][1];
            expect(ctx).toHaveProperty('userId');
            expect(ctx).toHaveProperty('timestamp');
        });

        it('isolates reporters: a throwing reporter does not break others', async () => {
            const { registerErrorReporter, logError } = await freshImport();
            const bad = { report: vi.fn(() => { throw new Error('nope'); }) };
            const good = { report: vi.fn() };
            registerErrorReporter(bad);
            registerErrorReporter(good);

            expect(() => logError({ message: 'x' })).not.toThrow();
            expect(good.report).toHaveBeenCalledTimes(1);
        });
    });

    describe('SentryReporter', () => {
        it('does NOT call fetch when no DSN is configured', async () => {
            const { SentryReporter } = await freshImport({ dsn: undefined });
            const fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);

            SentryReporter.report(
                { message: 'boom' },
                { userId: 'u', url: '', userAgent: '', timestamp: '' }
            );

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('queues to localStorage (capped at 10) when no DSN is configured', async () => {
            const { SentryReporter } = await freshImport({ dsn: undefined });
            for (let i = 0; i < 15; i += 1) {
                SentryReporter.report(
                    { message: `m-${i}` },
                    { userId: 'u', url: '', userAgent: '', timestamp: '' }
                );
            }
            const queue = JSON.parse(localStorage.getItem('vwf_sentry_queue') || '[]');
            expect(queue).toHaveLength(10);
            expect(queue[0].message).toBe('m-5');
            expect(queue[9].message).toBe('m-14');
        });

        it('calls fetch exactly once with correct URL and X-Sentry-Auth header when DSN is valid', async () => {
            const { SentryReporter } = await freshImport({
                dsn: 'https://abc123@o12345.ingest.sentry.io/67890',
            });
            const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
            vi.stubGlobal('fetch', fetchMock);

            SentryReporter.report(
                { message: 'kaboom', source: 'test' },
                { userId: 'user-1', url: 'http://app/', userAgent: 'UA', timestamp: 't' }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, opts] = fetchMock.mock.calls[0];
            expect(url).toBe('https://o12345.ingest.sentry.io/api/67890/store/');
            expect(opts.method).toBe('POST');
            expect(opts.keepalive).toBe(true);
            expect(opts.headers['Content-Type']).toBe('application/json');
            expect(opts.headers['X-Sentry-Auth']).toContain('Sentry sentry_version=7');
            expect(opts.headers['X-Sentry-Auth']).toContain('sentry_key=abc123');
            expect(opts.headers['X-Sentry-Auth']).toContain('sentry_client=venn-with-friends/1.0');

            const body = JSON.parse(opts.body);
            expect(body.platform).toBe('javascript');
            expect(body.level).toBe('error');
            expect(body.message).toBe('kaboom');
            expect(body.tags.source).toBe('test');
            expect(body.user.id).toBe('user-1');
            expect(body.extra.url).toBe('http://app/');
            expect(body.exception.values[0]).toMatchObject({
                type: 'Error',
                value: 'kaboom',
            });
            // event_id is 32 hex chars, no dashes
            expect(body.event_id).toMatch(/^[a-f0-9]{32}$/);
        });

        it('does not throw when fetch rejects', async () => {
            const { SentryReporter } = await freshImport({
                dsn: 'https://abc123@o12345.ingest.sentry.io/67890',
            });
            const fetchMock = vi.fn(() => Promise.reject(new Error('network down')));
            vi.stubGlobal('fetch', fetchMock);

            expect(() => SentryReporter.report(
                { message: 'x' },
                { userId: 'u', url: '', userAgent: '', timestamp: '' }
            )).not.toThrow();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            // Let any pending microtask settle so the swallowed rejection doesn't
            // show up as an unhandled rejection.
            await Promise.resolve();
        });

        it('does NOT call fetch and warns once when DSN is malformed', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { SentryReporter } = await freshImport({ dsn: 'not-a-valid-dsn' });
            const fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);

            SentryReporter.report(
                { message: 'x' },
                { userId: 'u', url: '', userAgent: '', timestamp: '' }
            );
            SentryReporter.report(
                { message: 'y' },
                { userId: 'u', url: '', userAgent: '', timestamp: '' }
            );

            expect(fetchMock).not.toHaveBeenCalled();
            // Warning is emitted only once (lazy parse cache).
            expect(warnSpy).toHaveBeenCalledTimes(1);
            warnSpy.mockRestore();
        });
    });

    describe('getErrors / clearErrors / getErrorStats', () => {
        it('getErrors returns [] when no errors are stored', async () => {
            const { getErrors } = await freshImport();
            expect(getErrors()).toEqual([]);
        });

        it('clearErrors empties stored errors', async () => {
            const { LocalStorageReporter, getErrors, clearErrors } = await freshImport();
            LocalStorageReporter.report(
                { message: 'x' },
                { userId: 'u', url: '', userAgent: '', timestamp: 't' }
            );
            expect(getErrors()).toHaveLength(1);
            clearErrors();
            expect(getErrors()).toEqual([]);
        });

        it('getErrorStats computes totals and recency buckets', async () => {
            const { LocalStorageReporter, getErrorStats } = await freshImport();
            const now = Date.now();
            const within24h = new Date(now - 60_000).toISOString();
            const within7d = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
            const older = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

            LocalStorageReporter.report({ message: 'a' }, { userId: 'u', url: '', userAgent: '', timestamp: within24h });
            LocalStorageReporter.report({ message: 'b' }, { userId: 'u', url: '', userAgent: '', timestamp: within7d });
            LocalStorageReporter.report({ message: 'c' }, { userId: 'u', url: '', userAgent: '', timestamp: older });

            const stats = getErrorStats();
            expect(stats.total).toBe(3);
            expect(stats.last24h).toBe(1);
            expect(stats.last7d).toBe(2);
            expect(stats.mostRecent.message).toBe('c');
        });
    });

    describe('reportBoundaryError', () => {
        it('wraps a thrown error into a logError payload with ErrorBoundary source', async () => {
            const { reportBoundaryError, registerErrorReporter } = await freshImport();
            const reporter = { report: vi.fn() };
            registerErrorReporter(reporter);

            const err = new Error('render failed');
            reportBoundaryError(err, { componentStack: '  at Foo\n  at Bar' });

            expect(reporter.report).toHaveBeenCalledTimes(1);
            const [errorData] = reporter.report.mock.calls[0];
            expect(errorData.message).toBe('render failed');
            expect(errorData.source).toBe('ErrorBoundary');
            expect(errorData.componentStack).toContain('at Foo');
            expect(errorData.stack).toEqual(expect.any(String));
        });

        it('handles a null error gracefully', async () => {
            const { reportBoundaryError, registerErrorReporter } = await freshImport();
            const reporter = { report: vi.fn() };
            registerErrorReporter(reporter);

            expect(() => reportBoundaryError(null, null)).not.toThrow();
            expect(reporter.report).toHaveBeenCalledTimes(1);
            expect(reporter.report.mock.calls[0][0].message).toBe('Unknown error');
        });
    });
});

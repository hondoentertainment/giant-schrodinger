/**
 * Supabase mock harness for Playwright e2e tests.
 *
 * Phase 9 follow-up to finding F5 (multiplayer disconnect/reconnect can't be
 * tested today because there is no Supabase backend in e2e and no test hook
 * in the app to bypass `isBackendEnabled()`).
 *
 * --------------------------------------------------------------------------
 * WHY THIS FIXTURE IS BEST-EFFORT (READ THIS BEFORE EXTENDING):
 * --------------------------------------------------------------------------
 * The app's backend gate is `src/lib/supabase.js`:
 *
 *     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 *     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 *     export const supabase =
 *         supabaseUrl && supabaseAnonKey
 *             ? createClient(supabaseUrl, supabaseAnonKey)
 *             : null;
 *     export const isBackendEnabled = () => !!supabase;
 *
 * Those env vars are resolved at BUILD time by Vite — they are baked into the
 * bundle during `npm run build`. Playwright drives the already-built preview
 * server, so nothing we do in the browser at runtime (addInitScript, route,
 * localStorage, window globals) can flip `isBackendEnabled()` to true once
 * the bundle was built without those vars.
 *
 * Consequences:
 *   - `hostRoom()` / `joinRoomByCode()` in RoomContext short-circuit with a
 *     toast error and never set `room`, so the app never reaches a room-scoped
 *     view and `<ConnectionBanner>` is never mounted.
 *   - Intercepting `/rest/v1/*` or the realtime WebSocket is pointless —
 *     nothing ever calls them.
 *
 * Required source change to unlock this harness (out of scope for this agent,
 * Phase 10 work for the src/ owner):
 *
 *   In `src/lib/supabase.js`, add a build-time test flag that emits a fake
 *   client, e.g.:
 *
 *       const testMode = import.meta.env.VITE_TEST_MODE === '1';
 *       export const supabase = testMode
 *           ? createFakeSupabaseClient()           // new export from a test helper
 *           : supabaseUrl && supabaseAnonKey
 *               ? createClient(supabaseUrl, supabaseAnonKey)
 *               : null;
 *
 *   Then `playwright.config.js` would pass `VITE_TEST_MODE=1` into the build
 *   step of `webServer.command`. At that point this fixture's `applyMock()`
 *   and `triggerDisconnect()` helpers become useful.
 *
 * --------------------------------------------------------------------------
 * WHAT THIS FIXTURE CURRENTLY DOES:
 * --------------------------------------------------------------------------
 *   1. `applyMock(page)` installs Playwright `page.route()` handlers that
 *      return canned 200 responses for any supabase.co REST traffic and a
 *      stub for the realtime WebSocket endpoint. This is harmless today
 *      (nothing hits those routes) and becomes the real mock once the
 *      source-side test-mode flag exists.
 *   2. `triggerDisconnect(page)` / `triggerReconnect(page)` fire `offline` /
 *      `online` browser events, which RoomContext listens for. These will
 *      only move `connectionState` once the app has actually entered a room,
 *      which also requires the source change above.
 *   3. Exposes `setRoomState(page, partialState)` as a placeholder for a
 *      future `window.__vwf_test.setRoomState()` hook that a source-side
 *      test-mode could expose.
 *
 * Usage once unblocked:
 *
 *     import { applyMock, enterMockRoom, triggerDisconnect } from './fixtures/supabaseMock';
 *     test('banner after disconnect', async ({ page }) => {
 *         await applyMock(page);
 *         await page.goto('/giant-schrodinger/');
 *         await enterMockRoom(page, { code: 'TEST01', isHost: true });
 *         await triggerDisconnect(page);
 *         await expect(page.getByText(/Reconnecting/i)).toBeVisible();
 *     });
 */

const SUPABASE_REST_PATTERN = /https?:\/\/[^/]*supabase\.co\/rest\/v1\/.*/i;
const SUPABASE_AUTH_PATTERN = /https?:\/\/[^/]*supabase\.co\/auth\/v1\/.*/i;
const SUPABASE_REALTIME_PATTERN = /https?:\/\/[^/]*supabase\.co\/realtime\/v1\/.*/i;

/**
 * Install route handlers that intercept all Supabase REST/auth/realtime
 * HTTP traffic and return canned responses. Idempotent per-page.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function applyMock(page) {
    // REST — return empty arrays for SELECT, empty object for INSERT/UPDATE.
    await page.route(SUPABASE_REST_PATTERN, async (route) => {
        const method = route.request().method();
        const body = method === 'GET' ? '[]' : '{}';
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body,
        });
    });

    // Auth — return a fake anon session.
    await page.route(SUPABASE_AUTH_PATTERN, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-anon-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: { id: 'mock-user', aud: 'authenticated' },
            }),
        });
    });

    // Realtime HTTP handshake — WebSocket upgrade is handled separately by
    // Playwright's built-in WS routing (Playwright 1.48+). For now we just
    // 404 so the client treats it as unreachable, which RoomContext maps to
    // `connectionState === 'reconnecting'`.
    await page.route(SUPABASE_REALTIME_PATTERN, async (route) => {
        await route.fulfill({ status: 404, body: '' });
    });

    // Inject a stub for `window.__vwf_test` that src/ can wire up in Phase 10.
    // Today this is a no-op that logs; it documents the contract we want.
    await page.addInitScript(() => {
        // eslint-disable-next-line no-underscore-dangle
        window.__vwf_test = window.__vwf_test || {
            // Called by the (future) fake supabase client whenever it wants
            // to push an event into the app. Real impl lives in source.
            _noop: true,
            setRoomState() {
                // Populated by source-side test-mode. No-op otherwise.
            },
            forceDisconnect() {
                window.dispatchEvent(new Event('offline'));
            },
            forceReconnect() {
                window.dispatchEvent(new Event('online'));
            },
        };
    });
}

/**
 * Fire a browser `offline` event. RoomContext's handleOffline listener maps
 * this to `setConnectionState('reconnecting')`. Only visible if the app has
 * entered a room view (see file header for why that's blocked today).
 *
 * @param {import('@playwright/test').Page} page
 */
export async function triggerDisconnect(page) {
    await page.context().setOffline(true);
    await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
    });
}

/**
 * Fire a browser `online` event. RoomContext's handleOnline listener calls
 * `attemptReconnect()`, which calls `fetchRoomState()` (supabase) and on
 * success restores `connectionState` to 'connected'.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function triggerReconnect(page) {
    await page.context().setOffline(false);
    await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
    });
}

/**
 * Placeholder for the future source-side hook. Once `src/lib/supabase.js`
 * exposes a test-mode fake client that honours `window.__vwf_test.setRoomState`,
 * this helper becomes the primary way to put the app into an in-room state
 * without a real Supabase backend.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ code: string, isHost?: boolean, playerName?: string, phase?: string }} partialState
 */
export async function enterMockRoom(page, partialState) {
    await page.evaluate((state) => {
        // eslint-disable-next-line no-underscore-dangle
        if (window.__vwf_test && typeof window.__vwf_test.setRoomState === 'function') {
            window.__vwf_test.setRoomState(state);
        } else {
            // Document the missing hook for whoever reads the Playwright trace.
            // eslint-disable-next-line no-console
            console.warn(
                '[supabaseMock] window.__vwf_test.setRoomState is not implemented. ' +
                'Add VITE_TEST_MODE support in src/lib/supabase.js (see fixture header).'
            );
        }
    }, partialState);
}

/**
 * True iff the current build has wired up the source-side test-mode hook.
 * Tests can gate `test.skip()` on this to self-heal once Phase 10 lands.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function isTestModeAvailable(page) {
    return await page.evaluate(() => {
        // eslint-disable-next-line no-underscore-dangle
        const hook = window.__vwf_test;
        return !!(hook && hook._noop !== true && typeof hook.setRoomState === 'function');
    });
}

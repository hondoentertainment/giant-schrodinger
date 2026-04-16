import { test, expect } from '@playwright/test';
import {
    applyMock,
    enterMockRoom,
    triggerDisconnect,
    triggerReconnect,
    isTestModeAvailable,
} from './fixtures/supabaseMock.js';

/**
 * T4 — Multiplayer disconnect / reconnect recovery (Phase 5 #82, F5 follow-up)
 *
 * The ConnectionBanner (src/features/room/ConnectionBanner.jsx) is rendered
 * inside all room-scoped views (RoomLobby, MultiplayerRound, MultiplayerReveal,
 * VotingPhase, ResultsPhase, CountdownPhase, RevealPhase). It reads
 * connectionState from RoomContext and becomes visible on 'reconnecting' or
 * 'disconnected'. A window 'offline' event triggers setConnectionState('reconnecting').
 *
 * IMPORTANT FINDING — multiplayer requires a live Supabase backend
 * (see src/context/RoomContext.jsx hostRoom/joinRoomByCode: both short-circuit
 * with `isBackendEnabled()` returning false and emit a toast error). In the e2e
 * environment there is no Supabase configured (see src/lib/supabase.js), so we
 * cannot actually enter a room. That means the ConnectionBanner cannot be
 * rendered in e2e without a real backend — or a build-time test-mode flag that
 * another agent needs to add in Phase 10. See e2e/fixtures/supabaseMock.js for
 * the exact source change required.
 *
 * The harness in ./fixtures/supabaseMock.js is installed on every test so that
 * the moment the source-side `VITE_TEST_MODE` flag lands, the two currently
 * skipped tests self-heal (via `isTestModeAvailable(page)`).
 *
 * What we cover here:
 *  1) Baseline: banner text is NOT present on the landing page (regression guard)
 *  2) Firing browser 'offline' / 'online' events on landing does not crash the
 *     app (exercises the `useEffect` listener wiring added in RoomContext)
 *  3) Disconnect -> banner appears inside a room (self-skips until Phase 10)
 *  4) Reconnect -> banner disappears (self-skips until Phase 10)
 */

const APP_URL = '/giant-schrodinger/';

test.describe('multiplayer disconnect recovery', () => {
    test.beforeEach(async ({ page }) => {
        // Install the Supabase mock route handlers and test hook stub.
        // No-op today (nothing hits supabase.co without the build flag),
        // but safe to leave on — exercises the route machinery so regressions
        // in the fixture surface early.
        await applyMock(page);
    });

    test('connection banner is absent on landing (no room joined)', async ({ page }) => {
        await page.goto(APP_URL);
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        // Banner text should not be present — there is no room yet.
        await expect(page.getByText(/Connection lost|Reconnecting|Disconnected\./i)).toHaveCount(0);
    });

    test('firing offline/online window events on landing does not crash', async ({ page }) => {
        await page.goto(APP_URL);
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();

        // Simulate a network transition at the browser level. Without a room,
        // RoomContext's handleOffline will flip connectionState but the banner
        // only renders inside room views, so nothing visible changes.
        await triggerDisconnect(page);
        await page.waitForTimeout(500);

        // App should still be rendered and interactive.
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        await expect(page.getByText(/Connection lost|Reconnecting/i)).toHaveCount(0);

        // Restore connectivity and fire the corresponding event.
        await triggerReconnect(page);
        await page.waitForTimeout(500);

        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
    });

    test('shows connection banner after disconnect in an active room', async ({ page }) => {
        await page.goto(APP_URL);

        const hookReady = await isTestModeAvailable(page);
        test.skip(
            !hookReady,
            'Blocked on F5 Phase 10 source change: add a VITE_TEST_MODE branch to ' +
            'src/lib/supabase.js that returns a fake client wired to window.__vwf_test. ' +
            'Without it, isBackendEnabled() returns false at build time and hostRoom/ ' +
            'joinRoomByCode short-circuit with a toast error, so <ConnectionBanner> ' +
            'never mounts. See e2e/fixtures/supabaseMock.js header for the exact diff.'
        );

        // When Phase 10 lands, this body runs automatically.
        await enterMockRoom(page, { code: 'TEST01', isHost: true, playerName: 'tester', phase: 'lobby' });
        await expect(page.getByText(/Room TEST01|Lobby/i)).toBeVisible();

        await triggerDisconnect(page);
        await expect(page.getByText(/Connection lost|Reconnecting/i)).toBeVisible();
    });

    test('connection banner disappears after reconnect', async ({ page }) => {
        await page.goto(APP_URL);

        const hookReady = await isTestModeAvailable(page);
        test.skip(
            !hookReady,
            'Blocked on F5 Phase 10 source change (same root cause as the test above): ' +
            'src/lib/supabase.js needs a VITE_TEST_MODE branch returning a fake client. ' +
            'attemptReconnect() calls fetchRoomState() which requires a supabase client. ' +
            'See e2e/fixtures/supabaseMock.js header for the exact diff.'
        );

        await enterMockRoom(page, { code: 'TEST01', isHost: true, playerName: 'tester', phase: 'lobby' });
        await triggerDisconnect(page);
        await expect(page.getByText(/Connection lost|Reconnecting/i)).toBeVisible();

        await triggerReconnect(page);
        await expect(page.getByText(/Connection lost|Reconnecting|Disconnected\./i)).toHaveCount(0);
    });
});

import { test, expect } from '@playwright/test';

/**
 * T4 — Multiplayer disconnect / reconnect recovery (Phase 5 #82)
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
 * rendered in e2e without a real backend.
 *
 * What we cover here:
 *  1) Baseline: banner text is NOT present on the landing page (regression guard)
 *  2) Firing browser 'offline' / 'online' events on landing does not crash the
 *     app (exercises the `useEffect` listener wiring added in RoomContext)
 *  3) The full disconnect -> reconnect UI flow is skipped with a clear TODO
 *     noting the backend dependency
 */

const APP_URL = '/giant-schrodinger/';

test.describe('multiplayer disconnect recovery', () => {
    test('connection banner is absent on landing (no room joined)', async ({ page }) => {
        await page.goto(APP_URL);
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        // Banner text should not be present — there is no room yet.
        await expect(page.getByText(/Connection lost|Reconnecting|Disconnected\./i)).toHaveCount(0);
    });

    test('firing offline/online window events on landing does not crash', async ({ page, context }) => {
        await page.goto(APP_URL);
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();

        // Simulate a network transition at the browser level. Without a room,
        // RoomContext's handleOffline will flip connectionState but the banner
        // only renders inside room views, so nothing visible changes.
        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page.waitForTimeout(500);

        // App should still be rendered and interactive.
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        await expect(page.getByText(/Connection lost|Reconnecting/i)).toHaveCount(0);

        // Restore connectivity and fire the corresponding event.
        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.waitForTimeout(500);

        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
    });

    test('shows connection banner after disconnect in an active room', async () => {
        test.skip(
            true,
            'TODO: multiplayer requires a live Supabase backend (isBackendEnabled()=false ' +
            'in e2e). hostRoom/joinRoomByCode short-circuit with a toast error, so we ' +
            'cannot enter a room to render ConnectionBanner. Enable this test once the ' +
            'mock multiplayer harness exposes a way to simulate an in-room state without ' +
            'real Supabase (Phase 9 follow-up).'
        );
    });

    test('connection banner disappears after reconnect', async () => {
        test.skip(
            true,
            'TODO: blocked by same backend dependency as the disconnect test above. ' +
            'Reconnect path calls fetchRoomState which requires Supabase. Re-enable ' +
            'with a mock multiplayer harness (Phase 9 follow-up).'
        );
    });
});

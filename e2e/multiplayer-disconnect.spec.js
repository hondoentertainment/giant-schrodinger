import { test, expect } from '@playwright/test';

/**
 * T4 — Multiplayer disconnect / reconnect recovery (Phase 5 #82)
 *
 * The ConnectionBanner (src/features/room/ConnectionBanner.jsx) is rendered
 * inside all room-scoped views (RoomLobby, MultiplayerRound, MultiplayerReveal,
 * VotingPhase, ResultsPhase, CountdownPhase, RevealPhase). It reads
 * connectionState from RoomContext and becomes visible on 'reconnecting' or
 * 'disconnected'. A window 'offline' event triggers the disconnected recovery state.
 *
 * Playwright builds the app with Vite mode "e2e", which enables a localStorage-
 * gated mock room harness. Normal production builds do not include that active
 * path, and tests must still opt in with `vwf_e2e_mock_room=true`.
 */

const APP_URL = '/giant-schrodinger/';

async function openLobbyWithMockRoom(page, name = 'MockHost') {
    await page.addInitScript(() => {
        window.localStorage.setItem('vwf_e2e_mock_room', 'true');
        window.localStorage.setItem('vwf_show_all_features', 'true');
        window.localStorage.setItem('venn_onboarding_complete', 'true');
        window.localStorage.setItem(
            'vwf_stats',
            JSON.stringify({
                lastPlayedDate: null,
                currentStreak: 0,
                maxStreak: 0,
                totalRounds: 20,
                totalCollisions: 0,
                scores: [],
                dailyScores: [],
                themesPlayed: [],
                milestonesUnlocked: [],
            })
        );
    });
    await page.goto(APP_URL);
    await page.getByPlaceholder(/Enter your name/i).fill(name);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

async function createMockRoom(page) {
    await openLobbyWithMockRoom(page);
    await page.getByRole('button', { name: /Play with Friends/i }).click();
    await page.getByRole('button', { name: /Create Room/i }).click();
    await expect(page.getByText(/MULTIPLAYER ROOM/i)).toBeVisible({ timeout: 5000 });
}

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

    test('shows connection banner after disconnect in an active room', async ({ page, context }) => {
        await createMockRoom(page);

        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));

        await expect(page.getByText(/Disconnected\./i)).toBeVisible({ timeout: 5000 });

        await context.setOffline(false);
    });

    test('connection banner disappears after reconnect', async ({ page, context }) => {
        await createMockRoom(page);

        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await expect(page.getByText(/Disconnected\./i)).toBeVisible({ timeout: 5000 });

        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await expect(page.getByText(/Connection lost\. Reconnecting|Disconnected\./i)).toHaveCount(0);
    });
});

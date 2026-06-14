import { test, expect } from '@playwright/test';

/**
 * T5 — Error paths that the golden-path specs skip.
 *
 * Behaviours verified here were read off the source (not invented):
 *  - LobbyMultiplayerPanel.jsx: Join button is `disabled` until joinCode has
 *    at least 4 non-whitespace chars AND backendReady is true. With no
 *    Supabase configured the button is permanently disabled, so there is no
 *    flow that reaches a "room not found" server error from the UI.
 *  - Round.jsx handleSubmit: pressing Enter submits the current input value,
 *    including empty or whitespace-only text (no client-side block).
 *  - Round.jsx no longer exposes a quit-round control.
 *  - ThemeBuilder.jsx handleCreate: empty name triggers a toast
 *    'Please enter a theme name' via ToastContext — no button disable.
 *
 * The lobby normally gates Tier-2 (creator/gallery/etc.) and Tier-3
 * (multiplayer/ranked) features behind a play-count threshold
 * (src/features/lobby/Lobby.jsx: `lobbyTier`). It also shows an onboarding
 * tour/intro modal when `stats.totalRounds === 0`. We seed `vwf_stats` with
 * a finished tier-3 profile so every lobby section is visible and neither
 * modal appears.
 */

const APP_URL = '/giant-schrodinger/';

async function openLobbyAsLoggedInUser(page, name = 'ErrorTester') {
    await page.addInitScript(() => {
        // Reveal every tier of lobby features up-front.
        window.localStorage.setItem('vwf_show_all_features', 'true');
        window.localStorage.setItem('venn_onboarding_complete', 'true');
        // Pretend the user has already played — skips OnboardingTour AND
        // OnboardingModal in Lobby.startGame. Also guarantees lobbyTier >= 3
        // (threshold is 15 rounds) so the multiplayer panel is available.
        window.localStorage.setItem(
            'vwf_stats',
            JSON.stringify({
                lastPlayedDate: null,
                currentStreak: 0,
                maxStreak: 0,
                totalRounds: 20,
                totalCollisions: 0,
                milestonesUnlocked: [],
            })
        );
    });
    await page.goto(APP_URL);
    await page.getByPlaceholder(/Enter your name/i).fill(name);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

test.describe('error paths — multiplayer join', () => {
    test('join button stays disabled for too-short room codes', async ({ page }) => {
        await openLobbyAsLoggedInUser(page);

        // Button name comes from i18n key lobby.multiplayer = "Play with Friends".
        await page.getByRole('button', { name: /Play with Friends/i }).click();

        const codeInput = page.getByPlaceholder(/Room code/i);
        await expect(codeInput).toBeVisible();

        // The join button has aria-label "Join room" (the accessible name
        // getByRole uses) and visible text "Join".
        const joinBtn = page.getByRole('button', { name: /Join room/i });
        await expect(joinBtn).toBeVisible();
        // No input yet — disabled (joinCode.trim().length < 4 AND !backendReady).
        await expect(joinBtn).toBeDisabled();

        // Clearly invalid code (2 chars < 4-char minimum) — still disabled.
        await codeInput.fill('XX');
        await expect(joinBtn).toBeDisabled();

        // Bumping to 4 chars satisfies the length rule, but backend is not
        // configured in e2e so the button stays disabled (backendReady=false).
        await codeInput.fill('ABCD');
        await expect(joinBtn).toBeDisabled();
    });

    test('join surfaces server error for non-existent room code', async () => {
        test.skip(
            true,
            'TODO: app requires a live Supabase backend to actually dispatch a ' +
            'join request. Without one, the Join button is disabled before we can ' +
            'observe a server-side "room not found" error. Re-enable once a mock ' +
            'multiplayer harness is available (Phase 9 follow-up).'
        );
    });
});

test.describe('error paths — solo round submission', () => {
    async function startSoloRound(page) {
        await openLobbyAsLoggedInUser(page, 'RoundTester');
        await page.getByRole('button', { name: /Solo Session|Start Round/i }).first().click();
        const input = page.getByPlaceholder(/What connects|connect|write|type/i).or(
            page.locator('#submission-input')
        );
        await input.waitFor({ state: 'visible', timeout: 10000 });
        return input;
    }

    test('empty submission submits on Enter and reaches reveal', async ({ page }) => {
        const input = await startSoloRound(page);

        await input.press('Enter');

        await expect(page.getByText(/YOUR SCORE|HUMAN JUDGE|Preparing|Dreaming up the fusion|\d+\/10/i)).toBeVisible({ timeout: 15000 });
    });

    test('whitespace-only submission submits on Enter', async ({ page }) => {
        const input = await startSoloRound(page);

        await input.fill('   ');
        await input.press('Enter');

        await expect(page.getByText(/YOUR SCORE|HUMAN JUDGE|Preparing|Dreaming up the fusion|\d+\/10/i)).toBeVisible({ timeout: 15000 });
    });

    test.skip('quit during round opens confirmation modal and returns to lobby', async () => {
        // Quit-round UI was removed from Round.jsx.
    });
});

test.describe('error paths — theme builder', () => {
    test('empty name shows error toast on Create', async ({ page }) => {
        await openLobbyAsLoggedInUser(page, 'ThemeTester');

        // The Theme Builder nav button lives in the tier-2 quick-nav row:
        // <button title="Creator"><Palette /> Creator</button>. We locate by
        // the title attribute to avoid matching on the icon-prefixed label.
        await page.locator('button[title="Theme Builder"]').click();

        await expect(page.getByRole('heading', { name: /Theme Builder/i })).toBeVisible({ timeout: 5000 });

        // Click Create Theme without entering a name.
        await page.getByRole('button', { name: /Create Theme/i }).click();

        // Toast appears via ToastContainer — assert on the exact error text.
        await expect(page.getByText(/Please enter a theme name/i)).toBeVisible({ timeout: 5000 });
    });
});

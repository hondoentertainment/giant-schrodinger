import { test, expect } from '@playwright/test';

async function createProfile(page, name = 'VisualPlayer') {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your name/i).fill(name);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

async function dismissOnboarding(page) {
    const onboardingButton = page.getByRole('button', { name: /Got it, let's play/i });
    if (await onboardingButton.count()) {
        await onboardingButton.click();
    }
}

async function startRound(page) {
    await dismissOnboarding(page);
    await page.getByRole('button', { name: /Start First Round|Start solo session|Practice Run|Solo Session/i }).click();
    await dismissOnboarding(page);
    const roundInput = page.getByPlaceholder(/What connects these two/i);
    await expect(roundInput).toBeVisible({ timeout: 10000 });
    return roundInput;
}

test.describe('Visual smoke', () => {
    // Playwright requires object-destructured fixtures in hook signatures.
    // eslint-disable-next-line no-empty-pattern
    test.beforeEach(({ }, testInfo) => {
        test.skip(
            !!process.env.CI || testInfo.project.name !== 'Desktop Chrome',
            'Visual baselines run locally on Desktop Chrome only'
        );
    });

    test('lobby screen snapshot', async ({ page }) => {
        await createProfile(page);
        await dismissOnboarding(page);
        await expect(page.locator('.wordle-card').first()).toBeVisible();
        await expect(page).toHaveScreenshot('lobby.png', { maxDiffPixelRatio: 0.08 });
    });

    test('round screen snapshot', async ({ page }) => {
        await createProfile(page);
        await startRound(page);
        await expect(page).toHaveScreenshot('round.png', { maxDiffPixelRatio: 0.08 });
    });

    test('gallery empty state snapshot', async ({ page }) => {
        await createProfile(page);
        await dismissOnboarding(page);
        await page.getByRole('button', { name: /View connection gallery/i }).click();
        await expect(page.getByText(/No connections yet/i)).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveScreenshot('gallery-empty.png', { maxDiffPixelRatio: 0.08 });
    });
});

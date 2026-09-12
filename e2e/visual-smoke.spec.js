import { test, expect } from '@playwright/test';
import { createProfile, dismissOnboarding, startSoloRound } from './helpers';

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
        await expect(page.getByRole('button', { name: /Play today's pair/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Sound on|Sound muted/i })).toBeVisible();
        await expect(page).toHaveScreenshot('lobby.png', { maxDiffPixelRatio: 0.08 });
    });

    test('round screen snapshot', async ({ page }) => {
        await createProfile(page);
        await startSoloRound(page);
        await expect(page).toHaveScreenshot('round.png', { maxDiffPixelRatio: 0.08 });
    });

    test('gallery empty state snapshot', async ({ page }) => {
        await createProfile(page);
        await dismissOnboarding(page);
        const gallery = page.getByRole('button', { name: /View connection gallery/i });
        if (!(await gallery.isVisible().catch(() => false))) {
            await page.getByRole('button', { name: /More lobby actions/i }).click();
        }
        await gallery.click();
        await expect(page.getByText(/Your best lines will land here after round 1|No trophies yet|No connections yet/i)).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveScreenshot('gallery-empty.png', { maxDiffPixelRatio: 0.08 });
    });
});

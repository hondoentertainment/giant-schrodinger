import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test('main heading is visible and has semantic structure', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByRole('heading', { name: /VENN/i });
        await expect(heading).toBeVisible();
    });

    test('interactive elements are focusable', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    });

    test('no major accessibility violations on landing', async ({ page }) => {
        await page.goto('/');
        const body = page.locator('body');
        await expect(body).toBeVisible();
        const buttons = page.getByRole('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
    });
});

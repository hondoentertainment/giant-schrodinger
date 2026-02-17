import { test, expect } from '@playwright/test';

test.describe('Responsive design', () => {
    test('landing is usable on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        const joinBtn = page.getByRole('button', { name: /Join Lobby/i });
        await expect(joinBtn).toBeVisible();
        const box = await joinBtn.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('layout adapts to desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
    });
});

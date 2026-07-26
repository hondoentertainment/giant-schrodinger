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

    test('gallery actions are usable on a narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('vwf_user', JSON.stringify({
                name: 'Mobile',
                avatar: '👽',
                themeId: 'classic',
                scoringMode: 'human',
                mediaType: 'image',
                useCustomImages: false,
            }));
            window.localStorage.setItem('venn_collisions', JSON.stringify([
                { id: 'mobile-1', submission: 'thumb friendly', score: 9, timestamp: new Date().toISOString(), imageUrl: 'https://example.com/mobile.jpg' },
            ]));
        });
        await page.reload();
        await page.getByRole('button', { name: /View connection gallery/i }).click();
        await expect(page.getByRole('heading', { name: /Connection Gallery/i })).toBeVisible();
        const backButton = page.getByRole('button', { name: /Back to Lobby/i });
        const box = await backButton.boundingBox();
        expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
    });
});

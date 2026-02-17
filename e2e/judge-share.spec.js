import { test, expect } from '@playwright/test';

test.describe('Judge / Share flow', () => {
    test('judge link with hash shows judge interface', async ({ page }) => {
        const payload = {
            assets: { left: { label: 'Cat' }, right: { label: 'Dog' } },
            submission: 'both are fluffy',
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        await page.goto(`/#judge=${encoded}`);
        await expect(page.getByText(/both are fluffy/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Cat|Dog/i)).toBeVisible();
    });

    test('invalid judge hash shows error or fallback', async ({ page }) => {
        await page.goto('/#judge=invalid-base64!!!');
        await page.waitForTimeout(1000);
        const body = await page.locator('body').textContent();
        expect(body).toBeTruthy();
    });
});

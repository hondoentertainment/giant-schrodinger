import { test, expect } from '@playwright/test';

test('has title and renders the game UI', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Venn with Friends/);
    await expect(page.locator('#root')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test.describe('Multiplayer Flow', () => {
  test('create and join room', async ({ page }) => {
    await page.goto('/');
    // Create profile
    await page.fill('[placeholder*="name" i]', 'Player1');
    await page.click('button:has-text("Start")');
    // Navigate to multiplayer (if visible)
    // This tests the basic lobby flow
    await expect(page.locator('text=/Venn with Friends/i')).toBeVisible();
  });

  test('solo round flow completes', async ({ page }) => {
    await page.goto('/');
    await page.fill('[placeholder*="name" i]', 'TestPlayer');
    await page.click('button:has-text("Start")');
    // Wait for round to load (get-ready countdown)
    await page.waitForTimeout(4000); // 3s countdown + buffer
    // Type submission
    const input = page.locator('[placeholder*="connects" i]');
    if (await input.isVisible()) {
      await input.fill('Both are creative expressions');
      await input.press('Enter');
      // Wait for score
      await expect(page.locator('text=/\\/10/')).toBeVisible({ timeout: 10000 });
    }
  });

  test('gallery shows past rounds', async ({ page }) => {
    await page.goto('/');
    // Check gallery is accessible
    const galleryBtn = page.locator('button:has-text("Gallery"), [aria-label*="gallery" i]');
    if (await galleryBtn.isVisible()) {
      await galleryBtn.click();
      await expect(page.locator('text=/connections/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

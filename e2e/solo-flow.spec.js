import { test, expect } from '@playwright/test';

test.describe('Solo game flow', () => {
    test('landing page loads with Create Profile', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Create Profile/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Join Lobby/i })).toBeVisible();
    });

    test('can create profile and see lobby', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer');
        await page.getByRole('button', { name: /Join Lobby/i }).click();
        await expect(page.getByText(/Hi, TestPlayer/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: /Solo Session|Start Round/i })).toBeVisible();
    });

    test('can start solo game and see round screen', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer');
        await page.getByRole('button', { name: /Join Lobby/i }).click();
        await page.getByRole('button', { name: /Solo Session/i }).click();
        const input = page.getByPlaceholder(/What connects|connect|write|type/i).or(
            page.locator('input[type="text"]').first()
        );
        await expect(input).toBeVisible({ timeout: 5000 });
    });

    test('can submit a response and see reveal', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/Enter your name/i).fill('TestPlayer');
        await page.getByRole('button', { name: /Join Lobby/i }).click();
        await page.getByRole('button', { name: /Solo Session/i }).click();
        const input = page.getByPlaceholder(/What connects|connect|write|type/i).or(
            page.locator('input[type="text"]').first()
        );
        await input.waitFor({ state: 'visible', timeout: 5000 });
        await input.fill('both make you happy');
        await input.press('Enter');
        await expect(page.getByText(/score|Score|wit|logic|Amazing|Great|Solid/i)).toBeVisible({ timeout: 15000 });
    });
});

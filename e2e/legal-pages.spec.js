import { test, expect } from '@playwright/test';

const APP_URL = '/giant-schrodinger/';

async function enterLobby(page, name = 'LegalTest') {
    await page.goto(APP_URL);
    await page.getByPlaceholder(/Enter your name/i).fill(name);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

test.describe('Legal pages', () => {
    test('privacy and terms pages open from footer', async ({ page }) => {
        await enterLobby(page);

        await page.getByRole('button', { name: /^Privacy$/i }).click();
        await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();

        await page.getByRole('button', { name: /^Back$/i }).click();
        await expect(page.getByText(new RegExp('Hi, LegalTest', 'i'))).toBeVisible();

        await page.getByRole('button', { name: /^Terms$/i }).click();
        await expect(page.getByRole('heading', { name: /Terms of Use/i })).toBeVisible();
    });
});

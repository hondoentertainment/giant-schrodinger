import { test, expect } from '@playwright/test';
import { startSoloRound } from './helpers';

async function createProfile(page, name = 'TestPlayer') {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your name/i).fill(name);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

test.describe('Solo game flow', () => {
    test('landing page loads with Create Profile', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Create Profile/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Join Lobby/i })).toBeVisible();
    });

    test('can create profile and see lobby', async ({ page }) => {
        await createProfile(page);
        await expect(page.getByRole('button', { name: /Start First Round|Start solo session|Solo Session|Start Round/i })).toBeVisible();
    });

    test('can start solo game and see round screen', async ({ page }) => {
        await createProfile(page);
        await startSoloRound(page);
    });

    test('can submit a response and see reveal', async ({ page }) => {
        await createProfile(page);
        const input = await startSoloRound(page);
        await input.fill('both make you happy');
        await input.press('Enter');
        await expect(page.getByText(/YOUR SCORE|HUMAN JUDGE|Preparing|Dreaming up the fusion/i)).toBeVisible({ timeout: 15000 });
    });
});

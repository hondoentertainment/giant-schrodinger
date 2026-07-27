import { test, expect } from '@playwright/test';
import { startSoloRound, selectMediaType } from './helpers';

async function createProfileWithMemesVideos(page, name = 'MemePlayer') {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your name/i).fill(name);

    await selectMediaType(page, /Memes & Videos/i);
    await page.getByRole('button', { name: /Join Lobby/i }).click();
    await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

test.describe('Memes & Videos flow', () => {
    test('can select memes & videos mode and start a round', async ({ page }) => {
        await createProfileWithMemesVideos(page);

        await startSoloRound(page, { placeholder: /What connects this meme and video/i });
        await expect(page.getByText('The Intersection')).toBeVisible();
    });

    test('shows YouTube URL input in memes & videos mode', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/Enter your name/i).fill('YTPlayer');
        await selectMediaType(page, /Memes & Videos/i);
        await expect(page.getByPlaceholder(/Paste YouTube URL/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Add YouTube/i })).toBeVisible();
    });

    test('shows YouTube URL input in video mode', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/Enter your name/i).fill('VideoPlayer');
        await selectMediaType(page, /^Videos\b/i);
        await expect(page.getByPlaceholder(/Paste YouTube URL/i)).toBeVisible();
    });
});

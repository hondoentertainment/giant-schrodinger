import { test, expect } from '@playwright/test';
import { startSoloRound } from './helpers';

const productionUrl = process.env.PRODUCTION_URL;

test.describe('Deployed rehearsal smoke', () => {
    test.skip(!productionUrl, 'Set PRODUCTION_URL to run deployed rehearsal checks');

    test.beforeEach(async ({ page }) => {
        await page.goto(productionUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    });

    test('landing loads with profile entry', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible({ timeout: 15000 });
        await expect(page.getByPlaceholder(/Enter your name/i)).toBeVisible({ timeout: 10000 });
    });

    test('memes & videos mode reaches round screen', async ({ page }) => {
        await page.getByPlaceholder(/Enter your name/i).fill('RehearsalBot');
        await page.getByRole('button', { name: /Memes & Videos/i }).click();
        await page.getByRole('button', { name: /Join Lobby/i }).click();
        await expect(page.getByText(/Hi, RehearsalBot/i)).toBeVisible({ timeout: 10000 });

        await startSoloRound(page, { placeholder: /What connects this meme and video/i });
    });

    test('runtime status card reflects backend configuration when visible', async ({ page }) => {
        await page.getByPlaceholder(/Enter your name/i).fill('StatusCheck');
        await page.getByRole('button', { name: /Join Lobby/i }).click();
        await expect(page.getByText(/Hi, StatusCheck/i)).toBeVisible({ timeout: 10000 });

        const statusCard = page.getByText(/Runtime Status/i);
        if (await statusCard.count()) {
            await expect(page.getByText(/AI services/i)).toBeVisible();
            await expect(page.getByText(/Realtime backend/i)).toBeVisible();
        }
    });
});

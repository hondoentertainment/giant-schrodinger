import { test, expect } from '@playwright/test';
import { openLobbyGallery } from './helpers';

test.describe('Responsive design', () => {
    test('landing is usable on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
        const joinBtn = page.getByRole('button', { name: /Join Lobby/i });
        await expect(joinBtn).toBeVisible();
        const box = await joinBtn.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(40);
    });

    test('create profile aligns to a shared mobile gutter', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        const title = page.getByRole('heading', { name: 'Create Profile' });
        const username = page.locator('#profile-username');
        const play = page.getByRole('button', { name: /Play today's pair/i });
        const join = page.getByRole('button', { name: /Join Lobby/i });
        await expect(title).toBeVisible();
        const titleBox = await title.boundingBox();
        const labelBox = await username.boundingBox();
        const playBox = await play.boundingBox();
        const joinBox = await join.boundingBox();
        expect(titleBox?.x).toBeGreaterThanOrEqual(16);
        expect(Math.abs((titleBox?.x ?? 0) - (labelBox?.x ?? 0))).toBeLessThanOrEqual(4);
        expect(Math.abs((playBox?.x ?? 0) - (titleBox?.x ?? 0))).toBeLessThanOrEqual(4);
        expect(joinBox?.height ?? 0).toBeGreaterThanOrEqual(40);
        expect(playBox?.width ?? 0).toBeGreaterThan(260);
        const counter = page.locator('#name-char-count');
        const input = page.getByPlaceholder(/Enter your name/i);
        const counterBox = await counter.boundingBox();
        const inputBox = await input.boundingBox();
        expect((counterBox?.x ?? 0) + (counterBox?.width ?? 0)).toBeGreaterThan((inputBox?.x ?? 0) + (inputBox?.width ?? 0) * 0.75);
    });

    test('layout adapts to desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /VENN/i })).toBeVisible();
    });

    test('returned lobby keeps greeting and CTAs on one mobile column', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('vwf_user', JSON.stringify({
                name: 'Kylele',
                avatar: '👽',
                themeId: 'classic',
                scoringMode: 'human',
                mediaType: 'image',
                useCustomImages: false,
            }));
        });
        await page.reload();
        const greeting = page.getByRole('heading', { name: /Hey Kylele/i });
        const play = page.getByRole('button', { name: /Play today's pair/i });
        const join = page.getByRole('button', { name: /Join friends room/i });
        await expect(greeting).toBeVisible();
        const greetingBox = await greeting.boundingBox();
        const playBox = await play.boundingBox();
        const joinBox = await join.boundingBox();
        expect(Math.abs((greetingBox?.x ?? 0) - (playBox?.x ?? 0))).toBeLessThanOrEqual(4);
        expect(Math.abs((playBox?.width ?? 0) - (joinBox?.width ?? 0))).toBeLessThanOrEqual(4);
        expect(playBox?.width ?? 0).toBeGreaterThan(280);
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
        await openLobbyGallery(page);
        await expect(page.getByRole('heading', { name: /Your best lines|Connection Gallery/i })).toBeVisible();
        const backButton = page.getByRole('button', { name: /Back to Lobby/i });
        const box = await backButton.boundingBox();
        expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
    });
});

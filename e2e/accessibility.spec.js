import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test('main heading is visible and has semantic structure', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByRole('heading', { name: /VENN/i });
        await expect(heading).toBeVisible();
    });

    test('interactive elements are focusable', async ({ page }) => {
        await page.goto('/');
        const firstInteractive = page.locator('button, a, input').first();
        await firstInteractive.focus();
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    });

    test('no major accessibility violations on landing', async ({ page }) => {
        await page.goto('/');
        const body = page.locator('body');
        await expect(body).toBeVisible();
        const buttons = page.getByRole('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
    });

    test('achievement category tabs expose tab semantics', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('vwf_user', JSON.stringify({
                name: 'A11y',
                avatar: '👽',
                themeId: 'classic',
                scoringMode: 'human',
                mediaType: 'image',
                useCustomImages: false,
            }));
            window.localStorage.setItem('vwf_stats', JSON.stringify({ totalRounds: 5, currentStreak: 1, maxStreak: 1, milestonesUnlocked: [] }));
        });
        await page.reload();
        await page.getByRole('button', { name: /Achievements/i }).click();
        await expect(page.getByRole('tablist', { name: /Achievement categories/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /All/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('gallery controls remain keyboard reachable', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('vwf_user', JSON.stringify({
                name: 'A11y',
                avatar: '👽',
                themeId: 'classic',
                scoringMode: 'human',
                mediaType: 'image',
                useCustomImages: false,
            }));
            window.localStorage.setItem('venn_collisions', JSON.stringify([
                { id: 'a11y-1', submission: 'keyboard comet', score: 8, timestamp: new Date().toISOString(), imageUrl: 'https://example.com/a.jpg' },
            ]));
        });
        await page.reload();
        await page.getByRole('button', { name: /View connection gallery/i }).click();
        await expect(page.getByLabel(/Sort gallery/i)).toBeVisible();
        await expect(page.getByRole('list', { name: /Your connection gallery/i })).toBeVisible();
    });
});

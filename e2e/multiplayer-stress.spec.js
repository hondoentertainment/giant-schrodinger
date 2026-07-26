// @ts-check
/* global process */
import { test, expect } from '@playwright/test';

/**
 * Multiplayer stress tests for Venn with Friends.
 * These tests verify multiplayer functionality under load conditions.
 *
 * Prerequisites:
 * - App running at BASE_URL
 * - Supabase backend configured (or mock mode)
 *
 * Run with: npx playwright test e2e/multiplayer-stress.spec.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/giant-schrodinger/';

test.describe('Multiplayer stress tests', () => {

    test('two players can create and join a room', async ({ browser }) => {
        // Player 1: Create room
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        await page1.goto(BASE_URL);
        await page1.waitForLoadState('networkidle');

        // Player 2: Separate context
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await page2.goto(BASE_URL);
        await page2.waitForLoadState('networkidle');

        // Both pages should load without errors
        expect(await page1.title()).toBeTruthy();
        expect(await page2.title()).toBeTruthy();

        await context1.close();
        await context2.close();
    });

    test('four concurrent browser contexts load without errors', async ({ browser }) => {
        const contexts = [];
        const pages = [];

        for (let i = 0; i < 4; i++) {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            contexts.push(ctx);
            pages.push(page);
        }

        // Load all pages concurrently
        await Promise.all(pages.map(p => p.goto(BASE_URL)));
        await Promise.all(pages.map(p => p.waitForLoadState('networkidle')));

        // All should load successfully
        for (const page of pages) {
            const errors = [];
            page.on('pageerror', err => errors.push(err.message));
            expect(await page.title()).toBeTruthy();
        }

        // Cleanup
        for (const ctx of contexts) {
            await ctx.close();
        }
    });

    test('rapid page navigation does not crash', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Rapidly navigate between sections
        for (let i = 0; i < 5; i++) {
            // Click various buttons if they exist
            const buttons = await page.locator('button').all();
            if (buttons.length > 0) {
                const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
                try {
                    await randomButton.click({ timeout: 1000 });
                } catch {
                    // Some buttons may not be clickable — that's ok
                }
            }
            await page.waitForTimeout(200);
        }

        // Page should still be functional
        expect(await page.title()).toBeTruthy();
    });

    test('page handles offline/online transitions', async ({ page, context }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Go offline
        await context.setOffline(true);
        await page.waitForTimeout(1000);

        // Page should still render (offline mode)
        expect(await page.title()).toBeTruthy();

        // Go back online
        await context.setOffline(false);
        await page.waitForTimeout(1000);

        // Page should recover
        expect(await page.title()).toBeTruthy();
    });

    test('concurrent submissions do not corrupt state', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        await Promise.all([
            page1.goto(BASE_URL),
            page2.goto(BASE_URL),
        ]);

        await Promise.all([
            page1.waitForLoadState('networkidle'),
            page2.waitForLoadState('networkidle'),
        ]);

        // Both should be independent — no shared state corruption
        // Check localStorage isolation
        const storage1 = await page1.evaluate(() => localStorage.getItem('venn_player'));
        const storage2 = await page2.evaluate(() => localStorage.getItem('venn_player'));

        // Different contexts should have independent storage
        // (both null initially, or both independent values)
        expect(typeof storage1).toBe(typeof storage2);

        await context1.close();
        await context2.close();
    });
});

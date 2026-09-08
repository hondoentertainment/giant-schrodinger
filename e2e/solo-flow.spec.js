import { test, expect } from '@playwright/test';
import { dismissOnboarding, startSoloRound } from './helpers';

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
        await expect(page.getByRole('button', { name: /Play today's pair/i })).toBeVisible();
        await expect(page.getByText(/Today's pair. Same one as everyone/i)).toBeVisible();
        await expect(page.getByText('Media Type')).toHaveCount(0);
    });

    test('can create profile and see lobby', async ({ page }) => {
        await createProfile(page);
        await expect(page.getByRole('button', { name: /Start today's Venn daily puzzle|Start First Round|Start solo session|Solo Session|Start Round/i })).toBeVisible();
    });

    test('#daily starts today\'s pair for a logged-in player', async ({ page }) => {
        await createProfile(page);
        await page.goto('/#daily');
        await dismissOnboarding(page);
        await expect(page.getByPlaceholder(/What connects/i)).toBeVisible({ timeout: 15000 });
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

    test('can spotlight either side of the Venn diagram', async ({ page }) => {
        // The circles idle-float forever; reduced motion keeps Playwright's
        // stability check honest without skipping its hit-testing.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await createProfile(page);
        const input = await startSoloRound(page);

        const leftCaption = page.getByRole('button', { name: /^Left (concept|meme|video|audio): / });
        const rightCaption = page.getByRole('button', { name: /^Right (concept|meme|video|audio): / });
        await expect(leftCaption).toHaveAttribute('aria-pressed', 'false');
        await expect(rightCaption).toHaveAttribute('aria-pressed', 'false');

        // Pointer: the circle itself is a hit-area. This click fails if the
        // lens, badge, or loading shell ever ends up covering it.
        await input.focus();
        await page.getByTestId('venn-hit-left').click();
        await expect(leftCaption).toHaveAttribute('aria-pressed', 'true');
        await expect(rightCaption).toHaveAttribute('aria-pressed', 'false');
        // A tap on a circle is a peek: the answer input keeps the caret.
        await expect(input).toBeFocused();

        // Captions toggle their own side.
        await rightCaption.click();
        await expect(rightCaption).toHaveAttribute('aria-pressed', 'true');
        await expect(leftCaption).toHaveAttribute('aria-pressed', 'false');

        // Keyboard: arrows move the selection, Escape clears it.
        await rightCaption.focus();
        await page.keyboard.press('ArrowLeft');
        await expect(leftCaption).toHaveAttribute('aria-pressed', 'true');
        await page.keyboard.press('Escape');
        await expect(leftCaption).toHaveAttribute('aria-pressed', 'false');
        await expect(rightCaption).toHaveAttribute('aria-pressed', 'false');
    });
});

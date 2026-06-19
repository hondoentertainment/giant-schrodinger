import { test, expect } from '@playwright/test';

const APP_URL = '/giant-schrodinger/';

async function createProfile(page, name = 'TestPlayer') {
  await page.goto(APP_URL);
  await page.getByPlaceholder(/Enter your name/i).fill(name);
  await page.getByRole('button', { name: /Join Lobby/i }).click();
  await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 5000 });
}

async function startSoloRound(page) {
  await page.getByRole('button', { name: /Solo Session|Start Round/i }).first().click();

  const onboardingButton = page.getByRole('button', { name: /Got it, let's play!/i });
  if (await onboardingButton.count()) {
    await onboardingButton.click();
  }

  const roundInput = page.getByPlaceholder(/What connects these two/i);
  await expect(roundInput).toBeVisible({ timeout: 10000 });
  return roundInput;
}

test.describe('Multiplayer Flow', () => {
  test('create and join room', async ({ page }) => {
    await createProfile(page, 'Player1');
    await expect(page.getByRole('button', { name: /Play with Friends/i })).toBeVisible();
  });

  test('solo round flow completes', async ({ page }) => {
    await createProfile(page);
    const input = await startSoloRound(page);
    await input.fill('Both are creative expressions');
    await input.press('Enter');
    await expect(page.getByText(/YOUR SCORE|HUMAN JUDGE|Preparing|Dreaming up the fusion|\d+\/10/i)).toBeVisible({ timeout: 15000 });
  });

  test('gallery shows past rounds', async ({ page }) => {
    await createProfile(page);
    await page.getByRole('button', { name: /View connection gallery|Gallery/i }).click();
    await expect(page.getByText(/Connection Gallery/i)).toBeVisible({ timeout: 5000 });
  });
});

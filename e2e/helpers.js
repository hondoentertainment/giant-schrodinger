import { expect } from '@playwright/test';

export async function dismissOnboarding(page) {
    const onboardingButton = page.getByRole('button', { name: /Got it, let's play/i });
    if (await onboardingButton.count()) {
        await onboardingButton.click();
    }
}

export async function startSoloRound(page, options = {}) {
    const { placeholder = /What connects/i } = options;

    await dismissOnboarding(page);
    await page.getByRole('button', {
        name: /Start First Round|Start solo session|Practice Run|Solo Session|Start Round/i,
    }).first().click();
    await dismissOnboarding(page);

    const roundInput = page.getByPlaceholder(placeholder);
    await expect(roundInput).toBeVisible({ timeout: 15000 });
    return roundInput;
}

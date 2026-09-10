import { expect } from '@playwright/test';

export async function dismissOnboarding(page) {
    const onboardingButton = page.getByRole('button', { name: /Got it, let's play/i });
    if (await onboardingButton.count()) {
        await onboardingButton.click();
    }
}

// The slim Create Profile screen hides theme/scoring/media inside a
// collapsed <details> — expand it before touching those controls.
export async function openProfileMoreOptions(page) {
    const summary = page.locator('summary', { hasText: 'More options' });
    const mediaLabel = page.getByText('Media Type');
    if (!(await mediaLabel.isVisible().catch(() => false))) {
        await summary.click();
    }
}

export async function selectMediaType(page, name) {
    await openProfileMoreOptions(page);
    await page.getByRole('button', { name }).click();
}

export async function openLobbyOverflow(page) {
    const more = page.getByRole('button', { name: /More lobby actions/i });
    if (await more.isVisible().catch(() => false)) {
        await more.click();
    }
}

export async function openLobbyGallery(page) {
    const gallery = page.getByRole('button', { name: /View connection gallery/i });
    if (!(await gallery.isVisible().catch(() => false))) {
        await openLobbyOverflow(page);
    }
    await gallery.click();
}

export async function startSoloRound(page, options = {}) {
    const { placeholder = /What connects|e\.g\. a green roommate/i } = options;

    await dismissOnboarding(page);
    const daily = page.getByRole('button', { name: /Start today's Venn daily puzzle/i });
    if (await daily.isVisible().catch(() => false)) {
        await daily.click();
    } else {
        await page.getByRole('button', {
            name: /Start First Round|Start solo session|Practice Run|Solo Session|Start Round|Play today's/i,
        }).first().click();
    }
    await dismissOnboarding(page);

    const roundInput = page.getByPlaceholder(placeholder);
    await expect(roundInput).toBeVisible({ timeout: 15000 });
    return roundInput;
}

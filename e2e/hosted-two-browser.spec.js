import { test, expect } from '@playwright/test';
import { startSoloRound } from './helpers';

/**
 * Live hosted two-browser rehearsal against PRODUCTION_URL.
 * Covers create/join multiplayer and friend-judge share persistence.
 */
const productionUrl = process.env.PRODUCTION_URL;

async function unlockLobby(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vwf_show_all_features', 'true');
    window.localStorage.setItem('venn_onboarding_complete', 'true');
    window.localStorage.setItem(
      'vwf_stats',
      JSON.stringify({
        lastPlayedDate: null,
        currentStreak: 0,
        maxStreak: 0,
        totalRounds: 20,
        totalCollisions: 5,
        scores: [],
        dailyScores: [],
        themesPlayed: [],
        milestonesUnlocked: [],
      })
    );
  });
}

async function joinLobby(page, name, { scoringMode } = {}) {
  await unlockLobby(page);
  await page.goto(productionUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByPlaceholder(/Enter your name/i).fill(name);
  if (scoringMode === 'human') {
    await page.getByRole('button', { name: /Manual Judge/i }).click();
  } else if (scoringMode === 'ai') {
    await page.getByRole('button', { name: /AI Judge/i }).click();
  }
  await page.getByRole('button', { name: /Join Lobby/i }).click();
  await expect(page.getByText(new RegExp(`Hi, ${name}`, 'i'))).toBeVisible({ timeout: 15000 });
}

test.describe('Hosted two-browser rehearsal', () => {
  test.skip(!productionUrl, 'Set PRODUCTION_URL to run hosted two-browser rehearsal');

  test('multiplayer create/join/start across two browsers', async ({ browser }) => {
    test.setTimeout(120000);
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await joinLobby(host, 'HostR', { scoringMode: 'human' });
    await host.getByRole('button', { name: /Play with Friends/i }).click();
    await expect(host.getByText(/Connected/i)).toBeVisible({ timeout: 10000 });
    await host.getByRole('button', { name: /Create Room/i }).click();
    await expect(host.getByText(/Multiplayer room/i)).toBeVisible({ timeout: 20000 });

    const roomCode = (await host.locator('.text-gradient-vibrant').first().textContent())?.trim();
    expect(roomCode).toBeTruthy();
    expect(roomCode.length).toBeGreaterThanOrEqual(4);

    await joinLobby(guest, 'GuestR', { scoringMode: 'human' });
    await guest.getByRole('button', { name: /Play with Friends/i }).click();
    await guest.getByPlaceholder(/Room code/i).fill(roomCode);
    await guest.getByRole('button', { name: /Join room/i }).scrollIntoViewIfNeeded();
    await guest.getByRole('button', { name: /Join room/i }).click();
    await expect(guest.getByText(/Multiplayer room/i)).toBeVisible({ timeout: 20000 });
    await expect(guest.locator('.text-gradient-vibrant').filter({ hasText: roomCode })).toBeVisible();

    await expect(host.getByText('GuestR', { exact: true })).toBeVisible({ timeout: 15000 });
    await host.getByRole('button', { name: /Start Game/i }).click();

    const hostInput = host.getByPlaceholder(/What connects these two/i);
    const guestInput = guest.getByPlaceholder(/What connects these two/i);
    await expect(hostInput).toBeVisible({ timeout: 45000 });
    await expect(guestInput).toBeVisible({ timeout: 45000 });

    await hostInput.fill('Both spark curiosity in a crowded room');
    await guestInput.fill('Shared chaos with a punchline');
    await hostInput.press('Enter');
    await guestInput.press('Enter');

    await expect(host.getByText(/Vote for the best|Which connection wins/i).first()).toBeVisible({
      timeout: 60000,
    });
    await expect(guest.getByText(/Vote for the best|Which connection wins/i).first()).toBeVisible({
      timeout: 60000,
    });

    // Each player votes for the other submission.
    await host.getByRole('button', { name: /GuestR/i }).click();
    await guest.getByRole('button', { name: /HostR/i }).click();
    await host.getByRole('button', { name: /Show Results|Finalize/i }).click();
    await expect(host.getByText(/winner|standings|results|Next Round|final/i).first()).toBeVisible({
      timeout: 30000,
    });
    await expect(guest.getByText(/winner|standings|results|Next Round|final/i).first()).toBeVisible({
      timeout: 30000,
    });

    await hostContext.close();
    await guestContext.close();
  });

  test('friend-judge share link opens in a second browser', async ({ browser }) => {
    test.setTimeout(120000);
    const playerContext = await browser.newContext();
    const judgeContext = await browser.newContext();
    const player = await playerContext.newPage();
    const judge = await judgeContext.newPage();

    await player.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await joinLobby(player, 'JudgeH', { scoringMode: 'ai' });

    const input = await startSoloRound(player);
    await input.fill('Both are unexpected sources of joy');
    await input.press('Enter');

    // Milestone unlock dialog blocks pointer events until dismissed.
    const milestoneDialog = player.locator('[role="dialog"][aria-labelledby="milestone-title"]');
    await milestoneDialog.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    if (await milestoneDialog.count()) {
      await milestoneDialog.getByRole('button', { name: /^Awesome\.?$/i }).click();
      await expect(milestoneDialog).toHaveCount(0, { timeout: 10000 });
    }

    await expect(player.getByText(/WHAT'S NEXT|Ask a friend to judge|Share for friend|YOUR SCORE|\/10/i).first()).toBeVisible({
      timeout: 60000,
    });

    const askFriend = player.getByRole('button', { name: /Ask a friend to judge|Share for friend|Friend judge link copied|Link copied/i }).first();
    await askFriend.scrollIntoViewIfNeeded();
    await expect(askFriend).toBeEnabled({ timeout: 45000 });
    await askFriend.click();
    await expect(
      player.getByText(/Link copied|Friend judge link copied|send to a friend/i).first()
    ).toBeVisible({ timeout: 20000 });

    const clipboardText = await player.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    });

    const judgeMatch =
      clipboardText.match(/[?&#]judge[=_]([A-Za-z0-9_-]+)/) ||
      clipboardText.match(/roundId=([A-Za-z0-9_-]+)/) ||
      clipboardText.match(/#judge=([A-Za-z0-9+/=_-]+)/);
    let token = judgeMatch?.[1];
    let judgeUrl = null;

    if (clipboardText.includes('http')) {
      judgeUrl = clipboardText.trim().split(/\s+/).find((part) => part.includes('http'));
    }

    if (!token && clipboardText.includes('#judge=')) {
      judgeUrl = clipboardText.includes('http')
        ? clipboardText
        : `${productionUrl.replace(/\/$/, '')}${clipboardText.startsWith('#') ? '/' : ''}${clipboardText}`;
    }

    if (!judgeUrl && token) {
      judgeUrl = `${productionUrl.replace(/\/$/, '')}/?judge=${token}`;
    }

    expect(judgeUrl || token, `Expected judge share URL. clipboard=${clipboardText}`).toBeTruthy();

    await judge.goto(judgeUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    await expect(
      judge.getByText(/Both are unexpected sources of joy|Judge this|Score this|Submit judgement|Your score|Rate this|Pick a score/i).first()
    ).toBeVisible({ timeout: 30000 });

    await playerContext.close();
    await judgeContext.close();
  });
});

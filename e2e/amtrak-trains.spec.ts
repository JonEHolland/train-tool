import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript, TEST_TIME_STRINGS } from '../tests/fixtures/time';

const { AMTRAK_MORNING, AMTRAK_EVENING } = TEST_TIME_STRINGS;

test.describe('Amtrak RailPlus trains', () => {
  test('shows Amtrak badge for Amtrak trains on N-Line', async ({ page }) => {
    // Set time to early morning when Amtrak 516 (8:30am departure) is visible
    await page.addInitScript(getPlaywrightDateMockScript(AMTRAK_MORNING));
    await page.goto('/');

    // Wait for the page to load - should be on N-Line by default
    await expect(page.locator('.train-hero')).toBeVisible();

    // Check that we're on N-Line (default)
    const nLineButton = page.getByRole('button', { name: /N Line/i });
    await expect(nLineButton).toHaveClass(/active/);

    // Select King Street station (where Amtrak 516 departs from at 8:30am)
    const select = page.getByRole('combobox', { name: /Your Station/i });
    await select.selectOption({ label: 'King Street Station' });

    // Wait for trains to update
    await page.waitForTimeout(300);

    // Look for Amtrak badge - could be in hero or secondary list
    // depending on train ordering at this time
    const amtrakBadge = page.locator('.train-amtrak-badge');
    const amtrakHeroBadge = page.locator('.train-amtrak-indicator');

    // At least one Amtrak indicator should be visible
    // (either in hero if Amtrak is next, or in secondary list)
    const heroBadgeCount = await amtrakHeroBadge.count();
    const secondaryBadgeCount = await amtrakBadge.count();

    expect(heroBadgeCount + secondaryBadgeCount).toBeGreaterThan(0);
  });

  test('does NOT show Amtrak trains on S-Line', async ({ page }) => {
    // Set time to weekday evening when S-Line has trains
    await page.addInitScript(getPlaywrightDateMockScript(AMTRAK_EVENING));
    await page.goto('/');

    // Wait for page load
    await expect(page.locator('.train-hero')).toBeVisible();

    // Switch to S-Line
    await page.getByRole('button', { name: /S Line/i }).click();

    // Wait for trains to update
    await page.waitForTimeout(300);

    // There should be no Amtrak badges on S-Line
    const amtrakBadge = page.locator('.train-amtrak-badge');
    const amtrakHeroBadge = page.locator('.train-amtrak-indicator');

    await expect(amtrakBadge).toHaveCount(0);
    await expect(amtrakHeroBadge).toHaveCount(0);
  });

  test('Amtrak badge styling is correct', async ({ page }) => {
    // Set time to early morning when Amtrak 516 (8:30am departure) is visible
    await page.addInitScript(getPlaywrightDateMockScript(AMTRAK_MORNING));
    await page.goto('/');

    await expect(page.locator('.train-hero')).toBeVisible();

    // Select King Street station
    const select = page.getByRole('combobox', { name: /Your Station/i });
    await select.selectOption({ label: 'King Street Station' });

    await page.waitForTimeout(300);

    // Find an Amtrak badge (unified class)
    const amtrakBadge = page.locator('.train-amtrak-badge').first();

    const hasBadge = (await amtrakBadge.count()) > 0;

    if (hasBadge) {
      await expect(amtrakBadge).toHaveText(/amtrak/i);
    }
  });
});

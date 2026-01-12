import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript } from '../tests/fixtures/time';

// Test times as ISO strings
// These dates fall within the schedule data's valid range (20260102 - 20260116)
const WEEKDAY_MORNING = '2026-01-06T07:30:00';    // Tuesday
const WEEKDAY_EVENING = '2026-01-06T17:30:00';    // Tuesday
const SATURDAY_AFTERNOON = '2026-01-10T14:00:00'; // Saturday

test.describe('Visual Regression', () => {
  test('N-Line morning view', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for any animations to settle
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('n-line-morning.png', {
      maxDiffPixels: 100,
    });
  });

  test('S-Line evening view', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_EVENING));
    await page.goto('/');

    // Switch to S-Line
    await page.getByRole('button', { name: /S Line/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('s-line-evening.png', {
      maxDiffPixels: 100,
    });
  });

  test('Weekend no service view', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(SATURDAY_AFTERNOON));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('weekend-no-service.png', {
      maxDiffPixels: 100,
    });
  });

  test('Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('mobile-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('S-Line with destination tabs', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_EVENING));
    await page.goto('/');

    // Switch to S-Line from King Street (shows multiple destinations)
    await page.getByRole('button', { name: /S Line/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('s-line-destination-tabs.png', {
      maxDiffPixels: 100,
    });
  });

  test('Different station selected', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    await page.goto('/');

    // Select Everett Station
    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('everett-station-selected.png', {
      maxDiffPixels: 100,
    });
  });
});

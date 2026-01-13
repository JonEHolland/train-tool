import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript } from '../tests/fixtures/time';

// Test times as ISO strings
// These dates fall within the schedule data's valid range (20260102 - 20260116)
const WEEKDAY_MORNING = '2026-01-06T07:30:00';    // Tuesday
const WEEKDAY_EVENING = '2026-01-06T17:30:00';    // Tuesday
const SATURDAY_AFTERNOON = '2026-01-10T14:00:00'; // Saturday

// Urgency state test times (based on 6:15 AM Everett -> Seattle train)
const TRAIN_DEPARTING = '2026-01-06T06:15:00';    // Exact departure time (DEPARTING state)
const TRAIN_DANGER = '2026-01-06T06:14:00';       // 1 minute before (DANGER state - red)
const TRAIN_WARNING = '2026-01-06T06:12:00';      // 3 minutes before (WARNING state - burnt orange)
const TRAIN_COMFORTABLE = '2026-01-06T06:05:00';  // 10 minutes before (COMFORTABLE state - yellow)
const TRAIN_NORMAL = '2026-01-06T05:45:00';       // 30 minutes before (NORMAL state - teal)

// Mock empty alerts response to ensure consistent screenshots
const EMPTY_ALERTS_RESPONSE = { entity: [] };

test.describe('Visual Regression', () => {
  // Mock alerts API to return empty data for all visual tests
  test.beforeEach(async ({ page }) => {
    await page.route('**/api.allorigins.win/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_ALERTS_RESPONSE),
      });
    });
  });

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

  // Urgency state visual tests - one for each color state
  test('Urgency: Normal state (>15 min, teal)', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(TRAIN_NORMAL));
    await page.goto('/');

    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('urgency-normal.png', {
      maxDiffPixels: 100,
    });
  });

  test('Urgency: Comfortable state (6-15 min, yellow)', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(TRAIN_COMFORTABLE));
    await page.goto('/');

    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('urgency-comfortable.png', {
      maxDiffPixels: 100,
    });
  });

  test('Urgency: Warning state (3-5 min, burnt orange)', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(TRAIN_WARNING));
    await page.goto('/');

    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('urgency-warning.png', {
      maxDiffPixels: 100,
    });
  });

  test('Urgency: Danger state (1-2 min, red)', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(TRAIN_DANGER));
    await page.goto('/');

    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('urgency-danger.png', {
      maxDiffPixels: 100,
    });
  });

  test('Urgency: Departing state (0 min, red)', async ({ page }) => {
    await page.addInitScript(getPlaywrightDateMockScript(TRAIN_DEPARTING));
    await page.goto('/');

    await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('urgency-departing.png', {
      maxDiffPixels: 100,
    });
  });
});

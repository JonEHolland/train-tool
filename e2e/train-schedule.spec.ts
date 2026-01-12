import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript } from '../tests/fixtures/time';

// Test times as ISO strings for Playwright injection
// These dates fall within the schedule data's valid range (20260102 - 20260116)
const WEEKDAY_MORNING = '2026-01-06T07:30:00';    // Tuesday
const WEEKDAY_EVENING = '2026-01-06T17:30:00';    // Tuesday
const SATURDAY_AFTERNOON = '2026-01-10T14:00:00'; // Saturday
const WEEKDAY_LATE_NIGHT = '2026-01-06T23:30:00'; // Tuesday

test.describe('Train Schedule App', () => {
  test.describe('weekday morning', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    });

    test('loads with N-Line selected by default', async ({ page }) => {
      await page.goto('/');

      // N-Line button should be active
      const nLineButton = page.getByRole('button', { name: /N Line/i });
      await expect(nLineButton).toHaveClass(/active/);
    });

    test('shows train countdown (not "No service")', async ({ page }) => {
      await page.goto('/');

      // Should show train hero countdown
      await expect(page.locator('.train-hero-countdown')).toBeVisible();

      // Should NOT show "No service" message
      await expect(page.getByText('No service today')).not.toBeVisible();
    });

    test('shows station selector with N-Line stations', async ({ page }) => {
      await page.goto('/');

      const select = page.getByRole('combobox', { name: /Your Station/i });
      await expect(select).toBeVisible();

      // Should have N-Line stations
      await expect(select).toContainText('King Street');
      await expect(select).toContainText('Everett');
    });

    test('shows direction header', async ({ page }) => {
      await page.goto('/');

      // Should show "To [Station]" header
      await expect(page.getByText(/To .+ Station/)).toBeVisible();
    });
  });

  test.describe('route switching', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_EVENING));
    });

    test('switches to S-Line when clicked', async ({ page }) => {
      await page.goto('/');

      // Click S-Line button
      await page.getByRole('button', { name: /S Line/i }).click();

      // S-Line should now be active
      const sLineButton = page.getByRole('button', { name: /S Line/i });
      await expect(sLineButton).toHaveClass(/active/);

      // N-Line should not be active
      const nLineButton = page.getByRole('button', { name: /N Line/i });
      await expect(nLineButton).not.toHaveClass(/active/);
    });

    test('updates station dropdown when route changes', async ({ page }) => {
      await page.goto('/');

      // Click S-Line
      await page.getByRole('button', { name: /S Line/i }).click();

      const select = page.getByRole('combobox', { name: /Your Station/i });

      // Should have S-Line stations
      await expect(select).toContainText('Tacoma');
      await expect(select).toContainText('Lakewood');
    });

    test('shows destination tabs for S-Line (multiple termini)', async ({ page }) => {
      await page.goto('/');

      // Switch to S-Line
      await page.getByRole('button', { name: /S Line/i }).click();

      // Should show destination tabs (using class selector to avoid matching route button)
      await expect(page.locator('.destination-tab').filter({ hasText: /Tacoma/i })).toBeVisible();
      await expect(page.locator('.destination-tab').filter({ hasText: /Lakewood/i })).toBeVisible();
    });
  });

  test.describe('station selection', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    });

    test('changes displayed trains when station is selected', async ({ page }) => {
      await page.goto('/');

      // Select Everett Station
      await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');

      // Direction should change (from Everett, you go south to King Street)
      await expect(page.getByText(/To King Street/i)).toBeVisible();
    });

    test('persists station selection on reload', async ({ page }) => {
      await page.goto('/');

      // Select a different station
      await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Edmonds Station');

      // Reload the page (need to re-inject the date mock)
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.reload();

      // Station should still be selected (check the selected option text)
      const select = page.getByRole('combobox', { name: /Your Station/i });
      await expect(select.locator('option:checked')).toHaveText('Edmonds Station');
    });
  });

  test.describe('weekend behavior', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(SATURDAY_AFTERNOON));
    });

    test('shows "No service today" message on Saturday', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('No service today')).toBeVisible();
      await expect(page.getByText("Sounder trains don't run on weekends")).toBeVisible();
    });

    test('shows weekend notice banner', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText(/do not operate on weekends/i)).toBeVisible();
    });
  });

  test.describe('late night / tomorrow trains', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_LATE_NIGHT));
    });

    test('shows "Tomorrow" for next-day trains', async ({ page }) => {
      await page.goto('/');

      // Late at night, next trains are tomorrow (use first() to avoid strict mode)
      await expect(page.locator('.train-hero-countdown').getByText('Tomorrow')).toBeVisible();
    });
  });

  test.describe('direction tabs interaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_EVENING));
    });

    test('switches content when direction tab is clicked', async ({ page }) => {
      await page.goto('/');

      // Switch to S-Line (has multiple destinations)
      await page.getByRole('button', { name: /S Line/i }).click();

      // Wait for destination tabs to appear
      await expect(page.locator('.destination-tabs')).toBeVisible();

      // Click the Lakewood tab (use specific selector)
      const lakewoodTab = page.locator('.destination-tab').filter({ hasText: /Lakewood/i });
      await lakewoodTab.click();

      // Should now show Lakewood direction
      await expect(page.getByText(/To Lakewood/i)).toBeVisible();
    });
  });

  test.describe('accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    });

    test('station select has accessible label', async ({ page }) => {
      await page.goto('/');

      const select = page.getByRole('combobox', { name: /Your Station/i });
      await expect(select).toBeVisible();
    });

    test('route buttons are keyboard accessible', async ({ page }) => {
      await page.goto('/');

      // Tab to S-Line button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Should have switched to S-Line
      const sLineButton = page.getByRole('button', { name: /S Line/i });
      await expect(sLineButton).toHaveClass(/active/);
    });
  });
});

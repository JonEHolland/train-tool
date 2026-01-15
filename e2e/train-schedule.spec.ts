import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript, TEST_TIME_STRINGS } from '../tests/fixtures/time';

// Destructure test times for cleaner usage
const {
  WEEKDAY_MORNING,
  WEEKDAY_EVENING,
  SATURDAY_AFTERNOON,
  WEEKDAY_LATE_NIGHT,
  TRAIN_DEPARTING,
  TRAIN_JUST_DEPARTED,
} = TEST_TIME_STRINGS;

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

      // Should NOT show weekend message
      await expect(page.getByText('No trains on weekends')).not.toBeVisible();
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

      // Should show "to [Station]" header (lowercase after train number)
      await expect(page.getByText(/to .+ Station/i)).toBeVisible();
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

      // Should show destination tabs (using role="tab" from UI Tabs component)
      await expect(page.getByRole('tab', { name: /Tacoma/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Lakewood/i })).toBeVisible();
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

    test('shows weekend message on Saturday', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('No trains on weekends')).toBeVisible();
      await expect(page.getByText('Service resumes Monday morning')).toBeVisible();
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

      // Wait for destination tabs to appear (using role="tablist" from UI Tabs component)
      await expect(page.getByRole('tablist')).toBeVisible();

      // Click the Lakewood tab (using role="tab" from UI Tabs component)
      await page.getByRole('tab', { name: /Lakewood/i }).click();

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

  test.describe('departing state', () => {
    test('shows "Departing" at exact departure time', async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(TRAIN_DEPARTING));
      await page.goto('/');

      // Select Everett Station where the 6:15 AM southbound train departs
      await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');

      // Should show "Departing" in the hero countdown
      await expect(page.locator('.train-hero-countdown')).toContainText('Departing');
    });

    test('shows "Departing" shortly after departure time', async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(TRAIN_JUST_DEPARTED));
      await page.goto('/');

      // Select Everett Station where the 6:15 AM southbound train departs
      await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');

      // Should still show "Departing" (within 30-second window)
      await expect(page.locator('.train-hero-countdown')).toContainText('Departing');
    });

    test('applies departing urgency class', async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(TRAIN_DEPARTING));
      await page.goto('/');

      // Select Everett Station where the 6:15 AM southbound train departs
      await page.getByRole('combobox', { name: /Your Station/i }).selectOption('Everett Station');

      // Should have departing class on hero
      await expect(page.locator('.train-hero.departing')).toBeVisible();
    });
  });
});

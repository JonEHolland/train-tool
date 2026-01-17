import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript, TEST_TIME_STRINGS } from '../tests/fixtures/time';
import { INSTALL_DISMISS_KEY } from '../src/utils/constants';

const { WEEKDAY_MORNING } = TEST_TIME_STRINGS;
const ALERT_ROUTE_PATTERN = '**/*allorigins*/**';

// Mock empty alerts for consistent testing
const MOCK_ALERT_RESPONSE_EMPTY = {
  entity: [],
};

test.describe('Install Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Set up time mock and empty alerts for consistent state
    await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));

    await page.route(ALERT_ROUTE_PATTERN, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
      });
    });
  });

  test.describe('Safari iOS', () => {
    test('shows iOS instructions banner', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      // Set up mocks
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();

      // Should show iOS-specific instructions
      await expect(page.getByText('Install App')).toBeVisible();
      await expect(page.getByText('Tap Share, then "Add to Home Screen"')).toBeVisible();

      // Should NOT show Install button (just instructions)
      await expect(page.getByRole('button', { name: 'Install' })).not.toBeVisible();

      await context.close();
    });

    test('hides banner after dismiss', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.getByText('Install App')).toBeVisible();

      // Dismiss the banner
      await page.getByRole('button', { name: 'Dismiss' }).click();

      // Banner should be hidden
      await expect(page.getByText('Install App')).not.toBeVisible();

      // Reload page - banner should still be hidden
      await page.reload();
      await expect(page.locator('.train-hero')).toBeVisible();
      await expect(page.getByText('Install App')).not.toBeVisible();

      await context.close();
    });
  });

  test.describe('Safari macOS', () => {
    test('shows macOS instructions banner', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      });
      const page = await context.newPage();

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();

      // Should show macOS-specific instructions
      await expect(page.getByText('Install App')).toBeVisible();
      await expect(page.getByText('File → Add to Dock for quick access')).toBeVisible();

      // Should NOT show Install button
      await expect(page.getByRole('button', { name: 'Install' })).not.toBeVisible();

      await context.close();
    });
  });

  test.describe('Chromium', () => {
    // Note: In E2E tests, we can't easily trigger the beforeinstallprompt event
    // since Playwright uses its own browser instance. The banner won't show
    // for chromium until that event fires. This is tested in unit tests.

    test('does not show banner without beforeinstallprompt event', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();

      // Banner should not be visible (waiting for beforeinstallprompt)
      await expect(page.getByText('Install App')).not.toBeVisible();
    });
  });

  test.describe('Standalone mode', () => {
    test('does not show banner when app is installed', async ({ browser }) => {
      // Simulate standalone mode by injecting CSS media query match
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      // Mock standalone mode detection
      await page.addInitScript(() => {
        Object.defineProperty(window.navigator, 'standalone', {
          value: true,
          writable: true,
        });
      });

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();

      // Banner should NOT appear when already installed
      await expect(page.getByText('Install App')).not.toBeVisible();

      await context.close();
    });
  });

  test.describe('Dismissal persistence', () => {
    test('respects dismissal across page reloads', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.getByText('Install App')).toBeVisible();

      // Dismiss the banner
      await page.getByRole('button', { name: 'Dismiss' }).click();
      await expect(page.getByText('Install App')).not.toBeVisible();

      // Verify localStorage was set
      const dismissedValue = await page.evaluate((key) => localStorage.getItem(key), INSTALL_DISMISS_KEY);
      expect(dismissedValue).toBeTruthy();

      // Reload and verify banner stays hidden
      await page.reload();
      await expect(page.locator('.train-hero')).toBeVisible();
      await expect(page.getByText('Install App')).not.toBeVisible();

      await context.close();
    });

    test('banner reappears after clearing dismissal', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');

      // Dismiss the banner
      await page.getByRole('button', { name: 'Dismiss' }).click();
      await expect(page.getByText('Install App')).not.toBeVisible();

      // Clear dismissal from localStorage
      await page.evaluate((key) => localStorage.removeItem(key), INSTALL_DISMISS_KEY);

      // Reload - banner should reappear
      await page.reload();
      await expect(page.getByText('Install App')).toBeVisible();

      await context.close();
    });
  });

  test.describe('Unsupported browser', () => {
    test('does not show banner for Firefox', async ({ browser }) => {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      });
      const page = await context.newPage();

      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();

      // Banner should not appear for unsupported browsers
      await expect(page.getByText('Install App')).not.toBeVisible();

      await context.close();
    });
  });
});

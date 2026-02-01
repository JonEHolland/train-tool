import { test, expect } from '@playwright/test';
import { getPlaywrightDateMockScript, TEST_TIME_STRINGS } from '../tests/fixtures/time';

// Destructure test times for cleaner usage
const { WEEKDAY_MORNING } = TEST_TIME_STRINGS;

// Time when train 1700 is the hero (departs 4:05pm from King Street)
const WEEKDAY_AFTERNOON = '2026-01-06T16:00:00';

// Mock alert responses for testing
const MOCK_ALERT_RESPONSE_GENERAL = {
  entity: [
    {
      id: 'alert-general',
      alert: {
        header_text: { translation: [{ text: 'System Advisory' }] },
        description_text: {
          translation: [{
            text: 'Please allow extra travel time today due to weather conditions.',
          }],
        },
        informed_entity: [{ route_id: 'SNDR_EV' }],
      },
    },
  ],
};

const MOCK_ALERT_RESPONSE_TRAIN_DELAYED = {
  entity: [
    {
      id: 'alert-delayed',
      alert: {
        header_text: { translation: [{ text: 'Service Delay' }] },
        description_text: {
          translation: [{
            // Train 1700 is displayed at this time
            text: 'Train 1700 is delayed 15 minutes due to signal issues.',
          }],
        },
        informed_entity: [{ route_id: 'SNDR_EV' }],
      },
    },
  ],
};

const MOCK_ALERT_RESPONSE_TRAIN_CANCELLED = {
  entity: [
    {
      id: 'alert-cancelled',
      alert: {
        header_text: { translation: [{ text: 'Train Cancellation' }] },
        description_text: {
          translation: [{
            text: 'Train 1700 has been cancelled due to equipment failure.',
          }],
        },
        informed_entity: [{ route_id: 'SNDR_EV' }],
      },
    },
  ],
};

const MOCK_ALERT_RESPONSE_EMPTY = {
  entity: [],
};

// Helper to set up alert route mock
const ALERT_ROUTE_PATTERN = '**/*allorigins*/**';

test.describe('Train Alerts', () => {
  test.describe('alert display', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    });

    test('page loads successfully with mocked empty alerts', async ({ page }) => {
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/');
      await expect(page.locator('.train-hero')).toBeVisible();
    });

    test('general alerts appear in SERVICE ALERTS card', async ({ page }) => {
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_GENERAL),
        });
      });

      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('.train-hero')).toBeVisible();

      // General alerts should appear in the AlertList card
      await expect(page.getByText('SERVICE ALERTS')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('System Advisory')).toBeVisible();
      await expect(page.getByText('Please allow extra travel time')).toBeVisible();
    });

    test('train-specific delayed alert shows inline and in SERVICE ALERTS', async ({ page }) => {
      // Use afternoon time when train 1700 is the hero
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_AFTERNOON));

      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_TRAIN_DELAYED),
        });
      });

      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('.train-hero')).toBeVisible();

      // Full alert appears in SERVICE ALERTS card (for context/reason)
      await expect(page.getByText('SERVICE ALERTS')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Service Delay')).toBeVisible();
      await expect(page.getByText('signal issues')).toBeVisible();

      // Formatted alert appears inline with train
      await expect(page.getByText('Running 15m late')).toBeVisible();
    });

    test('train-specific cancelled alert shows "Cancelled" in hero', async ({ page }) => {
      // Use afternoon time when train 1700 is the hero
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_AFTERNOON));

      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_TRAIN_CANCELLED),
        });
      });

      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('.train-hero')).toBeVisible();

      // Full alert appears in SERVICE ALERTS card
      await expect(page.getByText('SERVICE ALERTS')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Train Cancellation')).toBeVisible();

      // Hero shows "Cancelled" instead of countdown
      await expect(page.locator('.train-hero-countdown')).toContainText('Cancelled');
    });

    test('does not show SERVICE ALERTS when no alerts exist', async ({ page }) => {
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });

      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('.train-hero')).toBeVisible();

      // Should not show SERVICE ALERTS header (only appears when there are alerts)
      await expect(page.getByText('SERVICE ALERTS')).not.toBeVisible();
    });
  });

  test.describe('no alerts behavior', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));

      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ALERT_RESPONSE_EMPTY),
        });
      });
    });

    test('does not show train-specific alert text when no alerts', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('.train-hero')).toBeVisible();
      await expect(page.locator('.train-alert-text')).not.toBeVisible();
    });

    test('hero shows time countdown when no alerts', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('.train-hero')).toBeVisible();
      // Should show time like "8h 35m", not "Cancelled"
      await expect(page.locator('.train-hero-countdown')).not.toContainText('Cancelled');
    });
  });

  test.describe('network failure handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(getPlaywrightDateMockScript(WEEKDAY_MORNING));
    });

    test('handles alert fetch failure gracefully', async ({ page }) => {
      // Mock network failure
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.abort('failed');
      });

      await page.goto('/');

      // App should still render trains without alerts
      await expect(page.locator('.train-hero')).toBeVisible();

      // Should not show SERVICE ALERTS section (graceful degradation)
      await expect(page.getByText('SERVICE ALERTS')).not.toBeVisible();

      // Should show normal countdown (app still functional)
      await expect(page.locator('.train-hero-countdown')).toBeVisible();
    });

    test('handles malformed alert JSON gracefully', async ({ page }) => {
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'not valid json',
        });
      });

      await page.goto('/');

      // App should still work with train display
      await expect(page.locator('.train-hero')).toBeVisible();
      await expect(page.locator('.train-hero-countdown')).toBeVisible();
    });

    test('handles HTTP error response gracefully', async ({ page }) => {
      await page.route(ALERT_ROUTE_PATTERN, route => {
        route.fulfill({
          status: 500,
          contentType: 'text/plain',
          body: 'Internal Server Error',
        });
      });

      await page.goto('/');

      // App should still render trains without alerts
      await expect(page.locator('.train-hero')).toBeVisible();
      await expect(page.locator('.train-hero-countdown')).toBeVisible();
    });
  });
});

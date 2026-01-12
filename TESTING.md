# Testing Strategy Guide

This document defines the testing principles, patterns, and practices for the Sounder Train PWA. **All contributors (human or AI) must follow these guidelines** to ensure consistent, reliable, and maintainable tests.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Time Abstraction (Critical)](#time-abstraction-critical)
3. [Test Scenarios & Fixtures](#test-scenarios--fixtures)
4. [Testing Layers](#testing-layers)
5. [Test File Organization](#test-file-organization)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Common Pitfalls](#common-pitfalls)
10. [Checklist for New Features](#checklist-for-new-features)

---

## Core Principles

### 1. Deterministic Tests

Every test must produce the same result regardless of:
- What time of day the test runs
- What day of the week the test runs
- What timezone the machine is in
- Network availability (mock external APIs)

### 2. Isolated Tests

Each test must:
- Set up its own required state
- Clean up after itself
- Not depend on other tests running first
- Not leave side effects that affect other tests

### 3. Fast Feedback

- Unit tests should run in < 1 second total
- Component tests should run in < 5 seconds total
- E2E tests should run in < 30 seconds total

### 4. Test Behavior, Not Implementation

```typescript
// BAD: Testing implementation details
expect(component.state.isLoading).toBe(true);

// GOOD: Testing observable behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### 5. Readable Test Names

Test names should describe the scenario and expected outcome:

```typescript
// BAD
it('test1', () => { ... });

// GOOD
it('shows "No service" message on Saturday afternoon', () => { ... });
```

---

## Time Abstraction (Critical)

### Why This Matters

This application's behavior depends entirely on the current time:
- **Time of day** determines which trains are "upcoming" vs "tomorrow"
- **Day of week** determines if service is running (no weekends)
- **Calendar dates** determine holiday exceptions

**If tests use real time, they will be flaky and non-deterministic.**

### Time-Dependent Code Locations

| File | Function/Hook | Time Dependency |
|------|---------------|-----------------|
| `src/utils/time.ts` | `getCurrentMinutes()` | `new Date()` |
| `src/utils/time.ts` | `isWeekday()` | `new Date().getDay()` |
| `src/App.tsx` | `getActiveServices()` | `new Date()` for calendar logic |
| `src/App.tsx` | `useEffect` interval | `setInterval(60000)` |
| `src/hooks/useAlerts.ts` | `useEffect` interval | `setInterval(300000)` |
| `src/hooks/useServiceWorkerUpdate.ts` | `useEffect` interval | `setInterval(10000)` |

### How to Mock Time in Tests

#### Unit & Component Tests (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('time-dependent feature', () => {
  beforeEach(() => {
    // REQUIRED: Enable fake timers before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    // REQUIRED: Restore real timers after each test
    vi.useRealTimers();
  });

  it('behaves correctly at 8:30 AM on a Tuesday', () => {
    // Set the "current" time
    vi.setSystemTime(new Date('2025-01-14T08:30:00'));

    // Now all Date operations use the mocked time
    expect(getCurrentMinutes()).toBe(510); // 8*60 + 30
  });
});
```

#### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Inject Date mock before page loads
  await page.addInitScript(`
    const MOCK_TIME = new Date('2025-01-14T08:30:00').getTime();

    const OriginalDate = Date;
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(MOCK_TIME);
        } else {
          super(...args);
        }
      }
      static now() {
        return MOCK_TIME;
      }
    };
  `);
});

test('shows trains on weekday morning', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.train-hero-countdown')).toBeVisible();
});
```

### Timer Advancement

For testing intervals (train refresh, alert polling):

```typescript
it('refreshes train data every 60 seconds', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-14T08:30:00'));

  const { result } = renderHook(() => useTrainData());

  // Initial state
  expect(result.current.lastUpdated).toBe('8:30 AM');

  // Advance time by 60 seconds
  await vi.advanceTimersByTimeAsync(60000);

  // Should have refreshed
  expect(result.current.lastUpdated).toBe('8:31 AM');
});
```

---

## Test Scenarios & Fixtures

### Standard Test Scenarios

All tests should use these predefined scenarios for consistency:

```typescript
// tests/fixtures/time.ts

export const TEST_TIMES = {
  /**
   * Weekday morning - typical commute time
   * - N-Line: Northbound trains available (Seattle -> Everett)
   * - S-Line: Northbound trains available (Tacoma -> Seattle)
   */
  WEEKDAY_MORNING: new Date('2025-01-14T07:30:00'), // Tuesday 7:30 AM

  /**
   * Weekday midday - between commute periods
   * - Fewer trains, some directions may show "Tomorrow"
   */
  WEEKDAY_MIDDAY: new Date('2025-01-14T12:00:00'), // Tuesday 12:00 PM

  /**
   * Weekday evening - typical commute time
   * - N-Line: Southbound trains available (Everett -> Seattle)
   * - S-Line: Southbound trains available (Seattle -> Tacoma)
   */
  WEEKDAY_EVENING: new Date('2025-01-14T17:30:00'), // Tuesday 5:30 PM

  /**
   * Late night - all trains have passed
   * - All directions show "Tomorrow"
   */
  WEEKDAY_LATE_NIGHT: new Date('2025-01-14T23:30:00'), // Tuesday 11:30 PM

  /**
   * Weekend - no Sounder service
   * - Should show "No service" message
   */
  SATURDAY_AFTERNOON: new Date('2025-01-18T14:00:00'), // Saturday 2:00 PM
  SUNDAY_MORNING: new Date('2025-01-19T09:00:00'), // Sunday 9:00 AM

  /**
   * Edge cases
   */
  JUST_BEFORE_MIDNIGHT: new Date('2025-01-14T23:59:00'),
  JUST_AFTER_MIDNIGHT: new Date('2025-01-15T00:01:00'),

  /**
   * Urgency states - for testing countdown colors
   * Assume a train departs at 8:05 AM
   */
  TRAIN_IMMINENT: new Date('2025-01-14T08:04:00'),    // 1 min away - DANGER
  TRAIN_SOON: new Date('2025-01-14T08:02:00'),        // 3 min away - WARNING
  TRAIN_COMFORTABLE: new Date('2025-01-14T07:55:00'), // 10 min away - NORMAL
} as const;

export type TestTimeKey = keyof typeof TEST_TIMES;
```

### Using Test Scenarios

```typescript
import { TEST_TIMES } from '../fixtures/time';

describe('TrainList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows trains on weekday morning', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
    // ... test code
  });

  it('shows "No service" on Saturday', () => {
    vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
    // ... test code
  });
});
```

---

## Testing Layers

### Layer 0: Build Verification

**What:** Ensures the application compiles and bundles correctly.

```bash
npm run build
```

**Checks:**
- TypeScript compiles without errors
- Vite builds successfully
- Bundle size is within limits (< 250KB)

### Layer 1: Unit Tests

**What:** Test pure functions in isolation.

**Files to test:**
- `src/utils/time.ts` - All time formatting/calculation functions
- `src/components/CircularProgress.tsx` - `calculateProgress()`, `getUrgencyColor()`
- `src/App.tsx` - `getActiveServices()`, `getTrainsByDirection()`

**Example:**

```typescript
// src/utils/time.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEST_TIMES } from '../tests/fixtures/time';
import {
  parseTime,
  timeToMinutes,
  formatTime,
  getCurrentMinutes,
  isWeekday,
  formatCountdown,
  formatCountdownCompact
} from './time';

describe('time utilities', () => {
  describe('parseTime', () => {
    it('parses HH:MM:SS format', () => {
      expect(parseTime('14:30:00')).toEqual({
        hours: 14,
        minutes: 30,
        seconds: 0
      });
    });

    it('handles times past midnight (25:30:00)', () => {
      expect(parseTime('25:30:00')).toEqual({
        hours: 25,
        minutes: 30,
        seconds: 0
      });
    });
  });

  describe('timeToMinutes', () => {
    it('converts time string to minutes since midnight', () => {
      expect(timeToMinutes('00:00:00')).toBe(0);
      expect(timeToMinutes('01:00:00')).toBe(60);
      expect(timeToMinutes('14:30:00')).toBe(870);
    });
  });

  describe('formatTime', () => {
    it('formats 24h time to 12h with AM/PM', () => {
      expect(formatTime('08:30:00')).toBe('8:30 AM');
      expect(formatTime('14:30:00')).toBe('2:30 PM');
      expect(formatTime('00:00:00')).toBe('12:00 AM');
      expect(formatTime('12:00:00')).toBe('12:00 PM');
    });
  });

  describe('getCurrentMinutes (time-dependent)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns minutes since midnight', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // 7:30 AM
      expect(getCurrentMinutes()).toBe(450); // 7*60 + 30
    });
  });

  describe('isWeekday (time-dependent)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns true Monday through Friday', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Tuesday
      expect(isWeekday()).toBe(true);
    });

    it('returns false on Saturday and Sunday', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      expect(isWeekday()).toBe(false);

      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      expect(isWeekday()).toBe(false);
    });
  });

  describe('formatCountdown', () => {
    it('shows "Departing now" for < 1 minute', () => {
      expect(formatCountdown(0.5)).toBe('Departing now');
    });

    it('shows minutes for < 60 minutes', () => {
      expect(formatCountdown(15)).toBe('in 15 min');
      expect(formatCountdown(45)).toBe('in 45 min');
    });

    it('shows hours and minutes for >= 60 minutes', () => {
      expect(formatCountdown(90)).toBe('in 1h 30m');
      expect(formatCountdown(150)).toBe('in 2h 30m');
    });
  });
});
```

### Layer 2: Component Tests

**What:** Test React components render correctly and respond to interactions.

**Dependencies:** `@testing-library/react`, `@testing-library/jest-dom`

**Example:**

```typescript
// src/components/TrainList.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TEST_TIMES } from '../tests/fixtures/time';
import { TrainList } from './TrainList';

// Mock train data
const mockTrainsNorthbound = [
  {
    directionName: 'Everett Station',
    trains: [
      { destination: 'Everett Station', time: '08:05:00', minutesAway: 35, isTomorrow: false },
      { destination: 'Everett Station', time: '08:33:00', minutesAway: 63, isTomorrow: false },
    ],
  },
];

describe('TrainList', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders train countdown on weekday', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

    render(
      <TrainList
        trainsByDirection={mockTrainsNorthbound}
        isWeekend={false}
        hasStop={true}
        currentRoute="n-line"
      />
    );

    expect(screen.getByText('35m')).toBeInTheDocument();
    expect(screen.getByText('To Everett Station')).toBeInTheDocument();
  });

  it('shows "No service" on weekend', () => {
    vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);

    render(
      <TrainList
        trainsByDirection={[]}
        isWeekend={true}
        hasStop={true}
        currentRoute="n-line"
      />
    );

    expect(screen.getByText('No service today')).toBeInTheDocument();
    expect(screen.getByText("Sounder trains don't run on weekends")).toBeInTheDocument();
  });

  it('shows "Select a station" when no stop selected', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

    render(
      <TrainList
        trainsByDirection={[]}
        isWeekend={false}
        hasStop={false}
        currentRoute="n-line"
      />
    );

    expect(screen.getByText('Select a station')).toBeInTheDocument();
  });
});
```

### Layer 3: E2E Tests

**What:** Test complete user flows in a real browser.

**Tool:** Playwright

**Example:**

```typescript
// e2e/train-schedule.spec.ts
import { test, expect } from '@playwright/test';

// Helper to set up time mock
async function mockTime(page, isoTime: string) {
  await page.addInitScript(`
    const MOCK_TIME = new Date('${isoTime}').getTime();
    const OriginalDate = Date;
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(MOCK_TIME);
        else super(...args);
      }
      static now() { return MOCK_TIME; }
    };
  `);
}

test.describe('Train Schedule App', () => {
  test('shows trains on weekday morning', async ({ page }) => {
    await mockTime(page, '2025-01-14T07:30:00');
    await page.goto('/');

    // Should show N-Line by default
    await expect(page.getByRole('button', { name: /N Line/i })).toHaveClass(/active/);

    // Should show train countdown
    await expect(page.locator('.train-hero-countdown')).toBeVisible();
    await expect(page.locator('.train-hero-countdown')).not.toHaveText('Tomorrow');
  });

  test('shows no service on weekend', async ({ page }) => {
    await mockTime(page, '2025-01-18T14:00:00'); // Saturday
    await page.goto('/');

    await expect(page.getByText('No service today')).toBeVisible();
  });

  test('switches routes correctly', async ({ page }) => {
    await mockTime(page, '2025-01-14T17:30:00');
    await page.goto('/');

    // Click S-Line
    await page.getByRole('button', { name: /S Line/i }).click();

    // Should show S-Line stations
    await expect(page.getByRole('combobox')).toContainText('King Street');

    // Should show Tacoma/Lakewood as destination options
    await expect(page.getByRole('button', { name: /Tacoma/i })).toBeVisible();
  });

  test('changes station and shows correct trains', async ({ page }) => {
    await mockTime(page, '2025-01-14T07:30:00');
    await page.goto('/');

    // Select Everett Station
    await page.getByRole('combobox').selectOption('Everett Station');

    // Should show southbound trains (to King Street)
    await expect(page.getByText(/To King Street/i)).toBeVisible();
  });
});
```

---

## Test File Organization

```
train-tool/
├── src/
│   ├── components/
│   │   ├── TrainList.tsx
│   │   └── TrainList.test.tsx      # Co-located component tests
│   ├── hooks/
│   │   ├── useAlerts.ts
│   │   └── useAlerts.test.ts       # Co-located hook tests
│   ├── utils/
│   │   ├── time.ts
│   │   └── time.test.ts            # Co-located unit tests
│   └── App.test.tsx                # App-level integration tests
├── tests/
│   ├── fixtures/
│   │   └── time.ts                 # Test time scenarios
│   └── setup.ts                    # Global test setup
├── e2e/
│   ├── train-schedule.spec.ts      # E2E user flows
│   └── visual.spec.ts              # Visual regression tests
└── playwright/
    └── snapshots/                  # Visual baseline images
```

---

## Writing Tests

### Test Structure

Use the AAA pattern (Arrange, Act, Assert):

```typescript
it('shows warning color when train is 3 minutes away', () => {
  // Arrange
  vi.setSystemTime(TEST_TIMES.TRAIN_SOON);

  // Act
  const color = getUrgencyColor(3);

  // Assert
  expect(color).toBe('var(--color-status-warning)');
});
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- E2E files: `*.spec.ts`
- Describe blocks: Component or function name
- It blocks: "should/does [expected behavior] when [condition]"

### Required Setup for Time-Dependent Tests

```typescript
// ALWAYS include this for time-dependent tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

---

## Running Tests

### Commands

```bash
# Run all unit and component tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (debugging)
npm run test:e2e:ui

# Update visual snapshots
npm run test:e2e:update-snapshots
```

### CI Pipeline

Tests run automatically on:
- Every push to a branch
- Every pull request

The pipeline should:
1. Run type check (`tsc --noEmit`)
2. Run unit/component tests (`npm test`)
3. Run E2E tests (`npm run test:e2e`)
4. Build the application (`npm run build`)

---

## Visual Regression Testing

### Creating Baselines

Visual baselines should be captured at specific, deterministic times:

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('N-Line morning view', async ({ page }) => {
    await mockTime(page, '2025-01-14T07:30:00');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('n-line-morning.png');
  });

  test('S-Line evening view', async ({ page }) => {
    await mockTime(page, '2025-01-14T17:30:00');
    await page.goto('/');
    await page.getByRole('button', { name: /S Line/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('s-line-evening.png');
  });

  test('Weekend no service view', async ({ page }) => {
    await mockTime(page, '2025-01-18T14:00:00');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('weekend-no-service.png');
  });

  test('Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mockTime(page, '2025-01-14T07:30:00');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-view.png');
  });
});
```

### Updating Baselines

When intentional UI changes are made:

```bash
npm run test:e2e:update-snapshots
```

**Always review the diff** before committing updated snapshots.

---

## Common Pitfalls

### 1. Forgetting to Mock Time

```typescript
// BAD: Will be flaky depending on when tests run
it('shows weekday message', () => {
  expect(isWeekday()).toBe(true); // Fails on weekends!
});

// GOOD: Deterministic
it('shows weekday message', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-14T08:00:00')); // Tuesday
  expect(isWeekday()).toBe(true);
  vi.useRealTimers();
});
```

### 2. Not Cleaning Up Timers

```typescript
// BAD: Fake timers leak to other tests
beforeEach(() => {
  vi.useFakeTimers();
});
// Missing afterEach cleanup!

// GOOD: Proper cleanup
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
```

### 3. Testing Implementation Details

```typescript
// BAD: Tests internal state
expect(wrapper.instance().state.trains).toHaveLength(3);

// GOOD: Tests user-visible output
expect(screen.getAllByRole('listitem')).toHaveLength(3);
```

### 4. Hardcoding Time Values

```typescript
// BAD: Magic date string
vi.setSystemTime(new Date('2025-01-14T08:30:00'));

// GOOD: Use named fixtures
vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
```

### 5. Network Requests in Tests

```typescript
// BAD: Real network call
const alerts = await fetchAlerts();

// GOOD: Mocked response
vi.spyOn(global, 'fetch').mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ entity: [] }),
});
```

---

## Checklist for New Features

When adding a new feature, ensure:

- [ ] Unit tests for any new utility functions
- [ ] Component tests for any new React components
- [ ] Time mocking if feature depends on current time
- [ ] E2E test for the user flow
- [ ] Visual snapshot if UI changes
- [ ] All tests pass locally before pushing
- [ ] Tests use fixtures from `tests/fixtures/time.ts`
- [ ] No `new Date()` calls without corresponding test coverage

---

## Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

### tests/setup.ts

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Ensure timers are always restored
afterEach(() => {
  vi.useRealTimers();
});
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Summary

1. **Always mock time** in tests using `vi.useFakeTimers()` and `vi.setSystemTime()`
2. **Use predefined test scenarios** from `tests/fixtures/time.ts`
3. **Clean up after tests** with `vi.useRealTimers()` in `afterEach`
4. **Test behavior, not implementation** - focus on what users see
5. **Keep tests deterministic** - no reliance on real time, network, or external state

Following these guidelines ensures tests are reliable, maintainable, and trustworthy.

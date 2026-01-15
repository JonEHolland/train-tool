# Code Review Implementation Progress

This document tracks the implementation of improvements identified during an exhaustive code review of the Sounder Train Schedule PWA.

## Important: Workflow Instructions

**The user wants to review each change before continuing to the next item.**

For each remaining item:
1. Implement the fix
2. Run all tests: `npm run test` AND `npm run test:e2e`
3. Use Playwright MCP (`mcp__playwright__browser_navigate` to `http://localhost:5173/`) for visual verification
4. Take a screenshot to confirm the app works
5. Commit with a descriptive message
6. **STOP and wait for user review before proceeding to the next item**

If tests fail, fix them before committing. If a refactoring doesn't break any tests, that's a red flag - write tests to cover the changed code.

---

## Completed Items

### Priority 1: Critical Performance Issues

#### 1.1 Build Target (Completed)
- **Commit:** `7d40458`
- **Change:** `vite.config.ts` - Changed `target: 'esnext'` to `target: 'es2020'`
- **Impact:** Improves compatibility with older iOS/Android devices

#### 1.2 Service Worker Error Handling (Completed)
- **Commit:** `5318dd1`
- **Change:** `public/sw.js` - Added proper error handling fallback chain
- **Impact:** Returns user-friendly offline page instead of error when network fails

### Priority 2: Extract Logic from App.tsx (Completed)

#### 2.1 & 2.2 Extract Schedule Logic (Completed)
- **Commits:** `d436bd7`, `cc6a0cb`
- **Changes:**
  - Created `src/utils/schedule.ts` with `getActiveServices()` and `getTrainsByDirection()`
  - Added 19 unit tests in `src/utils/schedule.test.ts`
  - Fixed `tests/fixtures/schedule-data.ts` to use 2026 dates matching TEST_TIMES
- **Impact:** ~110 lines of business logic extracted from App.tsx

#### 2.3 Create useTrainSchedule Hook (Completed)
- **Commit:** `26cd2aa`
- **Changes:**
  - Created `src/hooks/useTrainSchedule.ts` for departing state management
  - Added 10 unit tests in `src/hooks/useTrainSchedule.test.ts`
  - Updated `src/App.tsx` to use the new hook
- **Impact:** App.tsx reduced from ~285 to ~107 lines

### Priority 3: Unnecessary Re-renders (In Progress)

#### 3.1 Fix TrainList Dependency Anti-pattern (Completed)
- **Commit:** `6b8f9c6`
- **Change:** `src/components/TrainList.tsx` - Added `useMemo` to create stable `directionKey`
- **Impact:** Prevents unnecessary `setActiveTab(0)` calls on every render

#### 3.2 Memoize Alert Attachment in App.tsx (Completed)
- Already addressed by useTrainSchedule hook (memoized via `useCallback`)
- No action needed

---

## Remaining Items

### Priority 3: Unnecessary Re-renders (Continued)

#### 3.3 Fix CircularProgress SVG Filter ID
- **File:** `src/components/ui/CircularProgress/CircularProgress.tsx`
- **Line:** ~44

**Current code:**
```typescript
const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;
```

**Problem:** Generates a new random ID on every render, causing unnecessary SVG DOM mutations.

**Fix:** Use `useState` to generate the ID once:
```typescript
const [filterId] = useState(() => `glow-${Math.random().toString(36).substr(2, 9)}`);
```

**Tests:** Existing CircularProgress tests should pass. The visual appearance should be identical.

---

#### 3.4 Add React.memo to List Components
- **Files:**
  - `src/components/AlertList.tsx`
  - `src/components/RouteSelect.tsx`
  - `src/components/StopSelect.tsx`

**Current code (example):**
```typescript
export function AlertList({ alerts, loading, error }: AlertListProps) {
  // ...
}
```

**Fix:** Wrap each component export with `React.memo`:
```typescript
import { memo } from 'react';

function AlertListComponent({ alerts, loading, error }: AlertListProps) {
  // ... existing implementation
}

export const AlertList = memo(AlertListComponent);
```

Do this for all three components. This prevents re-renders when parent updates but props haven't changed.

**Tests:** All existing tests should pass. Components should behave identically.

---

### Priority 4: CSS & Layout Optimization

#### 4.1 Move Train CSS to Component Modules
- **Source:** `src/App.css` (currently ~548 lines)
- **Targets:**
  - `src/components/TrainList.module.css` (new file)
  - `src/components/AlertList.module.css` (new file)

**What to move to `TrainList.module.css`:**
- All `.train-*` classes (`.train-hero`, `.train-hero-countdown`, `.train-secondary-item`, etc.)
- Lines approximately 160-463 in App.css

**What to move to `AlertList.module.css`:**
- All `.alert-*` classes if any exist specifically for alerts
- The SERVICE ALERTS card styling

**What stays in `App.css`:**
- `:root` CSS variables (design tokens)
- `.container` and layout primitives
- Body/html base styles

**Implementation steps:**
1. Create the new `.module.css` files
2. Move the relevant CSS classes
3. Update component imports: `import styles from './TrainList.module.css'`
4. Update className usage: `className="train-hero"` → `className={styles.trainHero}`
5. Convert kebab-case class names to camelCase for CSS modules

**Tests:** Visual regression tests will catch any styling issues. Run `npm run test:e2e` and verify screenshots match.

---

#### 4.2 Add CSS Containment
- **File:** Wherever `.train-hero` and `.train-secondary-item` end up (TrainList.module.css or App.css)

**Add to these classes:**
```css
.train-hero {
  /* existing styles */
  contain: layout style paint;
}

.train-secondary-item {
  /* existing styles */
  contain: layout style paint;
}
```

**Why:** Containment tells the browser that updates inside these elements won't affect layout outside them, enabling paint/layout optimizations during countdown updates.

**Tests:** Visual regression should pass. No functional change.

---

#### 4.3 Replace Hardcoded Colors
- **File:** `src/App.css`
- **Lines:** ~111 and ~281

**Current code:**
```css
/* Line ~111 */
background: rgba(10, 22, 40, 0.4);

/* Line ~281 */
background: rgba(255, 255, 255, 0.03);
```

**Fix:** Add new CSS variables to `:root` and use them:
```css
:root {
  /* existing variables */
  --color-overlay-dark: rgba(10, 22, 40, 0.4);
  --color-overlay-light: rgba(255, 255, 255, 0.03);
}

/* Then replace hardcoded values */
background: var(--color-overlay-dark);
background: var(--color-overlay-light);
```

**Tests:** Visual regression should pass. Colors should be identical.

---

### Priority 5: Code Quality & DRY Violations

#### 5.1 Extract SEVERITY_RANK Constant
- **File:** `src/utils/parseTrainAlerts.ts`

**Current code has duplication:**
```typescript
// Lines 29-34: SEVERITY_KEYWORDS ordering implies rank
const SEVERITY_KEYWORDS: Record<AlertSeverity, string[]> = {
  cancelled: [...],
  delayed: [...],
  modified: [...],
  info: [...],
};

// Lines 159-164: Explicit rank
const severityRank: Record<AlertSeverity, number> = {
  cancelled: 4,
  delayed: 3,
  modified: 2,
  info: 1,
};
```

**Fix:** Extract to a single constant at the top of the file:
```typescript
/** Severity ranking - higher number = more severe */
export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  cancelled: 4,
  delayed: 3,
  modified: 2,
  info: 1,
} as const;
```

Then use `SEVERITY_RANK` in the comparison function instead of the inline object.

**Tests:** Existing parseTrainAlerts tests should pass. Add a test verifying severity ordering if not already covered.

---

#### 5.2 Deduplicate Test Times
- **Files:**
  - `tests/fixtures/time.ts` - Has `TEST_TIMES` as Date objects
  - `e2e/train-schedule.spec.ts` - Has hardcoded ISO strings like `'2026-01-06T07:30:00'`
  - `e2e/visual.spec.ts` - Has same hardcoded ISO strings

**Fix:** Export ISO strings from fixtures:
```typescript
// In tests/fixtures/time.ts, add:
export const TEST_TIME_STRINGS = {
  WEEKDAY_MORNING: '2026-01-06T07:30:00',
  WEEKDAY_EVENING: '2026-01-06T17:30:00',
  SATURDAY_AFTERNOON: '2026-01-10T14:00:00',
  // ... etc
} as const;
```

Then in E2E tests:
```typescript
import { TEST_TIME_STRINGS } from '../tests/fixtures/time';

// Replace hardcoded strings
const WEEKDAY_MORNING = TEST_TIME_STRINGS.WEEKDAY_MORNING;
```

**Tests:** All E2E tests should still pass with no behavior change.

---

#### 5.3 Consolidate Countdown Formatting
- **File:** `src/utils/time.ts`
- **Lines:** ~35-51

**Current code has two similar functions:**
```typescript
export function formatCountdown(minutesAway: number): string {
  // ... ~8 lines
}

export function formatCountdownCompact(minutesAway: number): string {
  // ... ~8 lines, very similar logic
}
```

**Fix:** Combine into one function with an options parameter:
```typescript
interface FormatCountdownOptions {
  compact?: boolean;
}

export function formatCountdown(
  minutesAway: number,
  options: FormatCountdownOptions = {}
): string {
  const { compact = false } = options;

  if (minutesAway < 60) {
    return compact ? `${minutesAway}m` : `in ${minutesAway} min`;
  }

  const hours = Math.floor(minutesAway / 60);
  const mins = minutesAway % 60;

  if (compact) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return mins > 0 ? `in ${hours}h ${mins} min` : `in ${hours}h`;
}
```

Keep `formatCountdownCompact` as a simple wrapper for backwards compatibility:
```typescript
export function formatCountdownCompact(minutesAway: number): string {
  return formatCountdown(minutesAway, { compact: true });
}
```

**Tests:** Existing time.test.ts tests should pass. May need to add tests for the new options parameter.

---

#### 5.4 Fix Direction Arrow Logic
- **File:** `src/components/TrainList.tsx`
- **Lines:** ~125-144

**Current code:**
```typescript
function getDirectionArrow(directionName: string, currentRoute: string): string {
  const name = directionName.toLowerCase();
  if (name.includes('everett') || name.includes('edmonds') || name.includes('mukilteo')) {
    return '↑';
  }
  // ... more hardcoded station names
}
```

**Problem:** Fragile string matching. If station names change in GTFS data, arrows break silently.

**Fix option 1:** Extract to utility with clear documentation:
```typescript
// src/utils/trainDirection.ts
const NORTHBOUND_STATIONS = ['everett', 'edmonds', 'mukilteo'];
const SOUTHBOUND_STATIONS = ['tacoma', 'lakewood', 'puyallup', 'sumner', 'auburn', 'kent', 'tukwila'];

export function getDirectionArrow(destinationName: string, route: string): string {
  const name = destinationName.toLowerCase();

  if (route === 'n-line') {
    // N-Line: North = Everett direction, South = Seattle direction
    if (NORTHBOUND_STATIONS.some(s => name.includes(s))) return '↑';
    return '↓';
  }

  // S-Line: South = Tacoma/Lakewood, North = Seattle
  if (SOUTHBOUND_STATIONS.some(s => name.includes(s))) return '↓';
  return '↑';
}
```

**Tests:** Add unit tests for the new utility function covering both routes and various destinations.

---

### Priority 6: Error Handling & Edge Cases

#### 6.1 Add parseTime Input Validation
- **File:** `src/utils/time.ts`
- **Lines:** 7-10

**Current code:**
```typescript
export function parseTime(timeStr: string): ParsedTime {
  const [h, m, s] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m, seconds: s || 0 };
}
```

**Problem:** No validation. Malformed input produces `NaN` values that propagate silently.

**Fix:**
```typescript
export function parseTime(timeStr: string): ParsedTime {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    throw new Error(`Invalid time format: expected "HH:MM:SS" or "HH:MM", got "${timeStr}"`);
  }

  const parts = timeStr.split(':');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid time format: expected 2-3 parts, got ${parts.length}`);
  }

  const [h, m, s] = parts.map(Number);

  if (isNaN(h) || isNaN(m) || (s !== undefined && isNaN(s))) {
    throw new Error(`Invalid time format: non-numeric values in "${timeStr}"`);
  }

  return { hours: h, minutes: m, seconds: s || 0 };
}
```

**Tests:** Add tests for invalid inputs:
```typescript
it('throws on empty string', () => {
  expect(() => parseTime('')).toThrow();
});

it('throws on invalid format', () => {
  expect(() => parseTime('invalid')).toThrow();
});

it('throws on non-numeric parts', () => {
  expect(() => parseTime('ab:cd:ef')).toThrow();
});
```

---

#### 6.2 Add E2E Tests for Network Failures
- **File:** `e2e/train-alerts.spec.ts`

**Current state:** Only tests successful (200) responses.

**Add test:**
```typescript
test('handles alert fetch failure gracefully', async ({ page }) => {
  // Mock network failure
  await page.route('**/api.allorigins.win/**', route => {
    route.abort('failed');
  });

  await page.goto('/');

  // App should still render trains without alerts
  await expect(page.locator('.train-hero')).toBeVisible();

  // Should not show SERVICE ALERTS section (or show error state)
  // Verify no crash occurred
});

test('handles malformed alert JSON gracefully', async ({ page }) => {
  await page.route('**/api.allorigins.win/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'not valid json',
    });
  });

  await page.goto('/');
  await expect(page.locator('.train-hero')).toBeVisible();
});
```

**Tests:** These are new tests that verify graceful degradation.

---

#### 6.3 Optimize Carousel for Single-Child
- **File:** `src/components/ui/Carousel/Carousel.tsx`

**Current behavior:** Even with 1 item, renders full carousel UI (dots, swipe handling, etc.)

**Fix:** Early return for single item:
```typescript
export function Carousel({ children, ... }: CarouselProps) {
  const items = Children.toArray(children);
  const itemCount = items.length;

  // Optimize: single item doesn't need carousel UI
  if (itemCount === 1) {
    return <div className={styles.container}>{items[0]}</div>;
  }

  // ... rest of carousel logic
}
```

**Tests:** Add test:
```typescript
it('renders single child without carousel controls', () => {
  render(<Carousel><div>Only item</div></Carousel>);
  expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
});
```

---

### Priority 7: Type Safety & Documentation

#### 7.1 Export ParsedTime Interface
- **File:** `src/utils/time.ts`
- **Lines:** 1-5

**Current code:**
```typescript
interface ParsedTime {  // Not exported
  hours: number;
  minutes: number;
  seconds: number;
}
```

**Fix:**
```typescript
export interface ParsedTime {
  hours: number;
  minutes: number;
  seconds: number;
}
```

**Tests:** No behavior change. TypeScript compilation should still pass.

---

#### 7.2 Extract Magic Numbers to Constants
- **Files and locations:**

**`src/utils/parseTrainAlerts.ts:101`:**
```typescript
// Current
if (!isNaN(minutes) && minutes > 0 && minutes < 180) {

// Fix
const MAX_REASONABLE_DELAY_MINUTES = 180;
if (!isNaN(minutes) && minutes > 0 && minutes < MAX_REASONABLE_DELAY_MINUTES) {
```

**`scripts/fetch-gtfs.ts:219`:**
```typescript
// Current
const timeA = a.stops[0]?.departure || '99:99:99';

// Fix
const MAX_TIME_SENTINEL = '99:59:59'; // Sorts after all valid times
const timeA = a.stops[0]?.departure || MAX_TIME_SENTINEL;
```

**`scripts/update-sw-hash.ts:43`:**
```typescript
// Current
const hash = hashFiles.digest('hex').slice(0, 8);

// Fix
const CACHE_VERSION_HASH_LENGTH = 8;
const hash = hashFiles.digest('hex').slice(0, CACHE_VERSION_HASH_LENGTH);
```

**Tests:** No behavior change. Existing tests should pass.

---

#### 7.3 Improve Regex Pattern Documentation
- **File:** `src/utils/parseTrainAlerts.ts`
- **Lines:** 17-23

**Current code:**
```typescript
const TRAIN_NUMBER_PATTERNS = [
  /[Tt]rain\s*#?(\d{4}[A-Z]?)/g,
  /[Ss]ounder\s+train\s*#?(\d{4}[A-Z]?)/g,
  // ... more patterns
];
```

**Fix:** Use documented object structure:
```typescript
interface TrainNumberPattern {
  /** Human-readable description of what this pattern matches */
  name: string;
  /** The regex pattern */
  pattern: RegExp;
  /** Which capture group contains the train number (1-indexed) */
  groupIndex: number;
}

const TRAIN_NUMBER_PATTERNS: TrainNumberPattern[] = [
  {
    name: 'Standard format (Train 1700, Train #1700)',
    pattern: /[Tt]rain\s*#?(\d{4}[A-Z]?)/g,
    groupIndex: 1,
  },
  {
    name: 'Sounder train format',
    pattern: /[Ss]ounder\s+train\s*#?(\d{4}[A-Z]?)/g,
    groupIndex: 1,
  },
  // ... etc
];
```

Then update `extractTrainNumbers()` to use the `groupIndex` property instead of iterating all capture groups.

**Tests:** Existing parseTrainAlerts tests should pass.

---

## Test Coverage Added (Phase 1)

| File | Tests Added | Coverage |
|------|-------------|----------|
| `src/utils/schedule.test.ts` | 19 tests | getActiveServices, getTrainsByDirection |
| `src/hooks/useTrainSchedule.test.ts` | 10 tests | Hook lifecycle, departing state, alerts |

**Total tests after Phase 1:** 391 unit tests, 35 E2E tests

---

## Files Modified (Phase 1)

- `vite.config.ts` - Build target
- `public/sw.js` - Error handling
- `src/utils/schedule.ts` - New file
- `src/utils/schedule.test.ts` - New file
- `src/hooks/useTrainSchedule.ts` - New file
- `src/hooks/useTrainSchedule.test.ts` - New file
- `src/App.tsx` - Refactored to use new utilities/hooks
- `tests/fixtures/schedule-data.ts` - Fixed dates

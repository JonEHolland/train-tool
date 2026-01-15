# Claude Code Guidelines for Sounder Train Schedule

## Quick Reference

### Commands
```bash
npm run dev          # Start dev server at localhost:5173
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run build        # Production build
npm run fetch-data   # Update GTFS schedule data
```

### Key Constants (`src/utils/constants.ts`)
| Constant | Value | Purpose |
|----------|-------|---------|
| URGENCY_THRESHOLDS.DANGER | 2 min | Red - time to run! |
| URGENCY_THRESHOLDS.WARNING | 5 min | Orange - hurry |
| URGENCY_THRESHOLDS.COMFORTABLE | 15 min | Yellow - comfortable |
| UPDATE_INTERVAL_MS | 10,000 | Countdown refresh rate |
| DEPARTING_DURATION_MS | 30,000 | How long to show "Departing" |

### File Locations
| Purpose | Location |
|---------|----------|
| Main app logic | `src/App.tsx` |
| Type definitions | `src/types.ts` |
| Design system (CSS vars) | `src/App.css` (lines 1-57) |
| Time utilities | `src/utils/time.ts` |
| Schedule logic | `src/utils/schedule.ts` |
| Direction arrows | `src/utils/trainDirection.ts` |
| Alert parsing | `src/utils/parseTrainAlerts.ts` |
| Departing state hook | `src/hooks/useTrainSchedule.ts` |
| Test fixtures | `tests/fixtures/` |
| E2E tests | `e2e/` |
| Visual snapshots | `e2e/visual.spec.ts-snapshots/` |

---

## Project Overview

**Sounder Train Schedule** is a Progressive Web App for Seattle-area commuters to track Sound Transit Sounder train departures.

**Live:** https://www.soundertrain.com

### Tech Stack
- **React 18** + TypeScript
- **Vite 6** with single-file output (~205KB HTML)
- **Vitest** for unit tests, **Playwright** for E2E
- **Service Worker** for offline support

### Architecture
- Single-file PWA (all JS/CSS/data inlined)
- No routing library - state-driven UI
- localStorage for persistence (route, stop selection)
- GTFS data embedded at build time, alerts fetched at runtime

### Data Sources
- **Schedule:** Embedded `src/schedule-data.json` (from GTFS)
- **Alerts:** `s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json` via CORS proxy

---

## Feature Development Workflow

For all new features, follow this workflow:

### 1. Implementation
- Ensure `main` is up to date with origin
- Create a feature branch from `main`
- Implement the feature with appropriate tests
- Commit frequently at reasonable checkpoints

### 2. User Acceptance Testing (UAT)
- Use Playwright MCP to inject mock data for testing
- Explain suggested test scenarios to the user
- Present the feature for UAT testing
- **Wait for explicit UAT approval before proceeding**

### 3. After UAT Approval
- Run unit tests: `npm run test`
- Run E2E tests: `npm run test:e2e`
- Update any failing tests
- Update visual regression snapshots if needed: `npm run test:e2e:update-snapshots`
- **CRITICAL: All tests must be fixed. Do not delete failing tests. Fix the root cause.**

### 4. Documentation & Screenshots
- Update `README.md` if the feature is user-facing
- Update promotional screenshots in `docs/screenshots/` if there is new UX:
  - Inject mock data showcasing full app functionality
  - Showcase urgency states (danger/warning/comfortable)
  - Include alerts and various train states
  - Capture at mobile viewport for hero image
  - Hero image should showcase alerts and urgency states

### 5. Commit & PR
- Commit all changes with descriptive message
- Merge main into the branch and resolve conflicts
- Push branch and create PR

---

## Refactoring & Code Review Workflow

When implementing multiple code review improvements or refactoring tasks:

### Prioritized Implementation
1. **Group related changes into priorities** (e.g., Priority 1: Performance, Priority 2: Code Organization)
2. **Complete all items in a priority before moving to the next**
3. **Run tests after each priority** - `npm run test` and `npm run test:e2e`
4. **Commit each priority separately** with descriptive messages
5. **Update PR description** after each priority to track progress

### When to Skip or Simplify Changes
Not all suggested improvements are worth implementing. Skip or simplify when:
- **Over-engineering**: If current code is already well-organized (e.g., CSS modules refactor when existing CSS uses clear namespacing)
- **Cost exceeds benefit**: Restructuring that requires touching many files for minimal gain
- **Complexity without clarity**: Object structures that add indirection without improving understanding

**Example decisions made:**
- Skipped CSS modules refactor - existing `.train-*` classes are well-namespaced
- Simplified regex documentation - enhanced JSDoc instead of object restructure

### Test Coverage Expectations
Current test counts (update these when adding significant test suites):
- **Unit tests:** ~420 tests
- **E2E tests:** ~38 tests

When adding new utilities, aim for comprehensive test coverage:
- `src/utils/schedule.ts` → 19 tests
- `src/utils/trainDirection.ts` → 18 tests
- `src/hooks/useTrainSchedule.ts` → 10 tests

---

## Architecture & Code Patterns

### Component Hierarchy
```
App.tsx (orchestrator)
├── UpdateBanner (PWA updates)
├── RouteSelect (N-Line / S-Line toggle)
├── StopSelect (station dropdown)
├── AlertList (service alerts carousel)
├── TrainList (main display)
│   ├── Destination tabs (if multiple)
│   ├── Hero section (CircularProgress ring)
│   └── Secondary train list
└── Disclaimer (footer)
```

### Data Flow
```
schedule-data.json (static)
         ↓
schedule.ts: getActiveServices() → filters by calendar
         ↓
schedule.ts: getTrainsByDirection() → calculates minutesAway
         ↓
useTrainSchedule() hook → manages departing state + attaches alerts
         ↓
useAlerts() hook → fetches & parses alerts
         ↓
parseTrainAlerts() → maps alerts to train numbers
         ↓
TrainList → renders with urgency colors + alerts
         ↓
trainDirection.ts: getDirectionArrow() → determines ↑/↓ arrows
```

### State Management
- **No Redux/Zustand** - React useState + custom hooks
- **Persisted:** `sounder-route`, `sounder-stop` (via useLocalStorage)
- **Transient:** trainsByDirection, alerts, activeTab

### Key Algorithms

**Active Services** (`src/utils/schedule.ts:getActiveServices`):
1. Check if today falls within calendar start/end dates
2. Check if calendar[dayOfWeek] is true
3. Apply calendar_dates exceptions (type 1 = add, type 2 = remove)

**Minutes Away Calculation**:
```typescript
if (depMinutes >= nowMinutes) {
  minutesAway = depMinutes - nowMinutes
  isTomorrow = false
} else {
  minutesAway = (1440 - nowMinutes) + depMinutes  // wrap to tomorrow
  isTomorrow = true
}
```

**Departing State**:
- Train enters "Departing" when minutesAway < 1
- Shown for 30 seconds (DEPARTING_DURATION_MS)
- Tracked via departingTrainsRef to avoid re-renders

---

## Component Library (`src/components/ui/`)

The UI component library provides reusable, app-agnostic primitives. Access the dev showcase at `localhost:5173/components` during development.

### Structure
```
src/components/ui/
├── index.ts           # Barrel exports (tree-shakeable)
├── tokens.ts          # Design tokens as TS constants
├── Card/              # Each component has its own folder
│   ├── Card.tsx
│   ├── Card.module.css
│   └── index.ts
├── Button/
├── Badge/
├── Countdown/
├── CircularProgress/
└── ... (13 components total)
```

### Core Component Principles

**1. App-Agnostic** - Core components must NOT contain domain-specific logic:
- NO imports from app utilities (`constants.ts`, `time.ts`, etc.)
- NO hardcoded domain values (urgency thresholds, train-specific text)
- NO knowledge of trains, alerts, or schedules

**2. Presentational** - Components receive all data via props:
- Accept `children` for content rather than computing text internally
- Accept semantic props (`variant`, `severity`) rather than raw data
- Let the parent determine what to display and how to style it

**3. Composable** - Simple, focused APIs that combine well:
- Single responsibility per component
- Props that work together predictably
- No hidden side effects

### When to Create App-Specific Wrappers

Create wrapper components in `src/components/` when you need domain logic:

```tsx
// BAD: Domain logic in core component
// src/components/ui/Countdown/Countdown.tsx
export function Countdown({ minutesAway, isTomorrow }) {
  // ❌ Hardcoded thresholds
  const variant = minutesAway <= 2 ? 'danger' : minutesAway <= 5 ? 'warning' : 'default';
  // ❌ Domain-specific text
  const text = isTomorrow ? 'Tomorrow' : minutesAway < 1 ? 'Departing' : `${minutesAway}m`;
  return <span className={variant}>{text}</span>;
}

// GOOD: Core component is presentational
// src/components/ui/Countdown/Countdown.tsx
export function Countdown({ children, variant = 'default', pulse, large }) {
  return <span className={classNames(styles[variant], pulse && styles.pulse)}>{children}</span>;
}

// GOOD: App wrapper adds domain logic
// src/components/TrainCountdown.tsx
import { Countdown } from './ui';
import { URGENCY_THRESHOLDS } from '../utils/constants';

export function TrainCountdown({ minutesAway, isTomorrow, isDeparting }) {
  // ✅ App-specific logic lives here
  const variant = minutesAway <= URGENCY_THRESHOLDS.DANGER ? 'danger'
    : minutesAway <= URGENCY_THRESHOLDS.WARNING ? 'warning'
    : minutesAway <= URGENCY_THRESHOLDS.COMFORTABLE ? 'comfortable'
    : 'default';

  const text = isDeparting ? 'Departing' : isTomorrow ? 'Tomorrow' : `${minutesAway}m`;

  return <Countdown variant={variant} pulse={isDeparting} large>{text}</Countdown>;
}
```

### Available Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Card`, `CardHeader`, `CardBody` | Container | `overflow` |
| `Button` | Actions | `variant`, `active`, `disabled` |
| `Select` | Dropdown | `label`, `options`, `value`, `onChange` |
| `Badge` | Status indicator | `severity`, `size`, `dot` |
| `Label`, `Heading`, `Caption` | Typography | `level`, `muted` |
| `SegmentedControl` | Toggle group | `options`, `value`, `onChange` |
| `Tabs`, `TabPanel` | Tab navigation | `tabs`, `activeTab`, `onTabChange` |
| `Banner` | Notifications | `title`, `subtitle`, `visible`, `onDismiss` |
| `Carousel` | Swipeable content | `children` |
| `Tooltip` | Hover hints | `content`, `position` |
| `Countdown` | Time display | `variant`, `large`, `pulse` |
| `CircularProgress` | Progress ring | `progress`, `color`, `size` |
| `EmptyState` | Empty content | `title`, `subtitle`, `icon` |

### Importing Components

```tsx
// Tree-shakeable imports - only used components are bundled
import { Card, CardBody, Button, Badge } from './components/ui';
import { colors } from './components/ui';  // Design tokens
```

---

## Design System

### Color Palette (CSS Custom Properties)
```css
/* Backgrounds */
--color-bg-primary: #0A1628      /* Dark navy */
--color-bg-secondary: #111D31
--color-bg-tertiary: #1A2942

/* Accent */
--color-accent-primary: #5FEAD4  /* Teal - 15+ min, default */

/* Status/Urgency */
--color-status-danger: #FF6B6B   /* Red - ≤2 min */
--color-status-warning: #FF8C42  /* Orange - ≤5 min */
--color-status-comfortable: #FFD93D /* Yellow - ≤15 min */
--color-status-info: #4A90E2     /* Blue - modified service */
```

### Urgency State Classes
| Class | Minutes Away | Color |
|-------|--------------|-------|
| `.urgent` | ≤ 2 | Red (danger) |
| `.soon` | ≤ 5 | Orange (warning) |
| `.comfortable` | ≤ 15 | Yellow |
| (default) | > 15 | Teal (accent) |
| `.departing` | < 1 | Red + "Departing" text |
| `.tomorrow` | N/A | Teal + "Tomorrow" label |

### Alert Severity Colors
| Severity | Color | Ring Behavior |
|----------|-------|--------------|
| cancelled | Red | Shows "Cancelled" instead of time |
| delayed | Orange | Shows "Running Xm late" |
| modified | Blue | Normal countdown |
| info | Gray | Normal countdown |

---

## Testing Strategy

**See `TESTING.md` for comprehensive testing documentation.**

### Critical Rule: Always Mock Time

This app's behavior depends entirely on current time. Tests MUST use fake timers:

```typescript
import { TEST_TIMES } from '../tests/fixtures/time';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('shows trains on weekday morning', () => {
  vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
  // ... test code
});
```

### Test Fixtures
- `tests/fixtures/time.ts` - Predefined test times (weekday, weekend, urgency states)
  - `TEST_TIMES` - Date objects for unit tests with `vi.setSystemTime()`
  - `TEST_TIME_STRINGS` - ISO strings for E2E tests with `getPlaywrightDateMockScript()`
- `tests/fixtures/alerts.ts` - Mock alert data
- `tests/fixtures/schedule-data.ts` - Test schedule data

### Visual Regression
```bash
npm run test:e2e                    # Run visual tests
npm run test:e2e:update-snapshots   # Update baselines after intentional changes
```

Snapshots are in `e2e/visual.spec.ts-snapshots/` - always review diffs before committing.

---

## Common Tasks

### Adding a New UI Component (Core Library)
1. Create folder `src/components/ui/ComponentName/`
2. Create `ComponentName.tsx` (app-agnostic, presentational)
3. Create `ComponentName.module.css` for scoped styles
4. Create `index.ts` with exports
5. Add to barrel export in `src/components/ui/index.ts`
6. Add demo to `src/pages/ComponentShowcase.tsx`

### Adding an App-Specific Component
1. Create in `src/components/ComponentName.tsx`
2. Import and compose UI primitives from `./ui`
3. Add domain logic (thresholds, formatting, etc.)
4. Add tests in `src/components/ComponentName.test.tsx`

### Modifying Urgency Thresholds
1. Edit `src/utils/constants.ts` (URGENCY_THRESHOLDS)
2. Update app components that use thresholds (e.g., TrainList.tsx)
3. UI components like CircularProgress/Countdown are presentational - they receive computed values
4. Update visual regression snapshots

### Adding a New Alert Severity
1. Add to `AlertSeverity` type in `src/types.ts`
2. Update `classifySeverity()` in `src/utils/parseTrainAlerts.ts`
3. Add CSS class in `src/App.css`
4. Update tests in `src/utils/parseTrainAlerts.test.ts`

### Changing Time Display Format
1. Edit functions in `src/utils/time.ts`
2. Update tests in `src/utils/time.test.ts`

### Updating Schedule Data
```bash
npm run fetch-data  # Downloads latest GTFS from Sound Transit
```

---

## Performance Patterns

These patterns are established in the codebase for optimal React performance:

### React.memo for List Components
Components that receive stable props but have expensive parents should use `React.memo`:
```tsx
// AlertList, RouteSelect, StopSelect are wrapped with memo
export const AlertList = memo(function AlertList({ alerts, loading, error }: AlertListProps) {
  // ...
});
```

### useMemo for Stable Dependency Keys
When a useEffect dependency would create a new value each render, use `useMemo`:
```tsx
// BAD: Creates new string every render, causing unnecessary effect runs
useEffect(() => {
  setActiveTab(0);
}, [trainsByDirection.map(d => d.directionName).join(',')]);

// GOOD: Memoized key only changes when array reference changes
const directionKey = useMemo(
  () => trainsByDirection.map(d => d.directionName).join(','),
  [trainsByDirection]
);
useEffect(() => {
  setActiveTab(0);
}, [directionKey]);
```

### useState for Stable IDs
When a component needs a unique ID (e.g., for SVG filters), use `useState` with initializer:
```tsx
// Generates ID once on mount, stable across re-renders
const [filterId] = useState(() => `glow-${Math.random().toString(36).substr(2, 9)}`);
```

### CSS Containment
For frequently updating elements, use CSS containment to optimize browser paint:
```css
.train-hero {
  contain: layout style paint;
}
```

---

## Code Quality Patterns

### Named Constants over Magic Numbers
All magic numbers should be extracted to named constants:
```tsx
// In src/utils/parseTrainAlerts.ts
const MAX_REASONABLE_DELAY_MINUTES = 180;

// In scripts/fetch-gtfs.ts
const MAX_TIME_SENTINEL = '99:99:99';
```

### Exported Interfaces
Public interfaces should be exported for external use:
```tsx
export interface ParsedTime {
  hours: number;
  minutes: number;
  seconds: number;
}
```

### Input Validation
Functions that parse external data should validate input:
```tsx
export function parseTime(timeStr: string): ParsedTime {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    throw new Error(`Invalid time format: expected "HH:MM:SS" or "HH:MM", got "${timeStr}"`);
  }
  // ... rest of parsing
}
```

### Single-Item Optimization
Collections that may have one item should optimize for that case:
```tsx
// In Carousel component
if (itemCount === 1) {
  return (
    <div className={styles.carousel}>
      <div className={styles.slide}>{children[0]}</div>
    </div>
  );
}
// Full carousel UI only for multiple items
```

---

## Critical Rules & Pitfalls

### DO NOT
- **Delete failing tests** - Fix the root cause
- **Use `new Date()` in tests without mocking** - Tests will be flaky
- **Hardcode time values** - Use TEST_TIMES fixtures
- **Forget to clean up timers** - Always `vi.useRealTimers()` in afterEach
- **Commit failing tests** - All tests must pass before PR
- **Make network calls in unit tests** - Mock fetch responses

### ALWAYS
- **Mock time in time-dependent tests**
- **Use deterministic test data** from fixtures
- **Test behavior, not implementation** - Query by visible text/roles
- **Preserve the single-file build** - Don't add code splitting
- **Keep localStorage keys consistent** - `sounder-route`, `sounder-stop`

### Breaking Changes to Avoid
- Changing localStorage keys (will reset user preferences)
- Modifying the schedule-data.json structure (update fetch-gtfs.ts too)
- Removing CSS custom properties (used throughout)

---

## Project Structure

```
src/
├── App.tsx              # Main orchestrator
├── App.css              # Design system + global styles
├── main.tsx             # Entry point + SW registration
├── types.ts             # TypeScript interfaces
├── schedule-data.json   # Embedded GTFS data
├── components/
│   ├── ui/              # Core UI library (app-agnostic)
│   │   ├── index.ts     # Barrel exports
│   │   ├── tokens.ts    # Design tokens
│   │   ├── Card/        # Each component has folder
│   │   ├── Button/
│   │   ├── Badge/
│   │   ├── Countdown/
│   │   ├── CircularProgress/
│   │   └── ...          # 13 components total
│   ├── AlertList.tsx    # Service alerts carousel
│   ├── RouteSelect.tsx  # N/S Line toggle
│   ├── StopSelect.tsx   # Station dropdown
│   ├── TrainList.tsx    # Main train display
│   ├── UpdateBanner.tsx # PWA update notification
│   └── Disclaimer.tsx   # Footer
├── pages/
│   └── ComponentShowcase.tsx  # Dev-only UI showcase
├── hooks/
│   ├── useAlerts.ts     # Fetch & parse alerts (5-min polling)
│   ├── useLocalStorage.ts  # Persistent state
│   ├── useServiceWorkerUpdate.ts  # PWA updates
│   └── useTrainSchedule.ts  # Departing state management
└── utils/
    ├── constants.ts     # Urgency thresholds, intervals
    ├── time.ts          # Time formatting & calculation
    ├── schedule.ts      # Schedule filtering & train calculations
    ├── trainNumber.ts   # Extract train number from tripId
    ├── trainDirection.ts # Direction arrow logic
    └── parseTrainAlerts.ts  # Alert parsing & classification

tests/
├── setup.ts             # Global test setup
└── fixtures/
    ├── time.ts          # TEST_TIMES for deterministic tests
    ├── alerts.ts        # Mock alert data
    └── schedule-data.ts # Test schedule data

e2e/
├── train-schedule.spec.ts  # Schedule E2E tests
├── train-alerts.spec.ts    # Alert E2E tests
├── visual.spec.ts          # Visual regression
└── visual.spec.ts-snapshots/  # Baseline images

scripts/
├── fetch-gtfs.ts        # Download & process GTFS data
└── update-sw-hash.ts    # Update SW cache version

docs/screenshots/        # Promotional screenshots for README
public/
├── manifest.json        # PWA manifest
└── sw.js               # Service Worker
```

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
| Alert parsing | `src/utils/parseTrainAlerts.ts` |
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
App.tsx getActiveServices() → filters by calendar
         ↓
App.tsx getTrainsByDirection() → calculates minutesAway
         ↓
useAlerts() hook → fetches & parses alerts
         ↓
parseTrainAlerts() → maps alerts to train numbers
         ↓
TrainList → renders with urgency colors + alerts
```

### State Management
- **No Redux/Zustand** - React useState + custom hooks
- **Persisted:** `sounder-route`, `sounder-stop` (via useLocalStorage)
- **Transient:** trainsByDirection, alerts, activeTab

### Key Algorithms

**Active Services** (`App.tsx:getActiveServices`):
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

### Adding a New Component
1. Create in `src/components/ComponentName.tsx`
2. Add tests in `src/components/ComponentName.test.tsx`
3. Import and use in parent component

### Modifying Urgency Thresholds
1. Edit `src/utils/constants.ts`
2. Update `getUrgencyColor()` in `src/components/CircularProgress.tsx`
3. Update CSS classes in `src/App.css` if needed
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
├── App.css              # Design system + all styles
├── main.tsx             # Entry point + SW registration
├── types.ts             # TypeScript interfaces
├── schedule-data.json   # Embedded GTFS data
├── components/
│   ├── AlertList.tsx    # Service alerts carousel
│   ├── CircularProgress.tsx  # Countdown ring + urgency colors
│   ├── RouteSelect.tsx  # N/S Line toggle
│   ├── StopSelect.tsx   # Station dropdown
│   ├── TrainList.tsx    # Main train display
│   ├── UpdateBanner.tsx # PWA update notification
│   ├── Disclaimer.tsx   # Footer
│   └── EmptyState.tsx   # Reusable empty state
├── hooks/
│   ├── useAlerts.ts     # Fetch & parse alerts (5-min polling)
│   ├── useLocalStorage.ts  # Persistent state
│   └── useServiceWorkerUpdate.ts  # PWA updates
└── utils/
    ├── constants.ts     # Urgency thresholds, intervals
    ├── time.ts          # Time formatting & calculation
    ├── trainNumber.ts   # Extract train number from tripId
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

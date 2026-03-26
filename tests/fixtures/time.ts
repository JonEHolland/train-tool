/**
 * Dynamically derived test time scenarios for deterministic testing.
 *
 * Dates are computed from the actual schedule data so tests never break
 * when GTFS data is refreshed. Only the *times of day* are fixed — the
 * calendar dates are found automatically.
 *
 * IMPORTANT: All tests that depend on the current time MUST use these fixtures
 * with vi.useFakeTimers() and vi.setSystemTime() to ensure reproducible results.
 *
 * See TESTING.md for complete usage guidelines.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scheduleData = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/schedule-data.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// Date derivation from schedule data
// ---------------------------------------------------------------------------

interface TestDates {
  /** A Tuesday within the active Sounder weekday calendar */
  tuesday: string;
  /** The Wednesday after tuesday */
  wednesday: string;
  /** The Thursday after tuesday */
  thursday: string;
  /** The Friday after tuesday */
  friday: string;
  /** The Saturday after tuesday */
  saturday: string;
  /** The Sunday after tuesday */
  sunday: string;
  /** A weekday within the Sounder + Amtrak overlap (if any), else same as tuesday */
  amtrakWeekday: string;
}

function parseGtfsDate(yyyymmdd: string): Date {
  const y = +yyyymmdd.slice(0, 4);
  const m = +yyyymmdd.slice(4, 6) - 1;
  const d = +yyyymmdd.slice(6, 8);
  return new Date(y, m, d);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Find the next occurrence of a given day-of-week on or after `start`.
 * dayOfWeek: 0=Sun, 1=Mon, 2=Tue, ...
 */
function findNextDayOfWeek(start: Date, dayOfWeek: number): Date {
  const d = new Date(start);
  while (d.getDay() !== dayOfWeek) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function findTestDates(): TestDates {
  const calendars = scheduleData.calendars as Record<string, {
    monday: boolean; tuesday: boolean; wednesday: boolean;
    thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
    start_date: string; end_date: string;
  }>;

  // Find the first Sounder weekday calendar (runs Mon–Fri, has SNDR in the name)
  const sounderEntry = Object.entries(calendars).find(
    ([id, cal]) => id.includes('SNDR') && cal.monday && cal.tuesday && !cal.saturday
  );
  if (!sounderEntry) throw new Error('No Sounder weekday calendar found in schedule data');

  const [, sounderCal] = sounderEntry;
  const rangeStart = parseGtfsDate(sounderCal.start_date);
  const rangeEnd = parseGtfsDate(sounderCal.end_date);

  // Find the first Tuesday at least 1 day into the range
  const oneIn = new Date(rangeStart);
  oneIn.setDate(oneIn.getDate() + 1);
  const tuesday = findNextDayOfWeek(oneIn, 2); // 2 = Tuesday

  // Verify the full week (Tue–Sun) fits within the calendar range
  const sunday = new Date(tuesday);
  sunday.setDate(sunday.getDate() + 5);
  if (sunday > rangeEnd) {
    throw new Error(
      `Calendar range ${sounderCal.start_date}-${sounderCal.end_date} too narrow for a full test week`
    );
  }

  const tuesdayIso = toIso(tuesday);

  // Find Amtrak overlap: a weekday where both Sounder and Amtrak calendars are active.
  // Identify Amtrak service IDs from trips marked with provider: 'amtrak'.
  let amtrakWeekday = tuesdayIso;
  const schedule = scheduleData.schedule as Record<string, {
    directions: Record<string, { trips: Array<{ serviceId: string; provider?: string }> }>;
  }>;
  const amtrakServiceIds = new Set<string>();
  for (const route of Object.values(schedule)) {
    for (const dir of Object.values(route.directions)) {
      for (const trip of dir.trips) {
        if (trip.provider === 'amtrak') amtrakServiceIds.add(trip.serviceId);
      }
    }
  }
  for (const amtrakId of amtrakServiceIds) {
    const amtrakCal = calendars[amtrakId];
    if (!amtrakCal) continue;
    const amtrakStart = parseGtfsDate(amtrakCal.start_date);
    const amtrakEnd = parseGtfsDate(amtrakCal.end_date);
    const overlapStart = amtrakStart > rangeStart ? amtrakStart : rangeStart;
    const overlapEnd = amtrakEnd < rangeEnd ? amtrakEnd : rangeEnd;
    if (overlapStart <= overlapEnd) {
      const overlapDay = findNextDayOfWeek(overlapStart, 1); // Find a Monday
      amtrakWeekday = toIso(overlapDay <= overlapEnd ? overlapDay : overlapStart);
      break;
    }
  }

  return {
    tuesday: tuesdayIso,
    wednesday: addDays(tuesdayIso, 1),
    thursday: addDays(tuesdayIso, 2),
    friday: addDays(tuesdayIso, 3),
    saturday: addDays(tuesdayIso, 4),
    sunday: addDays(tuesdayIso, 5),
    amtrakWeekday,
  };
}

// Compute once at import time
const DATES = findTestDates();

/**
 * Exported date strings for use in unit test calendarDates exceptions.
 * Format: YYYYMMDD (GTFS format)
 */
export const TEST_DATES = {
  /** A valid weekday (Tuesday) in YYYYMMDD format */
  WEEKDAY: DATES.tuesday.replace(/-/g, ''),
  /** A valid Saturday in YYYYMMDD format */
  SATURDAY: DATES.saturday.replace(/-/g, ''),
  /** A valid Sunday in YYYYMMDD format */
  SUNDAY: DATES.sunday.replace(/-/g, ''),
};

// ---------------------------------------------------------------------------
// TEST_TIMES — Date objects for unit tests with vi.setSystemTime()
// ---------------------------------------------------------------------------

export const TEST_TIMES = {
  /** Weekday morning - typical commute time (Tuesday 7:30 AM) */
  WEEKDAY_MORNING: new Date(`${DATES.tuesday}T07:30:00`),

  /** Weekday midday - between commute periods (Tuesday 12:00 PM) */
  WEEKDAY_MIDDAY: new Date(`${DATES.tuesday}T12:00:00`),

  /** Weekday evening - typical commute time (Tuesday 5:30 PM) */
  WEEKDAY_EVENING: new Date(`${DATES.tuesday}T17:30:00`),

  /** Late night - all trains have passed (Tuesday 11:30 PM) */
  WEEKDAY_LATE_NIGHT: new Date(`${DATES.tuesday}T23:30:00`),

  /** Saturday afternoon - no Sounder service (Saturday 2:00 PM) */
  SATURDAY_AFTERNOON: new Date(`${DATES.saturday}T14:00:00`),

  /** Sunday morning - no Sounder service (Sunday 9:00 AM) */
  SUNDAY_MORNING: new Date(`${DATES.sunday}T09:00:00`),

  /** Edge case: just before midnight (Tuesday 11:59 PM) */
  JUST_BEFORE_MIDNIGHT: new Date(`${DATES.tuesday}T23:59:00`),

  /** Edge case: just after midnight (Wednesday 12:01 AM) */
  JUST_AFTER_MIDNIGHT: new Date(`${DATES.wednesday}T00:01:00`),

  /** Urgency: train 1 min away. Assumes train departs at 8:05 AM */
  TRAIN_IMMINENT: new Date(`${DATES.tuesday}T08:04:00`),

  /** Urgency: train 3 min away. Assumes train departs at 8:05 AM */
  TRAIN_SOON: new Date(`${DATES.tuesday}T08:02:00`),

  /** Urgency: train 10 min away. Assumes train departs at 8:05 AM */
  TRAIN_COMFORTABLE: new Date(`${DATES.tuesday}T07:55:00`),

  /** Departing: exact departure time. N-Line southbound from Everett at 06:15 AM */
  TRAIN_DEPARTING: new Date(`${DATES.tuesday}T06:15:00`),

  /** Departing: 15s after departure. Still within 30s departing window */
  TRAIN_JUST_DEPARTED: new Date(`${DATES.tuesday}T06:15:15`),

  /** Friday late night - next service should show "Monday" (skipping weekend) */
  FRIDAY_LATE_NIGHT: new Date(`${DATES.friday}T23:30:00`),

  /** Thursday late night - next service should show "Tomorrow" */
  THURSDAY_LATE_NIGHT: new Date(`${DATES.thursday}T23:30:00`),

  /** Wednesday late night - next service should show "Tomorrow" */
  WEDNESDAY_LATE_NIGHT: new Date(`${DATES.wednesday}T23:30:00`),
} as const;

export type TestTimeKey = keyof typeof TEST_TIMES;

// ---------------------------------------------------------------------------
// TEST_TIME_STRINGS — ISO strings for E2E tests with Playwright
// ---------------------------------------------------------------------------

export const TEST_TIME_STRINGS = {
  WEEKDAY_MORNING: `${DATES.tuesday}T07:30:00`,
  WEEKDAY_MIDDAY: `${DATES.tuesday}T12:00:00`,
  WEEKDAY_EVENING: `${DATES.tuesday}T17:30:00`,
  WEEKDAY_LATE_NIGHT: `${DATES.tuesday}T23:30:00`,
  SATURDAY_AFTERNOON: `${DATES.saturday}T14:00:00`,
  SUNDAY_MORNING: `${DATES.sunday}T09:00:00`,
  JUST_BEFORE_MIDNIGHT: `${DATES.tuesday}T23:59:00`,
  JUST_AFTER_MIDNIGHT: `${DATES.wednesday}T00:01:00`,
  TRAIN_IMMINENT: `${DATES.tuesday}T08:04:00`,
  TRAIN_SOON: `${DATES.tuesday}T08:02:00`,
  TRAIN_COMFORTABLE: `${DATES.tuesday}T07:55:00`,
  TRAIN_DEPARTING: `${DATES.tuesday}T06:15:00`,
  TRAIN_JUST_DEPARTED: `${DATES.tuesday}T06:15:15`,
  // Urgency states for visual regression (relative to 6:15 AM Everett train)
  TRAIN_DANGER: `${DATES.tuesday}T06:14:00`,
  TRAIN_WARNING: `${DATES.tuesday}T06:12:00`,
  TRAIN_NORMAL: `${DATES.tuesday}T05:45:00`,
  // Smart future train test times
  FRIDAY_LATE_NIGHT: `${DATES.friday}T23:30:00`,
  THURSDAY_LATE_NIGHT: `${DATES.thursday}T23:30:00`,
  WEDNESDAY_LATE_NIGHT: `${DATES.wednesday}T23:30:00`,
  // Amtrak-specific (uses Sounder+Amtrak overlap date)
  AMTRAK_MORNING: `${DATES.amtrakWeekday}T07:30:00`,
  AMTRAK_EVENING: `${DATES.amtrakWeekday}T17:00:00`,
  // Afternoon for alert tests (train 1700 departs King Street at 4:05pm)
  WEEKDAY_AFTERNOON: `${DATES.tuesday}T16:00:00`,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Helper to get minutes since midnight for a given test time.
 */
export function getMinutesSinceMidnight(time: Date): number {
  return time.getHours() * 60 + time.getMinutes();
}

/**
 * Playwright helper: generates the script to inject for mocking Date in browser.
 * Use with page.addInitScript() in E2E tests.
 */
export function getPlaywrightDateMockScript(isoTime: string): string {
  return `
    const MOCK_TIME = new Date('${isoTime}').getTime();
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
  `;
}

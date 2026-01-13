/**
 * Predefined test time scenarios for deterministic testing.
 *
 * IMPORTANT: All tests that depend on the current time MUST use these fixtures
 * with vi.useFakeTimers() and vi.setSystemTime() to ensure reproducible results.
 *
 * See TESTING.md for complete usage guidelines.
 */

export const TEST_TIMES = {
  /**
   * Weekday morning - typical commute time
   * Tuesday, January 6, 2026 at 7:30 AM
   * (Falls within schedule data range: 20260102 - 20260116)
   *
   * Expected behavior:
   * - N-Line: Northbound trains available (Seattle -> Everett)
   * - S-Line: Northbound trains available (Tacoma -> Seattle)
   * - isWeekday() returns true
   */
  WEEKDAY_MORNING: new Date('2026-01-06T07:30:00'),

  /**
   * Weekday midday - between commute periods
   * Tuesday, January 6, 2026 at 12:00 PM
   *
   * Expected behavior:
   * - Fewer trains available
   * - Some directions may show "Tomorrow"
   */
  WEEKDAY_MIDDAY: new Date('2026-01-06T12:00:00'),

  /**
   * Weekday evening - typical commute time
   * Tuesday, January 6, 2026 at 5:30 PM
   *
   * Expected behavior:
   * - N-Line: Southbound trains available (Everett -> Seattle)
   * - S-Line: Southbound trains available (Seattle -> Tacoma)
   */
  WEEKDAY_EVENING: new Date('2026-01-06T17:30:00'),

  /**
   * Late night - all trains have passed for the day
   * Tuesday, January 6, 2026 at 11:30 PM
   *
   * Expected behavior:
   * - All directions show "Tomorrow"
   */
  WEEKDAY_LATE_NIGHT: new Date('2026-01-06T23:30:00'),

  /**
   * Saturday afternoon - no Sounder service
   * Saturday, January 10, 2026 at 2:00 PM
   *
   * Expected behavior:
   * - isWeekday() returns false
   * - UI shows "No service today" message
   */
  SATURDAY_AFTERNOON: new Date('2026-01-10T14:00:00'),

  /**
   * Sunday morning - no Sounder service
   * Sunday, January 11, 2026 at 9:00 AM
   *
   * Expected behavior:
   * - isWeekday() returns false
   * - UI shows "No service today" message
   */
  SUNDAY_MORNING: new Date('2026-01-11T09:00:00'),

  /**
   * Edge case: just before midnight
   * Tuesday, January 6, 2026 at 11:59 PM
   */
  JUST_BEFORE_MIDNIGHT: new Date('2026-01-06T23:59:00'),

  /**
   * Edge case: just after midnight
   * Wednesday, January 7, 2026 at 12:01 AM
   */
  JUST_AFTER_MIDNIGHT: new Date('2026-01-07T00:01:00'),

  /**
   * Urgency test: train is 1 minute away (DANGER state)
   * Assumes a train departs at 8:05 AM
   * Tuesday, January 6, 2026 at 8:04 AM
   */
  TRAIN_IMMINENT: new Date('2026-01-06T08:04:00'),

  /**
   * Urgency test: train is 3 minutes away (WARNING state)
   * Assumes a train departs at 8:05 AM
   * Tuesday, January 6, 2026 at 8:02 AM
   */
  TRAIN_SOON: new Date('2026-01-06T08:02:00'),

  /**
   * Urgency test: train is 10 minutes away (NORMAL state)
   * Assumes a train departs at 8:05 AM
   * Tuesday, January 6, 2026 at 7:55 AM
   */
  TRAIN_COMFORTABLE: new Date('2026-01-06T07:55:00'),

  /**
   * Departing state test: train is at exact departure time
   * N-Line southbound from Everett departs at 06:15 AM
   * Tuesday, January 6, 2026 at 6:15 AM
   */
  TRAIN_DEPARTING: new Date('2026-01-06T06:15:00'),

  /**
   * Departing state test: 15 seconds after scheduled departure
   * Still within 30-second departing window
   * Tuesday, January 6, 2026 at 6:15:15 AM
   */
  TRAIN_JUST_DEPARTED: new Date('2026-01-06T06:15:15'),
} as const;

export type TestTimeKey = keyof typeof TEST_TIMES;

/**
 * Helper to get minutes since midnight for a given test time.
 * Useful for calculating expected values in tests.
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

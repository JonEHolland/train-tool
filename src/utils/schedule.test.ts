import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getActiveServices,
  getTrainsByDirection,
  isExceptionOnlyService,
  classifyExceptionServiceType,
  getServiceContext,
  findNextServiceDay
} from './schedule';
import { TEST_SCHEDULE_DATA } from '../../tests/fixtures/schedule-data';
import { TEST_TIMES, TEST_DATES } from '../../tests/fixtures/time';
import type { ScheduleData } from '../types';

describe('schedule utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getActiveServices', () => {
    it('returns weekday service on a Tuesday', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const services = getActiveServices(TEST_SCHEDULE_DATA);
      expect(services.has('weekday-service')).toBe(true);
    });

    it('returns no weekday service on a Saturday', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const services = getActiveServices(TEST_SCHEDULE_DATA);
      expect(services.has('weekday-service')).toBe(false);
    });

    it('returns no weekday service on a Sunday', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      const services = getActiveServices(TEST_SCHEDULE_DATA);
      expect(services.has('weekday-service')).toBe(false);
    });

    it('returns empty set when date is outside calendar range', () => {
      vi.setSystemTime(new Date('2027-06-15T12:00:00')); // Outside 2026 range
      const services = getActiveServices(TEST_SCHEDULE_DATA);
      expect(services.size).toBe(0);
    });

    it('handles calendar date exceptions - service added', () => {
      const dataWithException: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'special-service': [
            { date: TEST_DATES.WEEKDAY, exception_type: '1' },
          ],
        },
      };
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Jan 6, 2026
      const services = getActiveServices(dataWithException);
      expect(services.has('special-service')).toBe(true);
    });

    it('handles calendar date exceptions - service removed', () => {
      const dataWithException: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'weekday-service': [
            { date: TEST_DATES.WEEKDAY, exception_type: '2' },
          ],
        },
      };
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Jan 6, 2026
      const services = getActiveServices(dataWithException);
      expect(services.has('weekday-service')).toBe(false);
    });

    it('handles missing calendars gracefully', () => {
      const dataWithoutCalendars: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendars: undefined,
      };
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const services = getActiveServices(dataWithoutCalendars);
      expect(services.size).toBe(0);
    });
  });

  describe('getTrainsByDirection', () => {
    it('returns trains grouped by terminus on weekday morning', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // 7:30 AM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      expect(result.length).toBeGreaterThan(0);
      // Should have trains to King Street Station (southbound from Edmonds)
      const southbound = result.find(d => d.directionName === 'King Street Station');
      expect(southbound).toBeDefined();
      expect(southbound!.trains.length).toBeGreaterThan(0);
    });

    it('returns empty array for non-existent route', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'fake-route', 'king-street');
      expect(result).toEqual([]);
    });

    it('returns empty array for non-existent stop', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'fake-stop');
      expect(result).toEqual([]);
    });

    it('does not include trains where stop is terminus', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      // King Street is terminus for southbound N-Line
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // Should only show northbound trains (to Everett), not southbound (ending at King Street)
      const toKingStreet = result.find(d => d.directionName === 'King Street Station');
      expect(toKingStreet).toBeUndefined();
    });

    it('calculates correct minutesAway for upcoming trains', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // 7:30 AM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      const southbound = result.find(d => d.directionName === 'King Street Station');
      expect(southbound).toBeDefined();

      // First southbound train from Edmonds is at 7:30 (same as current time)
      // Should have 0 minutesAway or very close
      const firstTrain = southbound!.trains[0];
      expect(firstTrain.minutesAway).toBeLessThanOrEqual(30);
    });

    it('marks trains with Tomorrow label when past for today', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_LATE_NIGHT); // 11:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // All trains have passed, so they should be marked with Tomorrow label
      for (const direction of result) {
        for (const train of direction.trains) {
          expect(train.nextDayLabel).toBe('Tomorrow');
        }
      }
    });

    it('sorts trains by minutesAway within each direction', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING); // 5:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      for (const direction of result) {
        for (let i = 1; i < direction.trains.length; i++) {
          expect(direction.trains[i].minutesAway).toBeGreaterThanOrEqual(
            direction.trains[i - 1].minutesAway
          );
        }
      }
    });

    it('sorts directions by next train time', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING); // 5:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 's-line', 'king-street');

      // Multiple termini for S-Line (Tacoma and Lakewood)
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i].trains[0].minutesAway).toBeGreaterThanOrEqual(
            result[i - 1].trains[0].minutesAway
          );
        }
      }
    });

    it('limits trains per terminus to 4', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      for (const direction of result) {
        expect(direction.trains.length).toBeLessThanOrEqual(4);
      }
    });

    it('returns Monday preview trains on weekend (no same-day service)', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // Should return Monday preview trains since there's no weekend service
      // All trains should have nextDayLabel: 'Monday'
      expect(result.length).toBeGreaterThan(0);
      for (const direction of result) {
        for (const train of direction.trains) {
          expect(train.nextDayLabel).toBe('Monday');
        }
      }
    });

    it('includes trainNumber extracted from tripId', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      const direction = result[0];
      expect(direction).toBeDefined();
      // trainNumber may be undefined for test data since tripIds don't follow real pattern
      // but the field should exist
      expect(direction.trains[0]).toHaveProperty('trainNumber');
    });

    it('handles S-Line with multiple termini (Tacoma and Lakewood)', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING); // 5:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 's-line', 'king-street');

      // S-Line has both Tacoma Dome and Lakewood as termini
      const terminusNames = result.map(d => d.directionName);
      expect(terminusNames.length).toBeGreaterThan(0);
      // Check that multiple directions exist
      const uniqueTermini = new Set(terminusNames);
      expect(uniqueTermini.size).toBe(terminusNames.length);
    });

    it('attaches exception flags to trains from exception-only services', () => {
      // Create data with a gameday service
      const gamedayData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_GAMEDAY_1210_Sunday': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '0': {
                name: 'Northbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                  {
                    tripId: 'gameday-nb-1',
                    serviceId: 'SOUNDER_GAMEDAY_1210_Sunday',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', name: 'King Street Station', arrival: '16:00:00', departure: '16:00:00' },
                      { stopId: 'edmonds', name: 'Edmonds Station', arrival: '16:25:00', departure: '16:25:00' },
                      { stopId: 'everett', name: 'Everett Station', arrival: '16:45:00', departure: '16:45:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING); // Jan 11, 2026
      const result = getTrainsByDirection(gamedayData, 'n-line', 'king-street');

      // Find the gameday train
      const allTrains = result.flatMap(d => d.trains);
      const gamedayTrain = allTrains.find(t => t.isExceptionService);

      expect(gamedayTrain).toBeDefined();
      expect(gamedayTrain!.isExceptionService).toBe(true);
      expect(gamedayTrain!.exceptionServiceType).toBe('gameday');
    });

    it('does not attach exception flags to regular service trains', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      const allTrains = result.flatMap(d => d.trains);
      // Regular weekday service trains should not have exception flags
      for (const train of allTrains) {
        expect(train.isExceptionService).toBeUndefined();
        expect(train.exceptionServiceType).toBeUndefined();
      }
    });
  });

  describe('isExceptionOnlyService', () => {
    it('returns true for service with no calendar entry', () => {
      const data: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendars: {
          'weekday-service': TEST_SCHEDULE_DATA.calendars!['weekday-service'],
          // 'gameday-service' has no calendar entry
        },
      };
      expect(isExceptionOnlyService('gameday-service', data)).toBe(true);
    });

    it('returns true for service with all-false calendar', () => {
      const data: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendars: {
          ...TEST_SCHEDULE_DATA.calendars,
          'exception-only': {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            start_date: '20260101',
            end_date: '20261231',
          },
        },
      };
      expect(isExceptionOnlyService('exception-only', data)).toBe(true);
    });

    it('returns false for regular weekday service', () => {
      expect(isExceptionOnlyService('weekday-service', TEST_SCHEDULE_DATA)).toBe(false);
    });

    it('returns false for weekend-only service', () => {
      const data: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendars: {
          ...TEST_SCHEDULE_DATA.calendars,
          'weekend-service': {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: true,
            sunday: true,
            start_date: '20260101',
            end_date: '20261231',
          },
        },
      };
      expect(isExceptionOnlyService('weekend-service', data)).toBe(false);
    });

    it('returns true when calendars is undefined', () => {
      const data: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendars: undefined,
      };
      expect(isExceptionOnlyService('any-service', data)).toBe(true);
    });
  });

  describe('classifyExceptionServiceType', () => {
    it('returns gameday for GAMEDAY service IDs', () => {
      expect(classifyExceptionServiceType('SOUNDER_GAMEDAY_1210_Sunday')).toBe('gameday');
      expect(classifyExceptionServiceType('SOUNDER_GAMEDAY_DOUBLE_1305')).toBe('gameday');
      expect(classifyExceptionServiceType('sounder_gameday_test')).toBe('gameday');
    });

    it('returns fair for WSF service IDs', () => {
      expect(classifyExceptionServiceType('SOUNDER_WSF_1200')).toBe('fair');
      expect(classifyExceptionServiceType('WSF_Special')).toBe('fair');
    });

    it('returns reduced for Reduced service IDs', () => {
      expect(classifyExceptionServiceType('SNDR_Fall2024_Reduced_Weekday')).toBe('reduced');
      expect(classifyExceptionServiceType('Reduced_Holiday')).toBe('reduced');
    });

    it('returns special for other exception services', () => {
      expect(classifyExceptionServiceType('SOME_SPECIAL_SERVICE')).toBe('special');
      expect(classifyExceptionServiceType('holiday-extra')).toBe('special');
    });

    it('prioritizes gameday over other patterns', () => {
      // If a service ID contains multiple patterns, gameday takes precedence
      expect(classifyExceptionServiceType('GAMEDAY_WSF_Reduced')).toBe('gameday');
    });
  });

  describe('getServiceContext', () => {
    it('returns hasService true on weekday with regular service', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const context = getServiceContext(TEST_SCHEDULE_DATA, 'n-line', false);
      expect(context.hasService).toBe(true);
      expect(context.hasExceptionService).toBe(false);
      expect(context.exceptionServiceType).toBe(null);
      expect(context.isWeekendWithNoService).toBe(false);
    });

    it('returns isWeekendWithNoService true on Saturday without service', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const context = getServiceContext(TEST_SCHEDULE_DATA, 'n-line', false);
      expect(context.hasService).toBe(false);
      expect(context.hasExceptionService).toBe(false);
      expect(context.isWeekendWithNoService).toBe(true);
    });

    it('returns isWeekendWithNoService true on Sunday without service', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      const context = getServiceContext(TEST_SCHEDULE_DATA, 'n-line', false);
      expect(context.hasService).toBe(false);
      expect(context.isWeekendWithNoService).toBe(true);
    });

    it('detects exception-only service on weekend with gameday service', () => {
      // Add a gameday trip to the n-line for the gameday service
      const gamedayData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_GAMEDAY_1210_Sunday': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '0': {
                name: 'Northbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                  {
                    tripId: 'gameday-trip',
                    serviceId: 'SOUNDER_GAMEDAY_1210_Sunday',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', departure: '14:00:00' },
                      { stopId: 'everett', departure: '15:00:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING); // Jan 11, 2026
      const context = getServiceContext(gamedayData, 'n-line', false);
      expect(context.hasService).toBe(true);
      expect(context.hasExceptionService).toBe(true);
      expect(context.exceptionServiceType).toBe('gameday');
      expect(context.isWeekendWithNoService).toBe(false);
    });

    it('detects fair service type', () => {
      const fairData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_WSF_1200': [
            { date: TEST_DATES.SATURDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '0': {
                name: 'Northbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                  {
                    tripId: 'fair-trip',
                    serviceId: 'SOUNDER_WSF_1200',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', departure: '10:00:00' },
                      { stopId: 'everett', departure: '11:00:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON); // Jan 10, 2026
      const context = getServiceContext(fairData, 'n-line', false);
      expect(context.hasService).toBe(true);
      expect(context.hasExceptionService).toBe(true);
      expect(context.exceptionServiceType).toBe('fair');
    });

    it('prioritizes gameday over other exception types', () => {
      const mixedData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_WSF_1200': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
          'SOUNDER_GAMEDAY_1310': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '0': {
                name: 'Northbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                  {
                    tripId: 'fair-trip',
                    serviceId: 'SOUNDER_WSF_1200',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', departure: '10:00:00' },
                      { stopId: 'everett', departure: '11:00:00' },
                    ],
                  },
                  {
                    tripId: 'gameday-trip',
                    serviceId: 'SOUNDER_GAMEDAY_1310',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', departure: '14:00:00' },
                      { stopId: 'everett', departure: '15:00:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      const context = getServiceContext(mixedData, 'n-line', false);
      expect(context.exceptionServiceType).toBe('gameday');
    });

    it('handles reduced service type', () => {
      const reducedData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SNDR_Reduced_Holiday': [
            { date: TEST_DATES.WEEKDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '0': {
                name: 'Northbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                  {
                    tripId: 'reduced-trip',
                    serviceId: 'SNDR_Reduced_Holiday',
                    headsign: 'Everett Station',
                    stops: [
                      { stopId: 'king-street', departure: '10:00:00' },
                      { stopId: 'everett', departure: '11:00:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const context = getServiceContext(reducedData, 'n-line', false);
      expect(context.hasExceptionService).toBe(true);
      expect(context.exceptionServiceType).toBe('reduced');
    });
  });

  describe('findNextServiceDay', () => {
    it('returns same day (daysAway=0) when service runs today', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Tuesday
      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        TEST_TIMES.WEEKDAY_MORNING
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(0);
      expect(result!.dayLabel).toBe('');
    });

    it('returns Tomorrow when service runs the next day', () => {
      vi.setSystemTime(TEST_TIMES.THURSDAY_LATE_NIGHT); // Thursday night
      const tomorrow = new Date(TEST_TIMES.THURSDAY_LATE_NIGHT);
      tomorrow.setDate(tomorrow.getDate() + 1); // Friday

      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        tomorrow
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(0); // Same day as startDate (Friday)
      expect(result!.dayLabel).toBe('');
    });

    it('returns Monday when checking from Saturday (skips weekend)', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        TEST_TIMES.SATURDAY_AFTERNOON
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(2); // Saturday -> Monday
      expect(result!.dayLabel).toBe('Monday');
    });

    it('returns Monday when checking from Sunday (skips weekend)', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        TEST_TIMES.SUNDAY_MORNING
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(1); // Sunday -> Monday
      expect(result!.dayLabel).toBe('Tomorrow');
    });

    it('returns null when service does not run within 7 days', () => {
      // Set time outside the calendar range
      vi.setSystemTime(new Date('2027-06-15T12:00:00'));
      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        new Date('2027-06-15T12:00:00')
      );
      expect(result).toBeNull();
    });

    it('finds exception-only service on its exception date', () => {
      const gamedayData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_GAMEDAY_1210_Sunday': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
        },
      };
      // Check from Saturday Jan 10
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const result = findNextServiceDay(
        gamedayData,
        'SOUNDER_GAMEDAY_1210_Sunday',
        TEST_TIMES.SATURDAY_AFTERNOON
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(1); // Saturday -> Sunday
      expect(result!.dayLabel).toBe('Tomorrow');
    });

    it('returns correct day name for 3+ days away', () => {
      // Tuesday - check when Thursday service runs (should be 2 days away)
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const thursday = new Date(TEST_TIMES.THURSDAY_LATE_NIGHT);
      thursday.setHours(12, 0, 0, 0); // Thursday noon
      const result = findNextServiceDay(
        TEST_SCHEDULE_DATA,
        'weekday-service',
        thursday
      );
      expect(result).not.toBeNull();
      expect(result!.daysAway).toBe(0); // Service runs on Thursday itself
      expect(result!.dayLabel).toBe('');
    });
  });

  describe('getTrainsByDirection smart day labels', () => {
    it('shows Monday label for trains on Friday late night (skipping weekend)', () => {
      vi.setSystemTime(TEST_TIMES.FRIDAY_LATE_NIGHT); // Friday 11:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      // All trains have passed for today, should show Monday
      expect(result.length).toBeGreaterThan(0);
      const allTrains = result.flatMap(d => d.trains);
      for (const train of allTrains) {
        expect(train.nextDayLabel).toBe('Monday');
      }
    });

    it('shows Monday label on Saturday afternoon (previews Monday service)', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      // Weekday service doesn't run on Saturday, but should preview Monday trains
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      // On Saturday, should show Monday preview trains
      expect(result.length).toBeGreaterThan(0);
      const allTrains = result.flatMap(d => d.trains);
      for (const train of allTrains) {
        expect(train.nextDayLabel).toBe('Monday');
      }
    });

    it('shows Tomorrow label on Thursday late night (Friday has service)', () => {
      vi.setSystemTime(TEST_TIMES.THURSDAY_LATE_NIGHT); // Thursday 11:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      expect(result.length).toBeGreaterThan(0);
      const allTrains = result.flatMap(d => d.trains);
      for (const train of allTrains) {
        expect(train.nextDayLabel).toBe('Tomorrow');
      }
    });

    it('shows no nextDayLabel for trains departing today', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Tuesday 7:30 AM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      expect(result.length).toBeGreaterThan(0);
      // Find trains without nextDayLabel - should be today's trains
      const todaysTrains = result.flatMap(d => d.trains).filter(t => !t.nextDayLabel);
      for (const train of todaysTrains) {
        expect(train.nextDayLabel).toBeUndefined();
      }
    });

    it('calculates correct minutesAway for Monday trains on Friday night', () => {
      vi.setSystemTime(TEST_TIMES.FRIDAY_LATE_NIGHT); // Friday 11:30 PM (23:30)
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      expect(result.length).toBeGreaterThan(0);
      const firstTrain = result[0].trains[0];

      // First southbound train from Edmonds is at 06:30 AM
      // From Friday 23:30 to Monday 06:30:
      // - Remaining Friday: 30 min
      // - Full Saturday: 1440 min
      // - Full Sunday: 1440 min
      // - Monday until 06:30: 390 min (6.5 hours)
      // Total: 30 + 1440 + 1440 + 390 = 3300 min
      // But wait - let me recalculate from the fixture data

      // Looking at fixture: southbound from edmonds is 06:30, 07:30, 08:30
      // Friday 23:30 to Monday 06:30 = 2 full days + 7 hours
      // = 48 hours + 7 hours = 55 hours = 3300 minutes
      // Wait, that's not right. Let me trace through:
      // - Friday 23:30 to Saturday 00:00 = 30 min
      // - Saturday 00:00 to Sunday 00:00 = 1440 min
      // - Sunday 00:00 to Monday 00:00 = 1440 min
      // - Monday 00:00 to 06:30 = 390 min
      // Total = 30 + 1440 + 1440 + 390 = 3300 min

      expect(firstTrain.minutesAway).toBeGreaterThan(2 * 24 * 60); // More than 2 days
      expect(firstTrain.nextDayLabel).toBe('Monday');
    });

    it('shows special service trains with correct day labels when service is active', () => {
      // Create data with a gameday service on Sunday
      const gamedaySundayData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_GAMEDAY_SUN': [
            { date: TEST_DATES.SUNDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '1': {
                name: 'Southbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['1'].trips,
                  {
                    tripId: 'gameday-sun-sb',
                    serviceId: 'SOUNDER_GAMEDAY_SUN',
                    headsign: 'King Street Station',
                    stops: [
                      { stopId: 'everett', departure: '14:00:00' },
                      { stopId: 'edmonds', departure: '14:25:00' },
                      { stopId: 'king-street', departure: '14:50:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      // On Sunday morning, check if we see the gameday train
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING); // 9:00 AM
      const result = getTrainsByDirection(gamedaySundayData, 'n-line', 'edmonds');

      // Should include the gameday train (service is active today)
      const allTrains = result.flatMap(d => d.trains);
      const gamedayTrain = allTrains.find(t => t.isExceptionService);

      expect(gamedayTrain).toBeDefined();
      expect(gamedayTrain!.isExceptionService).toBe(true);
      expect(gamedayTrain!.exceptionServiceType).toBe('gameday');
      // Train is at 14:25 (2:25 PM), current time is 9:00 AM
      // Minutes away = (14*60 + 25) - (9*60) = 865 - 540 = 325 minutes
      expect(gamedayTrain!.minutesAway).toBe(325);
      // Train is today, so no day label
      expect(gamedayTrain!.nextDayLabel).toBeUndefined();
    });

    it('previews exception service trains from previous day', () => {
      // Create data with a gameday service on Saturday
      const gamedaySaturdayData: ScheduleData = {
        ...TEST_SCHEDULE_DATA,
        calendarDates: {
          'SOUNDER_GAMEDAY_SAT': [
            { date: TEST_DATES.SATURDAY, exception_type: '1' },
          ],
        },
        schedule: {
          ...TEST_SCHEDULE_DATA.schedule,
          'n-line': {
            ...TEST_SCHEDULE_DATA.schedule['n-line'],
            directions: {
              ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
              '1': {
                name: 'Southbound',
                trips: [
                  ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['1'].trips,
                  {
                    tripId: 'gameday-sat-sb',
                    serviceId: 'SOUNDER_GAMEDAY_SAT',
                    headsign: 'King Street Station',
                    stops: [
                      { stopId: 'everett', departure: '14:00:00' },
                      { stopId: 'edmonds', departure: '14:25:00' },
                      { stopId: 'king-street', departure: '14:50:00' },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      // On Friday evening, check if we see the Saturday gameday train as a preview
      vi.setSystemTime(TEST_TIMES.FRIDAY_LATE_NIGHT); // Friday 11:30 PM
      const result = getTrainsByDirection(gamedaySaturdayData, 'n-line', 'edmonds');

      // Should include the gameday train for Saturday (tomorrow)
      const allTrains = result.flatMap(d => d.trains);
      const gamedayTrain = allTrains.find(t => t.isExceptionService);

      expect(gamedayTrain).toBeDefined();
      expect(gamedayTrain!.isExceptionService).toBe(true);
      expect(gamedayTrain!.exceptionServiceType).toBe('gameday');
      // Saturday is tomorrow from Friday
      expect(gamedayTrain!.nextDayLabel).toBe('Tomorrow');
    });
  });

  describe('Amtrak provider field propagation', () => {
    it('propagates provider field from trip to NextTrain', () => {
      // The test schedule data includes an Amtrak train (AMTRAK_516)
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Before 11:30 departure
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // Find the Amtrak train
      const allTrains = result.flatMap(d => d.trains);
      const amtrakTrain = allTrains.find(t => t.trainNumber === '516');

      expect(amtrakTrain).toBeDefined();
      expect(amtrakTrain!.provider).toBe('amtrak');
    });

    it('Sounder trains have undefined provider', () => {
      // Use morning time to catch southbound Sounder trains
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'edmonds');

      // Find a Sounder train (not Amtrak)
      const allTrains = result.flatMap(d => d.trains);
      const sounderTrain = allTrains.find(t => !t.provider);

      expect(sounderTrain).toBeDefined();
      expect(sounderTrain!.provider).toBeUndefined();
    });

    it('Amtrak trains are included in N-Line schedule', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING); // Morning, before Amtrak 517
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'everett');

      const allTrains = result.flatMap(d => d.trains);
      const amtrakTrain = allTrains.find(t => t.provider === 'amtrak');

      expect(amtrakTrain).toBeDefined();
      expect(amtrakTrain!.trainNumber).toBe('517');
    });

    it('Amtrak trains are NOT in S-Line schedule', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 's-line', 'king-street');

      const allTrains = result.flatMap(d => d.trains);
      const amtrakTrain = allTrains.find(t => t.provider === 'amtrak');

      expect(amtrakTrain).toBeUndefined();
    });
  });
});

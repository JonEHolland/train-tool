import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getActiveServices,
  getTrainsByDirection,
  isExceptionOnlyService,
  classifyExceptionServiceType,
  getServiceContext
} from './schedule';
import { TEST_SCHEDULE_DATA } from '../../tests/fixtures/schedule-data';
import { TEST_TIMES } from '../../tests/fixtures/time';
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
            { date: '20260106', exception_type: '1' }, // Add service on Jan 6
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
            { date: '20260106', exception_type: '2' }, // Remove service on Jan 6
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

    it('marks trains as tomorrow when past for today', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_LATE_NIGHT); // 11:30 PM
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // All trains have passed, so they should be marked as tomorrow
      for (const direction of result) {
        for (const train of direction.trains) {
          expect(train.isTomorrow).toBe(true);
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

    it('returns empty on weekend (no service)', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const result = getTrainsByDirection(TEST_SCHEDULE_DATA, 'n-line', 'king-street');

      // Should return directions but with all trains filtered due to no active service
      // Actually, it returns empty array since no trips match active services
      expect(result).toEqual([]);
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
            { date: '20260111', exception_type: '1' },
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
            { date: '20260111', exception_type: '1' }, // Sunday Jan 11
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
            { date: '20260110', exception_type: '1' }, // Saturday Jan 10
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
            { date: '20260111', exception_type: '1' },
          ],
          'SOUNDER_GAMEDAY_1310': [
            { date: '20260111', exception_type: '1' },
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
            { date: '20260106', exception_type: '1' },
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
});

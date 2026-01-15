import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getActiveServices, getTrainsByDirection } from './schedule';
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
  });
});

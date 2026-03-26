import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEST_TIMES, getMinutesSinceMidnight } from '../../tests/fixtures/time';
import {
  parseTime,
  timeToMinutes,
  formatTime,
  getCurrentMinutes,
  isWeekday,
  formatCountdown,
  formatCountdownCompact,
} from './time';

describe('time utilities', () => {
  describe('parseTime', () => {
    it.each([
      ['14:30:00', { hours: 14, minutes: 30, seconds: 0 }],
      ['08:05:00', { hours: 8, minutes: 5, seconds: 0 }],
      ['00:00:00', { hours: 0, minutes: 0, seconds: 0 }],
      ['25:30:00', { hours: 25, minutes: 30, seconds: 0 }],
      ['14:30', { hours: 14, minutes: 30, seconds: 0 }],
    ])('parses %s correctly', (input, expected) => {
      expect(parseTime(input)).toEqual(expected);
    });

    it.each([
      ['', 'Invalid time format'],
      ['invalid', 'Invalid time format'],
      ['1430', 'Invalid time format'],
      ['14', 'Invalid time format'],
      ['14:30:00:00', 'expected 2-3 parts'],
      ['ab:30:00', 'non-numeric values'],
      ['14:cd:00', 'non-numeric values'],
    ])('throws on invalid input %s', (input, expectedError) => {
      expect(() => parseTime(input)).toThrow(expectedError);
    });
  });

  describe('timeToMinutes', () => {
    it.each([
      ['00:00:00', 0],
      ['01:00:00', 60],
      ['14:30:00', 870],
      ['23:59:00', 1439],
      ['25:30:00', 1530],
    ])('converts %s to %d minutes', (input, expected) => {
      expect(timeToMinutes(input)).toBe(expected);
    });
  });

  describe('formatTime', () => {
    it.each([
      ['00:00:00', '12:00 AM'],
      ['12:00:00', '12:00 PM'],
      ['08:30:00', '8:30 AM'],
      ['14:30:00', '2:30 PM'],
      ['23:59:00', '11:59 PM'],
      ['25:30:00', '1:30 AM'],
      ['08:05:00', '8:05 AM'],
    ])('formats %s as %s', (input, expected) => {
      expect(formatTime(input)).toBe(expected);
    });
  });

  describe('getCurrentMinutes', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it.each([
      ['WEEKDAY_MORNING', 450],
      ['WEEKDAY_EVENING', 1050],
      ['JUST_BEFORE_MIDNIGHT', 1439],
      ['JUST_AFTER_MIDNIGHT', 1],
    ] as const)('returns correct minutes for %s', (key, expected) => {
      vi.setSystemTime(TEST_TIMES[key]);
      expect(getCurrentMinutes()).toBe(expected);
    });
  });

  describe('isWeekday', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it.each([
      ['WEEKDAY_MORNING', true],
      ['SATURDAY_AFTERNOON', false],
      ['SUNDAY_MORNING', false],
    ] as const)('returns %s for %s', (key, expected) => {
      vi.setSystemTime(TEST_TIMES[key]);
      expect(isWeekday()).toBe(expected);
    });
  });

  describe('formatCountdown', () => {
    it.each([
      [0, undefined, 'Departing now'],
      [0.5, undefined, 'Departing now'],
      [1, undefined, 'in 1 min'],
      [15, undefined, 'in 15 min'],
      [59, undefined, 'in 59 min'],
      [60, undefined, 'in 1h 0 min'],
      [90, undefined, 'in 1h 30 min'],
      [14.4, undefined, 'in 14 min'],
      [14.6, undefined, 'in 15 min'],
      [5, true, 'Departing'],
      [0, false, 'Departing now'],
    ])('formatCountdown(%d, %s) = %s', (minutes, isDeparting, expected) => {
      expect(formatCountdown(minutes, isDeparting)).toBe(expected);
    });
  });

  describe('formatCountdownCompact', () => {
    it.each([
      [0, undefined, 'Now'],
      [5, undefined, '5m'],
      [60, undefined, '1h 0m'],
      [90, undefined, '1h 30m'],
      [14.4, undefined, '14m'],
      [14.6, undefined, '15m'],
      [5, true, 'Departing'],
      [0, false, 'Now'],
    ])('formatCountdownCompact(%d, %s) = %s', (minutes, isDeparting, expected) => {
      expect(formatCountdownCompact(minutes, isDeparting)).toBe(expected);
    });
  });
});

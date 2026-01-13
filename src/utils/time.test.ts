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
    it('parses standard HH:MM:SS format', () => {
      expect(parseTime('14:30:00')).toEqual({
        hours: 14,
        minutes: 30,
        seconds: 0,
      });
    });

    it('parses morning times', () => {
      expect(parseTime('08:05:00')).toEqual({
        hours: 8,
        minutes: 5,
        seconds: 0,
      });
    });

    it('parses midnight', () => {
      expect(parseTime('00:00:00')).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it('handles times past midnight (GTFS uses 25:30:00 for 1:30 AM next day)', () => {
      expect(parseTime('25:30:00')).toEqual({
        hours: 25,
        minutes: 30,
        seconds: 0,
      });
    });

    it('handles times without seconds', () => {
      expect(parseTime('14:30')).toEqual({
        hours: 14,
        minutes: 30,
        seconds: 0,
      });
    });
  });

  describe('timeToMinutes', () => {
    it('converts midnight to 0', () => {
      expect(timeToMinutes('00:00:00')).toBe(0);
    });

    it('converts 1 AM to 60 minutes', () => {
      expect(timeToMinutes('01:00:00')).toBe(60);
    });

    it('converts 2:30 PM to 870 minutes', () => {
      expect(timeToMinutes('14:30:00')).toBe(870);
    });

    it('converts 11:59 PM to 1439 minutes', () => {
      expect(timeToMinutes('23:59:00')).toBe(1439);
    });

    it('handles GTFS times past midnight', () => {
      // 25:30:00 = 1:30 AM next day = 25*60 + 30 = 1530 minutes
      expect(timeToMinutes('25:30:00')).toBe(1530);
    });
  });

  describe('formatTime', () => {
    it('formats midnight as 12:00 AM', () => {
      expect(formatTime('00:00:00')).toBe('12:00 AM');
    });

    it('formats noon as 12:00 PM', () => {
      expect(formatTime('12:00:00')).toBe('12:00 PM');
    });

    it('formats morning times correctly', () => {
      expect(formatTime('08:30:00')).toBe('8:30 AM');
      expect(formatTime('09:05:00')).toBe('9:05 AM');
    });

    it('formats afternoon times correctly', () => {
      expect(formatTime('14:30:00')).toBe('2:30 PM');
      expect(formatTime('17:45:00')).toBe('5:45 PM');
    });

    it('formats 11:59 PM correctly', () => {
      expect(formatTime('23:59:00')).toBe('11:59 PM');
    });

    it('handles GTFS times past midnight by wrapping to next day', () => {
      // 25:30:00 should display as 1:30 AM (25 % 24 = 1)
      expect(formatTime('25:30:00')).toBe('1:30 AM');
    });

    it('pads minutes with leading zero', () => {
      expect(formatTime('08:05:00')).toBe('8:05 AM');
      expect(formatTime('14:00:00')).toBe('2:00 PM');
    });
  });

  describe('getCurrentMinutes (time-dependent)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns correct minutes for weekday morning (7:30 AM = 450)', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      expect(getCurrentMinutes()).toBe(getMinutesSinceMidnight(TEST_TIMES.WEEKDAY_MORNING));
      expect(getCurrentMinutes()).toBe(450); // 7*60 + 30
    });

    it('returns correct minutes for weekday evening (5:30 PM = 1050)', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);
      expect(getCurrentMinutes()).toBe(getMinutesSinceMidnight(TEST_TIMES.WEEKDAY_EVENING));
      expect(getCurrentMinutes()).toBe(1050); // 17*60 + 30
    });

    it('returns correct minutes for just before midnight (11:59 PM = 1439)', () => {
      vi.setSystemTime(TEST_TIMES.JUST_BEFORE_MIDNIGHT);
      expect(getCurrentMinutes()).toBe(1439); // 23*60 + 59
    });

    it('returns correct minutes for just after midnight (12:01 AM = 1)', () => {
      vi.setSystemTime(TEST_TIMES.JUST_AFTER_MIDNIGHT);
      expect(getCurrentMinutes()).toBe(1); // 0*60 + 1
    });
  });

  describe('isWeekday (time-dependent)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true on Tuesday (weekday morning)', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      expect(isWeekday()).toBe(true);
    });

    it('returns true on Tuesday evening', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);
      expect(isWeekday()).toBe(true);
    });

    it('returns false on Saturday', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      expect(isWeekday()).toBe(false);
    });

    it('returns false on Sunday', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      expect(isWeekday()).toBe(false);
    });

    it('returns true on Wednesday (day after midnight edge case)', () => {
      vi.setSystemTime(TEST_TIMES.JUST_AFTER_MIDNIGHT); // Wednesday 12:01 AM
      expect(isWeekday()).toBe(true);
    });
  });

  describe('formatCountdown', () => {
    it('shows "Departing now" for less than 1 minute', () => {
      expect(formatCountdown(0)).toBe('Departing now');
      expect(formatCountdown(0.5)).toBe('Departing now');
      expect(formatCountdown(0.9)).toBe('Departing now');
    });

    it('shows "in X min" for times under 60 minutes', () => {
      expect(formatCountdown(1)).toBe('in 1 min');
      expect(formatCountdown(5)).toBe('in 5 min');
      expect(formatCountdown(15)).toBe('in 15 min');
      expect(formatCountdown(45)).toBe('in 45 min');
      expect(formatCountdown(59)).toBe('in 59 min');
    });

    it('shows "in Xh Y min" for times 60 minutes or more', () => {
      expect(formatCountdown(60)).toBe('in 1h 0 min');
      expect(formatCountdown(90)).toBe('in 1h 30 min');
      expect(formatCountdown(120)).toBe('in 2h 0 min');
      expect(formatCountdown(150)).toBe('in 2h 30 min');
    });

    it('rounds minutes correctly', () => {
      expect(formatCountdown(14.4)).toBe('in 14 min');
      expect(formatCountdown(14.6)).toBe('in 15 min');
    });

    it('shows "Departing" when isDeparting is true', () => {
      expect(formatCountdown(0, true)).toBe('Departing');
      expect(formatCountdown(5, true)).toBe('Departing');
      expect(formatCountdown(60, true)).toBe('Departing');
    });

    it('shows normal format when isDeparting is false', () => {
      expect(formatCountdown(0, false)).toBe('Departing now');
      expect(formatCountdown(5, false)).toBe('in 5 min');
    });
  });

  describe('formatCountdownCompact', () => {
    it('shows "Now" for less than 1 minute', () => {
      expect(formatCountdownCompact(0)).toBe('Now');
      expect(formatCountdownCompact(0.5)).toBe('Now');
      expect(formatCountdownCompact(0.9)).toBe('Now');
    });

    it('shows "Xm" for times under 60 minutes (no "in" prefix)', () => {
      expect(formatCountdownCompact(1)).toBe('1m');
      expect(formatCountdownCompact(5)).toBe('5m');
      expect(formatCountdownCompact(15)).toBe('15m');
      expect(formatCountdownCompact(45)).toBe('45m');
    });

    it('shows "Xh Ym" for times 60 minutes or more (no "in" prefix)', () => {
      expect(formatCountdownCompact(60)).toBe('1h 0m');
      expect(formatCountdownCompact(90)).toBe('1h 30m');
      expect(formatCountdownCompact(150)).toBe('2h 30m');
    });

    it('rounds minutes correctly', () => {
      expect(formatCountdownCompact(14.4)).toBe('14m');
      expect(formatCountdownCompact(14.6)).toBe('15m');
    });

    it('shows "Departing" when isDeparting is true', () => {
      expect(formatCountdownCompact(0, true)).toBe('Departing');
      expect(formatCountdownCompact(5, true)).toBe('Departing');
      expect(formatCountdownCompact(60, true)).toBe('Departing');
    });

    it('shows normal format when isDeparting is false', () => {
      expect(formatCountdownCompact(0, false)).toBe('Now');
      expect(formatCountdownCompact(5, false)).toBe('5m');
    });
  });
});

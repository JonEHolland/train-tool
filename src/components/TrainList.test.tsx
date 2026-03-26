import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TEST_TIMES } from '../../tests/fixtures/time';
import { TrainList } from './TrainList';
import type { DirectionTrains, ServiceContext } from '../types';

const weekdayCtx: ServiceContext = {
  hasService: true, hasExceptionService: false, exceptionServiceType: null, isWeekendWithNoService: false,
};
const weekendCtx: ServiceContext = {
  hasService: false, hasExceptionService: false, exceptionServiceType: null, isWeekendWithNoService: true,
};
const noServiceCtx: ServiceContext = {
  hasService: false, hasExceptionService: false, exceptionServiceType: null, isWeekendWithNoService: false,
};

const singleDir: DirectionTrains[] = [{
  directionName: 'Everett Station',
  trains: [
    { destination: 'Everett Station', time: '08:05:00', minutesAway: 35 },
    { destination: 'Everett Station', time: '08:33:00', minutesAway: 63 },
    { destination: 'Everett Station', time: '09:15:00', minutesAway: 105 },
  ],
}];

const multiDir: DirectionTrains[] = [
  {
    directionName: 'Tacoma Dome Station',
    trains: [
      { destination: 'Tacoma Dome Station', time: '17:35:00', minutesAway: 5 },
      { destination: 'Tacoma Dome Station', time: '18:15:00', minutesAway: 45 },
    ],
  },
  {
    directionName: 'Lakewood Station',
    trains: [
      { destination: 'Lakewood Station', time: '17:55:00', minutesAway: 25 },
    ],
  },
];

describe('TrainList', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('empty states', () => {
    it('shows "Select a station" when hasStop is false', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      render(<TrainList trainsByDirection={[]} serviceContext={weekdayCtx} hasStop={false} currentRoute="n-line" />);
      expect(screen.getByText('Select a station')).toBeInTheDocument();
    });

    it('shows "No trains available" when no trains and has stop', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      render(<TrainList trainsByDirection={[]} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);
      expect(screen.getByText('No trains available')).toBeInTheDocument();
    });

    it('shows weekend message and "No service today" appropriately', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
      const { rerender } = render(<TrainList trainsByDirection={[]} serviceContext={weekendCtx} hasStop={true} currentRoute="n-line" />);
      expect(screen.getByText('No trains on weekends')).toBeInTheDocument();

      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      rerender(<TrainList trainsByDirection={[]} serviceContext={noServiceCtx} hasStop={true} currentRoute="n-line" />);
      expect(screen.getByText('No service today')).toBeInTheDocument();
    });
  });

  describe('train display', () => {
    it('shows destination, hero countdown, and departure times', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      render(<TrainList trainsByDirection={singleDir} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);

      expect(screen.getByText(/to Everett Station/)).toBeInTheDocument();
      expect(screen.getByText('35m')).toBeInTheDocument();
      expect(screen.getByText('8:05 AM')).toBeInTheDocument();
      expect(screen.getByText('8:33 AM')).toBeInTheDocument();
      expect(screen.getByText('Other Departures')).toBeInTheDocument();
    });

    it('shows tabs for multiple directions and switches on click', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);
      render(<TrainList trainsByDirection={multiDir} serviceContext={weekdayCtx} hasStop={true} currentRoute="s-line" />);

      expect(screen.getByRole('tab', { name: /Tacoma/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Lakewood/i })).toBeInTheDocument();
      expect(screen.getByText(/to Tacoma Dome Station/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /Lakewood/i }));
      expect(screen.getByText(/to Lakewood Station/)).toBeInTheDocument();
    });

    it('shows "Tomorrow" label for next-day trains', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_LATE_NIGHT);
      render(<TrainList trainsByDirection={[{
        directionName: 'King Street Station',
        trains: [{ destination: 'King Street Station', time: '05:15:00', minutesAway: 345, nextDayLabel: 'Tomorrow' }],
      }]} serviceContext={weekdayCtx} hasStop={true} currentRoute="s-line" />);
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('shows weekend preview trains instead of "No trains" message', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);
      render(<TrainList trainsByDirection={[{
        directionName: 'Everett Station',
        trains: [{ destination: 'Everett Station', time: '08:05:00', minutesAway: 935, nextDayLabel: 'Monday' }],
      }]} serviceContext={weekendCtx} hasStop={true} currentRoute="n-line" />);
      expect(screen.queryByText('No trains on weekends')).not.toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });
  });

  describe('departing state', () => {
    it('shows "Departing" text and class when train has departingAt', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const { container } = render(<TrainList trainsByDirection={[{
        directionName: 'Everett Station',
        trains: [
          { destination: 'Everett Station', time: '08:05:00', minutesAway: 0, departingAt: Date.now() - 5000 },
          { destination: 'Everett Station', time: '08:33:00', minutesAway: 28 },
        ],
      }]} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);

      expect(screen.getByText('Departing')).toBeInTheDocument();
      expect(container.querySelector('.train-hero.departing')).toBeInTheDocument();
    });
  });

  describe('train alerts', () => {
    it('shows delayed and cancelled alerts on hero', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const { container, rerender } = render(<TrainList trainsByDirection={[{
        directionName: 'Everett Station',
        trains: [{
          destination: 'Everett Station', time: '08:05:00', minutesAway: 35, trainNumber: '1700',
          alert: { trainNumber: '1700', severity: 'delayed', message: 'Running 15m late', delayMinutes: 15, alertId: 'a1' },
        }],
      }]} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);

      expect(screen.getByText('Running 15m late')).toBeInTheDocument();
      expect(container.querySelector('.train-alert-text--delayed')).toBeInTheDocument();

      rerender(<TrainList trainsByDirection={[{
        directionName: 'Everett Station',
        trains: [{
          destination: 'Everett Station', time: '08:05:00', minutesAway: 35, trainNumber: '1700',
          alert: { trainNumber: '1700', severity: 'cancelled', message: 'Cancelled', alertId: 'a1' },
        }],
      }]} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(container.querySelector('.train-hero-countdown--cancelled')).toBeInTheDocument();
    });

    it('shows alert indicators on secondary trains', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
      const { container } = render(<TrainList trainsByDirection={[{
        directionName: 'Everett Station',
        trains: [
          { destination: 'Everett Station', time: '08:05:00', minutesAway: 35, trainNumber: '1700' },
          { destination: 'Everett Station', time: '08:33:00', minutesAway: 63, trainNumber: '1702',
            alert: { trainNumber: '1702', severity: 'delayed', message: 'Running 10m late', delayMinutes: 10, alertId: 'a2' } },
          { destination: 'Everett Station', time: '09:00:00', minutesAway: 90, trainNumber: '1704',
            alert: { trainNumber: '1704', severity: 'cancelled', message: 'Cancelled', alertId: 'a3' } },
        ],
      }]} serviceContext={weekdayCtx} hasStop={true} currentRoute="n-line" />);

      expect(container.querySelector('.train-alert-indicator--delayed')).toBeInTheDocument();
      expect(container.querySelector('.train-alert-indicator--cancelled')).toBeInTheDocument();
      expect(container.querySelector('.train-cancelled')).toBeInTheDocument();
    });
  });
});

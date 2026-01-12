import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TEST_TIMES } from '../../tests/fixtures/time';
import { TrainList } from './TrainList';
import type { DirectionTrains } from '../types';

// Mock train data for testing
const mockSingleDirection: DirectionTrains[] = [
  {
    directionName: 'Everett Station',
    trains: [
      { destination: 'Everett Station', time: '08:05:00', minutesAway: 35, isTomorrow: false },
      { destination: 'Everett Station', time: '08:33:00', minutesAway: 63, isTomorrow: false },
      { destination: 'Everett Station', time: '09:15:00', minutesAway: 105, isTomorrow: false },
    ],
  },
];

const mockMultipleDirections: DirectionTrains[] = [
  {
    directionName: 'Tacoma Dome Station',
    trains: [
      { destination: 'Tacoma Dome Station', time: '17:35:00', minutesAway: 5, isTomorrow: false },
      { destination: 'Tacoma Dome Station', time: '18:15:00', minutesAway: 45, isTomorrow: false },
    ],
  },
  {
    directionName: 'Lakewood Station',
    trains: [
      { destination: 'Lakewood Station', time: '17:55:00', minutesAway: 25, isTomorrow: false },
      { destination: 'Lakewood Station', time: '18:35:00', minutesAway: 65, isTomorrow: false },
    ],
  },
];

const mockTomorrowTrains: DirectionTrains[] = [
  {
    directionName: 'King Street Station',
    trains: [
      { destination: 'King Street Station', time: '05:15:00', minutesAway: 345, isTomorrow: true },
      { destination: 'King Street Station', time: '05:45:00', minutesAway: 375, isTomorrow: true },
    ],
  },
];

describe('TrainList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('weekend behavior', () => {
    it('shows "No service today" message on weekend', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);

      render(
        <TrainList
          trainsByDirection={[]}
          isWeekend={true}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('No service today')).toBeInTheDocument();
      expect(screen.getByText("Sounder trains don't run on weekends")).toBeInTheDocument();
    });

    it('shows weekend message even if train data is provided', () => {
      vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={true}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('No service today')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows "Select a station" when hasStop is false', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={[]}
          isWeekend={false}
          hasStop={false}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('Select a station')).toBeInTheDocument();
      expect(screen.getByText('Choose your departure stop above')).toBeInTheDocument();
    });

    it('shows "No trains available" when no trains and has stop', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={[]}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('No trains available')).toBeInTheDocument();
      expect(screen.getByText('Check back later for upcoming departures')).toBeInTheDocument();
    });
  });

  describe('train display', () => {
    it('shows destination header', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('To Everett Station')).toBeInTheDocument();
    });

    it('shows hero countdown for first train', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // First train is 35 minutes away
      expect(screen.getByText('35m')).toBeInTheDocument();
    });

    it('shows formatted departure time', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // 08:05:00 formatted as 8:05 AM
      expect(screen.getByText('8:05 AM')).toBeInTheDocument();
    });

    it('shows "Other Departures" section when there are more trains', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('Other Departures')).toBeInTheDocument();
    });

    it('shows secondary train times', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // Second and third trains
      expect(screen.getByText('8:33 AM')).toBeInTheDocument();
      expect(screen.getByText('9:15 AM')).toBeInTheDocument();
    });
  });

  describe('tomorrow trains', () => {
    it('shows "Tomorrow" for trains on the next day', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_LATE_NIGHT);

      render(
        <TrainList
          trainsByDirection={mockTomorrowTrains}
          isWeekend={false}
          hasStop={true}
          currentRoute="s-line"
        />
      );

      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('shows "tomorrow" in secondary train countdown', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_LATE_NIGHT);

      render(
        <TrainList
          trainsByDirection={mockTomorrowTrains}
          isWeekend={false}
          hasStop={true}
          currentRoute="s-line"
        />
      );

      // Secondary trains should show "tomorrow"
      const tomorrowLabels = screen.getAllByText('tomorrow');
      expect(tomorrowLabels.length).toBeGreaterThan(0);
    });
  });

  describe('multiple directions (tabs)', () => {
    it('shows destination tabs when multiple directions exist', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);

      render(
        <TrainList
          trainsByDirection={mockMultipleDirections}
          isWeekend={false}
          hasStop={true}
          currentRoute="s-line"
        />
      );

      // Should show tabs for Tacoma and Lakewood
      expect(screen.getByRole('button', { name: /Tacoma/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Lakewood/i })).toBeInTheDocument();
    });

    it('switches direction content when tab is clicked', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);

      render(
        <TrainList
          trainsByDirection={mockMultipleDirections}
          isWeekend={false}
          hasStop={true}
          currentRoute="s-line"
        />
      );

      // Initially shows Tacoma (first direction)
      expect(screen.getByText('To Tacoma Dome Station')).toBeInTheDocument();

      // Click Lakewood tab
      fireEvent.click(screen.getByRole('button', { name: /Lakewood/i }));

      // Should now show Lakewood
      expect(screen.getByText('To Lakewood Station')).toBeInTheDocument();
    });

    it('does not show tabs for single direction', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // Should not have any tab buttons
      expect(screen.queryByRole('button', { name: /Everett/i })).not.toBeInTheDocument();
    });
  });

  describe('direction arrows', () => {
    it('shows up arrow for northbound destinations', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('shows down arrow for southbound destinations', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_EVENING);

      render(
        <TrainList
          trainsByDirection={mockMultipleDirections}
          isWeekend={false}
          hasStop={true}
          currentRoute="s-line"
        />
      );

      // Tacoma is south
      expect(screen.getAllByText('↓').length).toBeGreaterThan(0);
    });
  });
});

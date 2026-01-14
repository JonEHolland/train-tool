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

const mockDepartingTrain: DirectionTrains[] = [
  {
    directionName: 'Everett Station',
    trains: [
      { destination: 'Everett Station', time: '08:05:00', minutesAway: 0, isTomorrow: false, departingAt: Date.now() - 5000 },
      { destination: 'Everett Station', time: '08:33:00', minutesAway: 28, isTomorrow: false },
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
    it('shows weekend message on weekend', () => {
      vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);

      render(
        <TrainList
          trainsByDirection={[]}
          isWeekend={true}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('No trains on weekends')).toBeInTheDocument();
      expect(screen.getByText('Service resumes Monday morning')).toBeInTheDocument();
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

      expect(screen.getByText('No trains on weekends')).toBeInTheDocument();
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

      // Header shows "to {destination}" - using regex to match the text node
      expect(screen.getByText(/to Everett Station/)).toBeInTheDocument();
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

      // Should show tabs for Tacoma and Lakewood (role="tab" from UI Tabs component)
      expect(screen.getByRole('tab', { name: /Tacoma/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Lakewood/i })).toBeInTheDocument();
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

      // Initially shows Tacoma (first direction) - using regex due to train number span
      expect(screen.getByText(/to Tacoma Dome Station/)).toBeInTheDocument();

      // Click Lakewood tab (role="tab" from UI Tabs component)
      fireEvent.click(screen.getByRole('tab', { name: /Lakewood/i }));

      // Should now show Lakewood
      expect(screen.getByText(/to Lakewood Station/)).toBeInTheDocument();
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

      // Should not have any tabs when there's only one direction
      expect(screen.queryByRole('tab', { name: /Everett/i })).not.toBeInTheDocument();
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

  describe('departing state', () => {
    it('shows "Departing" when train has departingAt set', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockDepartingTrain}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('Departing')).toBeInTheDocument();
    });

    it('applies departing urgency class to hero', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockDepartingTrain}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(container.querySelector('.train-hero.departing')).toBeInTheDocument();
    });
  });

  describe('train alerts', () => {
    const mockTrainWithDelayAlert: DirectionTrains[] = [
      {
        directionName: 'Everett Station',
        trains: [
          {
            destination: 'Everett Station',
            time: '08:05:00',
            minutesAway: 35,
            isTomorrow: false,
            trainNumber: '1700',
            alert: {
              trainNumber: '1700',
              severity: 'delayed',
              message: 'Running 15m late',
              delayMinutes: 15,
              alertId: 'alert-1',
            },
          },
          {
            destination: 'Everett Station',
            time: '08:33:00',
            minutesAway: 63,
            isTomorrow: false,
            trainNumber: '1702',
          },
        ],
      },
    ];

    const mockTrainWithCancelledAlert: DirectionTrains[] = [
      {
        directionName: 'Everett Station',
        trains: [
          {
            destination: 'Everett Station',
            time: '08:05:00',
            minutesAway: 35,
            isTomorrow: false,
            trainNumber: '1700',
            alert: {
              trainNumber: '1700',
              severity: 'cancelled',
              message: 'Cancelled',
              alertId: 'alert-1',
            },
          },
        ],
      },
    ];

    const mockSecondaryTrainWithAlert: DirectionTrains[] = [
      {
        directionName: 'Everett Station',
        trains: [
          {
            destination: 'Everett Station',
            time: '08:05:00',
            minutesAway: 35,
            isTomorrow: false,
            trainNumber: '1700',
          },
          {
            destination: 'Everett Station',
            time: '08:33:00',
            minutesAway: 63,
            isTomorrow: false,
            trainNumber: '1702',
            alert: {
              trainNumber: '1702',
              severity: 'delayed',
              message: 'Running 10m late',
              delayMinutes: 10,
              alertId: 'alert-2',
            },
          },
          {
            destination: 'Everett Station',
            time: '09:00:00',
            minutesAway: 90,
            isTomorrow: false,
            trainNumber: '1704',
            alert: {
              trainNumber: '1704',
              severity: 'cancelled',
              message: 'Cancelled',
              alertId: 'alert-3',
            },
          },
        ],
      },
    ];

    it('displays alert text below hero ring for delayed train', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockTrainWithDelayAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('Running 15m late')).toBeInTheDocument();
    });

    it('displays alert text below hero ring for cancelled train', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      render(
        <TrainList
          trainsByDirection={mockTrainWithCancelledAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('applies correct CSS class for delayed alert', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockTrainWithDelayAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(container.querySelector('.train-alert-text--delayed')).toBeInTheDocument();
    });

    it('applies correct CSS class for cancelled alert on hero countdown', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockTrainWithCancelledAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // Cancelled hero shows "Cancelled" text with matching color class
      expect(container.querySelector('.train-hero-countdown--cancelled')).toBeInTheDocument();
    });

    it('shows alert indicator dot on secondary train with alert', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockSecondaryTrainWithAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // Should have indicator dots for the two secondary trains with alerts
      const delayedIndicator = container.querySelector('.train-alert-indicator--delayed');
      const cancelledIndicator = container.querySelector('.train-alert-indicator--cancelled');

      expect(delayedIndicator).toBeInTheDocument();
      expect(cancelledIndicator).toBeInTheDocument();
    });

    it('shows "Cancelled" text for cancelled secondary train', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockSecondaryTrainWithAlert}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      // Cancelled secondary trains show "Cancelled" with red text
      expect(container.querySelector('.train-cancelled')).toBeInTheDocument();
      expect(container.querySelector('.train-secondary-countdown--cancelled')).toBeInTheDocument();
    });

    it('does not show alert text for trains without alerts', () => {
      vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

      const { container } = render(
        <TrainList
          trainsByDirection={mockSingleDirection}
          isWeekend={false}
          hasStop={true}
          currentRoute="n-line"
        />
      );

      expect(container.querySelector('.train-alert-text')).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainSchedule } from './useTrainSchedule';
import { TEST_SCHEDULE_DATA } from '../../tests/fixtures/schedule-data';
import { TEST_TIMES, TEST_DATES } from '../../tests/fixtures/time';
import { UPDATE_INTERVAL_MS } from '../utils/constants';
import type { TrainAlert } from '../types';

describe('useTrainSchedule', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const emptyAlerts = new Map<string, TrainAlert>();

  it('returns trains for given route and stop, empty when stopId is empty', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);

    const { result, rerender } = renderHook(
      ({ stopId }) => useTrainSchedule({ scheduleData: TEST_SCHEDULE_DATA, route: 'n-line', stopId, trainAlerts: emptyAlerts }),
      { initialProps: { stopId: 'edmonds' } }
    );
    expect(result.current.trainsByDirection.length).toBeGreaterThan(0);

    rerender({ stopId: '' });
    expect(result.current.trainsByDirection).toEqual([]);
  });

  it('updates on interval and cleans up on unmount', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { result, unmount } = renderHook(() =>
      useTrainSchedule({ scheduleData: TEST_SCHEDULE_DATA, route: 'n-line', stopId: 'edmonds', trainAlerts: emptyAlerts })
    );

    act(() => { vi.advanceTimersByTime(UPDATE_INTERVAL_MS); });
    expect(result.current.trainsByDirection).toBeDefined();

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('returns correct serviceContext on weekday vs weekend', () => {
    vi.setSystemTime(TEST_TIMES.WEEKDAY_MORNING);
    const { result: weekday } = renderHook(() =>
      useTrainSchedule({ scheduleData: TEST_SCHEDULE_DATA, route: 'n-line', stopId: 'edmonds', trainAlerts: emptyAlerts })
    );
    expect(weekday.current.serviceContext.hasService).toBe(true);
    expect(weekday.current.serviceContext.isWeekendWithNoService).toBe(false);

    vi.setSystemTime(TEST_TIMES.SATURDAY_AFTERNOON);
    const { result: weekend } = renderHook(() =>
      useTrainSchedule({ scheduleData: TEST_SCHEDULE_DATA, route: 'n-line', stopId: 'edmonds', trainAlerts: emptyAlerts })
    );
    expect(weekend.current.serviceContext.hasService).toBe(false);
    expect(weekend.current.serviceContext.isWeekendWithNoService).toBe(true);
    // Weekend still returns Monday preview trains
    expect(weekend.current.trainsByDirection.length).toBeGreaterThan(0);
    expect(weekend.current.trainsByDirection[0].trains[0].nextDayLabel).toBe('Monday');
  });

  it('returns exception service context for gameday', () => {
    vi.setSystemTime(TEST_TIMES.SUNDAY_MORNING);

    const gamedayData = {
      ...TEST_SCHEDULE_DATA,
      calendarDates: {
        'SOUNDER_GAMEDAY_1210_Sunday': [{ date: TEST_DATES.SUNDAY, exception_type: '1' }],
      },
      schedule: {
        ...TEST_SCHEDULE_DATA.schedule,
        'n-line': {
          ...TEST_SCHEDULE_DATA.schedule['n-line'],
          directions: {
            ...TEST_SCHEDULE_DATA.schedule['n-line'].directions,
            '0': {
              trips: [
                ...TEST_SCHEDULE_DATA.schedule['n-line'].directions['0'].trips,
                {
                  tripId: 'gameday-trip-1',
                  serviceId: 'SOUNDER_GAMEDAY_1210_Sunday',
                  headsign: 'Seattle',
                  stops: [
                    { stopId: 'everett', arrival: '10:00:00', departure: '10:00:00' },
                    { stopId: 'edmonds', arrival: '10:20:00', departure: '10:20:00' },
                    { stopId: 'seattle', arrival: '10:50:00', departure: '10:50:00' },
                  ],
                },
              ],
            },
          },
        },
      },
    };

    const { result } = renderHook(() =>
      useTrainSchedule({ scheduleData: gamedayData, route: 'n-line', stopId: 'edmonds', trainAlerts: emptyAlerts })
    );

    expect(result.current.serviceContext.hasExceptionService).toBe(true);
    expect(result.current.serviceContext.exceptionServiceType).toBe('gameday');
  });
});

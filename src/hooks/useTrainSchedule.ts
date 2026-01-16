import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTrainsByDirection, getServiceContext } from '../utils/schedule';
import { UPDATE_INTERVAL_MS, DEPARTING_DURATION_MS } from '../utils/constants';
import type { ScheduleData, NextTrain, DirectionTrains, TrainAlert, ServiceContext } from '../types';

interface UseTrainScheduleOptions {
  scheduleData: ScheduleData;
  route: string;
  stopId: string;
  trainAlerts: Map<string, TrainAlert>;
}

interface UseTrainScheduleResult {
  trainsByDirection: DirectionTrains[];
  serviceContext: ServiceContext;
}

/**
 * Manages train schedule data with departing state tracking and alert attachment.
 *
 * Responsibilities:
 * - Fetches trains for the given route/stop using getTrainsByDirection
 * - Tracks "departing" state for trains within DEPARTING_DURATION_MS
 * - Attaches alerts to matching trains by train number
 * - Updates on interval (UPDATE_INTERVAL_MS)
 */
export function useTrainSchedule({
  scheduleData,
  route,
  stopId,
  trainAlerts,
}: UseTrainScheduleOptions): UseTrainScheduleResult {
  const [trainsByDirection, setTrainsByDirection] = useState<DirectionTrains[]>([]);

  // Track when trains enter "Departing" state (key: direction-departureTime, value: timestamp)
  const departingTrainsRef = useRef<Map<string, number>>(new Map());

  const updateTrains = useCallback(() => {
    if (!stopId) {
      setTrainsByDirection([]);
      return;
    }

    const rawTrains = getTrainsByDirection(scheduleData, route, stopId);
    const now = Date.now();
    const departingMap = departingTrainsRef.current;

    // Process each direction's trains to handle departing state
    const processedTrains = rawTrains.map(direction => {
      const processedDirectionTrains: NextTrain[] = [];

      for (const train of direction.trains) {
        const key = `${direction.directionName}-${train.time}`;

        if (train.minutesAway < 1 && !train.isTomorrow) {
          // Train is departing or has departed
          if (!departingMap.has(key)) {
            // First time entering departing state
            departingMap.set(key, now);
          }

          const departingAt = departingMap.get(key)!;
          const elapsed = now - departingAt;

          if (elapsed < DEPARTING_DURATION_MS) {
            // Still within departing window - show train with departing state
            processedDirectionTrains.push({
              ...train,
              departingAt
            });
          }
          // If elapsed >= DEPARTING_DURATION_MS, don't add the train (filter it out)
        } else {
          // Train is not departing - remove from map if it was there and add normally
          departingMap.delete(key);
          processedDirectionTrains.push(train);
        }
      }

      return {
        ...direction,
        trains: processedDirectionTrains
      };
    }).filter(direction => direction.trains.length > 0); // Remove empty directions

    // Attach alerts to matching trains by train number
    const trainsWithAlerts = processedTrains.map(direction => ({
      ...direction,
      trains: direction.trains.map(train => ({
        ...train,
        alert: train.trainNumber ? trainAlerts.get(train.trainNumber) : undefined,
      })),
    }));

    setTrainsByDirection(trainsWithAlerts);
  }, [scheduleData, route, stopId, trainAlerts]);

  useEffect(() => {
    updateTrains();
    const interval = setInterval(updateTrains, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updateTrains]);

  // Compute service context (route-aware, based on actual trains available)
  const serviceContext = useMemo(
    () => getServiceContext(scheduleData, route, trainsByDirection.length > 0),
    [scheduleData, route, trainsByDirection.length]
  );

  return { trainsByDirection, serviceContext };
}

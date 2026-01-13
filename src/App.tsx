import { useState, useEffect, useCallback, useRef } from 'react';
import { RouteSelect } from './components/RouteSelect';
import { StopSelect } from './components/StopSelect';
import { TrainList } from './components/TrainList';
import { AlertList } from './components/AlertList';
import { UpdateBanner } from './components/UpdateBanner';
import { Disclaimer } from './components/Disclaimer';
import { useAlerts } from './hooks/useAlerts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { timeToMinutes, getCurrentMinutes, isWeekday } from './utils/time';
import { UPDATE_INTERVAL_MS, DEPARTING_DURATION_MS } from './utils/constants';
import { extractTrainNumber } from './utils/trainNumber';
import type { ScheduleData, NextTrain, DirectionTrains } from './types';
import scheduleData from './schedule-data.json';

const typedScheduleData = scheduleData as ScheduleData;

const MINUTES_IN_DAY = 24 * 60;

function getActiveServices(data: ScheduleData): Set<string> {
  const today = new Date();
  // Use local date components, not UTC
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`; // YYYYMMDD in local time
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const todayName = dayNames[dayOfWeek];

  const activeServices = new Set<string>();

  // Check regular calendars
  if (data.calendars) {
    for (const [serviceId, calendar] of Object.entries(data.calendars)) {
      // Check if today is within the date range
      if (dateStr >= calendar.start_date && dateStr <= calendar.end_date) {
        // Check if service runs on this day of week
        if (calendar[todayName]) {
          activeServices.add(serviceId);
        }
      }
    }
  }

  // Apply calendar date exceptions
  if (data.calendarDates) {
    for (const [serviceId, exceptions] of Object.entries(data.calendarDates)) {
      for (const exception of exceptions) {
        if (exception.date === dateStr) {
          if (exception.exception_type === '1') {
            // Service added for this date
            activeServices.add(serviceId);
          } else if (exception.exception_type === '2') {
            // Service removed for this date
            activeServices.delete(serviceId);
          }
        }
      }
    }
  }

  return activeServices;
}

function getTrainsByDirection(data: ScheduleData, route: string, stopId: string): DirectionTrains[] {
  const schedule = data.schedule[route];
  if (!schedule) return [];

  const activeServices = getActiveServices(data);
  const nowMinutes = getCurrentMinutes();

  // Group trains by their terminus (headsign)
  const trainsByTerminus = new Map<string, NextTrain[]>();

  for (const direction of Object.values(schedule.directions)) {
    for (const trip of direction.trips) {
      // Skip trips that aren't running today
      if (trip.serviceId && !activeServices.has(trip.serviceId)) continue;

      const stopIndex = trip.stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) continue;

      // Skip if this is the last stop (terminus) - can't board a terminating train
      if (stopIndex === trip.stops.length - 1) continue;

      const stopTime = trip.stops[stopIndex];
      const depMinutes = timeToMinutes(stopTime.departure);

      // Calculate minutes away, wrapping to next day if train already passed today
      let minutesAway: number;
      let isTomorrow = false;

      if (depMinutes >= nowMinutes) {
        // Train departs now or in the future
        minutesAway = depMinutes - nowMinutes;
      } else {
        // Train already passed today, show tomorrow's departure
        minutesAway = (MINUTES_IN_DAY - nowMinutes) + depMinutes;
        isTomorrow = true;
      }

      const terminus = trip.headsign || 'Unknown';
      if (!trainsByTerminus.has(terminus)) {
        trainsByTerminus.set(terminus, []);
      }

      trainsByTerminus.get(terminus)!.push({
        destination: terminus,
        time: stopTime.departure,
        minutesAway,
        isTomorrow,
        trainNumber: extractTrainNumber(trip.tripId)
      });
    }
  }

  // Convert to array and sort
  const result: DirectionTrains[] = [];
  for (const [terminus, trains] of trainsByTerminus) {
    trains.sort((a, b) => a.minutesAway - b.minutesAway);
    result.push({
      directionName: terminus,
      trains: trains.slice(0, 3) // Show up to 3 trains per terminus
    });
  }

  // Sort directions by next train time
  result.sort((a, b) => a.trains[0].minutesAway - b.trains[0].minutesAway);

  return result;
}

export function App() {
  const [currentRoute, setCurrentRoute] = useLocalStorage('sounder-route', 'n-line');
  const [currentStop, setCurrentStop] = useLocalStorage('sounder-stop', '');
  const [trainsByDirection, setTrainsByDirection] = useState<DirectionTrains[]>([]);

  // Track when trains enter "Departing" state (key: direction-departureTime, value: timestamp)
  const departingTrainsRef = useRef<Map<string, number>>(new Map());

  const routeId = typedScheduleData.schedule[currentRoute]?.routeId || '';
  const { alerts, loading: alertsLoading, error: alertsError } = useAlerts(routeId);
  const { updateAvailable, updateAndReload, dismiss } = useServiceWorkerUpdate();

  const stops = typedScheduleData.schedule[currentRoute]?.stops || [];

  useEffect(() => {
    if (stops.length > 0 && !currentStop) {
      setCurrentStop(stops[0].stopId);
    } else if (currentStop && stops.length > 0 && !stops.some(s => s.stopId === currentStop)) {
      // If stored stop isn't valid for this route, reset to first stop
      setCurrentStop(stops[0].stopId);
    }
  }, [stops, currentStop, setCurrentStop]);

  const updateTrains = useCallback(() => {
    if (currentStop) {
      const rawTrains = getTrainsByDirection(typedScheduleData, currentRoute, currentStop);
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

      setTrainsByDirection(processedTrains);
    }
  }, [currentRoute, currentStop]);

  useEffect(() => {
    updateTrains();
    const interval = setInterval(updateTrains, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updateTrains]);

  const handleRouteChange = (route: string) => {
    setCurrentRoute(route);
    const newStops = typedScheduleData.schedule[route]?.stops || [];
    setCurrentStop(newStops.length > 0 ? newStops[0].stopId : '');
  };

  const weekend = !isWeekday();

  return (
    <>
      <UpdateBanner
        visible={updateAvailable}
        onUpdate={updateAndReload}
        onDismiss={dismiss}
      />
      <div className="container">
        <RouteSelect
          scheduleData={typedScheduleData}
          currentRoute={currentRoute}
          onRouteChange={handleRouteChange}
        />
        <StopSelect
          stops={stops}
          currentStop={currentStop}
          onStopChange={setCurrentStop}
        />
        {/* Show alerts at top if there are any */}
        {alerts.length > 0 && (
          <AlertList
            alerts={alerts}
            loading={alertsLoading}
            error={alertsError}
          />
        )}
        <TrainList
          trainsByDirection={trainsByDirection}
          isWeekend={weekend}
          hasStop={!!currentStop}
          currentRoute={currentRoute}
        />
      </div>
      <Disclaimer />
    </>
  );
}

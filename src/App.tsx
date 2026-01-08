import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RouteSelect } from './components/RouteSelect';
import { StopSelect } from './components/StopSelect';
import { WeekendNotice } from './components/WeekendNotice';
import { TrainList } from './components/TrainList';
import { AlertList } from './components/AlertList';
import { useAlerts } from './hooks/useAlerts';
import { timeToMinutes, getCurrentMinutes, isWeekday } from './utils/time';
import type { ScheduleData, NextTrain, DirectionTrains } from './types';
import scheduleData from './schedule-data.json';

const typedScheduleData = scheduleData as ScheduleData;

const MINUTES_IN_DAY = 24 * 60;
const STORAGE_KEY = 'sounder-train-state';

interface StoredState {
  route: string;
  stop: string;
}

function loadState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return { route: 'n-line', stop: '' };
}

function saveState(route: string, stop: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ route, stop }));
  } catch {
    // Ignore storage errors
  }
}

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

      if (depMinutes > nowMinutes) {
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
        isTomorrow
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
  const [initialState] = useState(loadState);
  const [currentRoute, setCurrentRoute] = useState(initialState.route);
  const [currentStop, setCurrentStop] = useState(initialState.stop);
  const [trainsByDirection, setTrainsByDirection] = useState<DirectionTrains[]>([]);

  const routeId = typedScheduleData.schedule[currentRoute]?.routeId || '';
  const { alerts, loading: alertsLoading, error: alertsError } = useAlerts(routeId);

  const stops = typedScheduleData.schedule[currentRoute]?.stops || [];

  useEffect(() => {
    if (stops.length > 0 && !currentStop) {
      const defaultStop = stops[0].stopId;
      setCurrentStop(defaultStop);
      saveState(currentRoute, defaultStop);
    } else if (currentStop && stops.length > 0 && !stops.some(s => s.stopId === currentStop)) {
      // If stored stop isn't valid for this route, reset to first stop
      const defaultStop = stops[0].stopId;
      setCurrentStop(defaultStop);
      saveState(currentRoute, defaultStop);
    }
  }, [stops, currentStop, currentRoute]);

  const updateTrains = useCallback(() => {
    if (currentStop) {
      setTrainsByDirection(getTrainsByDirection(typedScheduleData, currentRoute, currentStop));
    }
  }, [currentRoute, currentStop]);

  useEffect(() => {
    updateTrains();
    const interval = setInterval(updateTrains, 60000);
    return () => clearInterval(interval);
  }, [updateTrains]);

  const handleRouteChange = (route: string) => {
    setCurrentRoute(route);
    const newStops = typedScheduleData.schedule[route]?.stops || [];
    const newStop = newStops.length > 0 ? newStops[0].stopId : '';
    setCurrentStop(newStop);
    saveState(route, newStop);
  };

  const handleStopChange = (stop: string) => {
    setCurrentStop(stop);
    saveState(currentRoute, stop);
  };

  const weekend = !isWeekday();

  return (
    <>
      <Header />
      <div className="container">
        <RouteSelect
          scheduleData={typedScheduleData}
          currentRoute={currentRoute}
          onRouteChange={handleRouteChange}
        />
        <StopSelect
          stops={stops}
          currentStop={currentStop}
          onStopChange={handleStopChange}
        />
        <WeekendNotice visible={weekend} />
        <TrainList
          trainsByDirection={trainsByDirection}
          isWeekend={weekend}
          hasStop={!!currentStop}
        />
        <AlertList
          alerts={alerts}
          loading={alertsLoading}
          error={alertsError}
        />
      </div>
    </>
  );
}

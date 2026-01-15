import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { RouteSelect } from './components/RouteSelect';
import { StopSelect } from './components/StopSelect';
import { TrainList } from './components/TrainList';
import { AlertList } from './components/AlertList';
import { UpdateBanner } from './components/UpdateBanner';
import { Disclaimer } from './components/Disclaimer';
import { useAlerts } from './hooks/useAlerts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { isWeekday } from './utils/time';
import { UPDATE_INTERVAL_MS, DEPARTING_DURATION_MS } from './utils/constants';
import { getTrainsByDirection } from './utils/schedule';
import type { ScheduleData, NextTrain, DirectionTrains } from './types';
import scheduleData from './schedule-data.json';

// Dev-only component showcase (lazy loaded)
const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase').then(m => ({ default: m.ComponentShowcase })));

const typedScheduleData = scheduleData as ScheduleData;

export function App() {
  // Dev-only: Show component showcase at /components
  if (import.meta.env.DEV && window.location.pathname === '/components') {
    return (
      <Suspense fallback={<div className="container">Loading...</div>}>
        <ComponentShowcase />
      </Suspense>
    );
  }

  const [currentRoute, setCurrentRoute] = useLocalStorage('sounder-route', 'n-line');
  const [stopsMap, setStopsMap] = useLocalStorage<Record<string, string>>('sounder-stops', {});

  // Derive currentStop from the map for the current route
  const currentStop = stopsMap[currentRoute] || '';

  // Update station selection for current route
  const handleStopChange = useCallback((stopId: string) => {
    setStopsMap(prev => ({ ...prev, [currentRoute]: stopId }));
  }, [currentRoute, setStopsMap]);
  const [trainsByDirection, setTrainsByDirection] = useState<DirectionTrains[]>([]);

  // Track when trains enter "Departing" state (key: direction-departureTime, value: timestamp)
  const departingTrainsRef = useRef<Map<string, number>>(new Map());

  const routeId = typedScheduleData.schedule[currentRoute]?.routeId || '';
  const { trainAlerts, generalAlerts, loading: alertsLoading, error: alertsError } = useAlerts(routeId);
  const { updateAvailable, updateAndReload, dismiss } = useServiceWorkerUpdate();

  const stops = typedScheduleData.schedule[currentRoute]?.stops || [];

  useEffect(() => {
    if (stops.length > 0 && !currentStop) {
      handleStopChange(stops[0].stopId);
    } else if (currentStop && stops.length > 0 && !stops.some(s => s.stopId === currentStop)) {
      // If stored stop isn't valid for this route, reset to first stop
      handleStopChange(stops[0].stopId);
    }
  }, [stops, currentStop, handleStopChange]);

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

      // Attach alerts to matching trains by train number
      const trainsWithAlerts = processedTrains.map(direction => ({
        ...direction,
        trains: direction.trains.map(train => ({
          ...train,
          alert: train.trainNumber ? trainAlerts.get(train.trainNumber) : undefined,
        })),
      }));

      setTrainsByDirection(trainsWithAlerts);
    }
  }, [currentRoute, currentStop, trainAlerts]);

  useEffect(() => {
    updateTrains();
    const interval = setInterval(updateTrains, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updateTrains]);

  // Route change only updates route - station auto-restores from stopsMap
  const handleRouteChange = (route: string) => {
    setCurrentRoute(route);
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
          onStopChange={handleStopChange}
        />
        {/* Show general alerts (not train-specific) at top if there are any */}
        {generalAlerts.length > 0 && (
          <AlertList
            alerts={generalAlerts}
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

import { useEffect, useCallback, lazy, Suspense } from 'react';
import { RouteSelect } from './components/RouteSelect';
import { StopSelect } from './components/StopSelect';
import { TrainList } from './components/TrainList';
import { AlertList } from './components/AlertList';
import { UpdateBanner } from './components/UpdateBanner';
import { Disclaimer } from './components/Disclaimer';
import { useAlerts } from './hooks/useAlerts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { useTrainSchedule } from './hooks/useTrainSchedule';
import { isWeekday } from './utils/time';
import type { ScheduleData } from './types';
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

  const routeId = typedScheduleData.schedule[currentRoute]?.routeId || '';
  const { trainAlerts, generalAlerts, loading: alertsLoading, error: alertsError } = useAlerts(routeId);
  const { updateAvailable, updateAndReload, dismiss } = useServiceWorkerUpdate();

  const stops = typedScheduleData.schedule[currentRoute]?.stops || [];

  // Use the train schedule hook for departing state management and alert attachment
  const { trainsByDirection } = useTrainSchedule({
    scheduleData: typedScheduleData,
    route: currentRoute,
    stopId: currentStop,
    trainAlerts,
  });

  useEffect(() => {
    if (stops.length > 0 && !currentStop) {
      handleStopChange(stops[0].stopId);
    } else if (currentStop && stops.length > 0 && !stops.some(s => s.stopId === currentStop)) {
      // If stored stop isn't valid for this route, reset to first stop
      handleStopChange(stops[0].stopId);
    }
  }, [stops, currentStop, handleStopChange]);

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

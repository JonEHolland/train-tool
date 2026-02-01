import { useEffect, useCallback } from 'react';
import { RouteSelect } from '../components/RouteSelect';
import { StopSelect } from '../components/StopSelect';
import { TrainList } from '../components/TrainList';
import { AlertList } from '../components/AlertList';
import { SpecialServiceBanner } from '../components/SpecialServiceBanner';
import { Disclaimer } from '../components/Disclaimer';
import { ExceptionServiceProvider } from '../context/ExceptionServiceContext';
import { useUnifiedAlerts } from '../hooks/alerts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTrainSchedule } from '../hooks/useTrainSchedule';
import type { ScheduleData } from '../types';
import scheduleData from '../schedule-data.json';

const typedScheduleData = scheduleData as ScheduleData;

/**
 * Main train schedule page.
 * Handles route/stop selection, alert fetching, and train display.
 */
export function HomePage() {
  const [currentRoute, setCurrentRoute] = useLocalStorage('sounder-route', 'n-line');
  const [stopsMap, setStopsMap] = useLocalStorage<Record<string, string>>('sounder-stops', {});

  // Derive currentStop from the map for the current route
  const currentStop = stopsMap[currentRoute] || '';

  // Update station selection for current route
  const handleStopChange = useCallback((stopId: string) => {
    setStopsMap(prev => ({ ...prev, [currentRoute]: stopId }));
  }, [currentRoute, setStopsMap]);

  const routeId = typedScheduleData.schedule[currentRoute]?.routeId || '';
  const { trainAlerts, generalAlerts, loading: alertsLoading, error: alertsError } = useUnifiedAlerts(routeId);

  const stops = typedScheduleData.schedule[currentRoute]?.stops || [];

  // Use the train schedule hook for departing state management and alert attachment
  const { trainsByDirection, serviceContext } = useTrainSchedule({
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

  return (
    <>
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
        {/* Exception service context provides filtered alerts and banner theme */}
        <ExceptionServiceProvider trainsByDirection={trainsByDirection} alerts={generalAlerts}>
          <AlertList loading={alertsLoading} error={alertsError} />
          <SpecialServiceBanner />
        </ExceptionServiceProvider>
        <TrainList
          trainsByDirection={trainsByDirection}
          serviceContext={serviceContext}
          hasStop={!!currentStop}
          currentRoute={currentRoute}
        />
      </div>
      <Disclaimer />
    </>
  );
}

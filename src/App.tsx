import { useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { RouteSelect } from './components/RouteSelect';
import { StopSelect } from './components/StopSelect';
import { TrainList } from './components/TrainList';
import { AlertList } from './components/AlertList';
import { UpdateBanner } from './components/UpdateBanner';
import { GamedayBanner, GamedayTheme } from './components/GamedayBanner';
import { Disclaimer } from './components/Disclaimer';
import { useAlerts } from './hooks/useAlerts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { useTrainSchedule } from './hooks/useTrainSchedule';
import { detectTeamFromAlerts, alertMentionsTeam } from './utils/parseTrainAlerts';
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
  const { trainsByDirection, serviceContext } = useTrainSchedule({
    scheduleData: typedScheduleData,
    route: currentRoute,
    stopId: currentStop,
    trainAlerts,
  });

  // Gameday banner logic: Check if any TODAY's train is a gameday exception service
  const hasGamedayTrainToday = useMemo(() => {
    for (const direction of trainsByDirection) {
      for (const train of direction.trains) {
        // Only consider trains for TODAY (not tomorrow)
        if (!train.isTomorrow && train.isExceptionService && train.exceptionServiceType === 'gameday') {
          return true;
        }
      }
    }
    return false;
  }, [trainsByDirection]);

  // Detect team from alerts for banner theming
  const detectedTeam = useMemo(
    () => detectTeamFromAlerts(generalAlerts),
    [generalAlerts]
  );

  // Determine banner theme: team if detected, otherwise generic
  const gamedayTheme: GamedayTheme = detectedTeam || 'generic';

  // Filter alerts: hide team-mentioning alert only if team detected AND banner shown
  const filteredAlerts = useMemo(() => {
    if (!hasGamedayTrainToday || !detectedTeam) {
      return generalAlerts;
    }
    // Hide alerts that mention the detected team
    return generalAlerts.filter(alert => !alertMentionsTeam(alert, detectedTeam));
  }, [generalAlerts, hasGamedayTrainToday, detectedTeam]);

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
        {filteredAlerts.length > 0 && (
          <AlertList
            alerts={filteredAlerts}
            loading={alertsLoading}
            error={alertsError}
          />
        )}
        {/* Show gameday banner when gameday train is in TODAY's departures */}
        <GamedayBanner
          theme={gamedayTheme}
          visible={hasGamedayTrainToday}
        />
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

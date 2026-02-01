import { useMemo, useCallback } from 'react';
import type { AlertEntity, AlertsResponse } from '../../types';
import { parseTrainAlerts } from '../../utils/parseTrainAlerts';
import type { AlertProviderResult } from './types';
import { usePolling } from './usePolling';

const ALERTS_SOURCE = 'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const ALERTS_URL = CORS_PROXY + encodeURIComponent(ALERTS_SOURCE);

/** Polling interval for Sound Transit alerts (5 minutes) */
const POLL_INTERVAL_MS = 300000;

/** Maximum number of alerts to display */
const MAX_ALERTS = 5;

/**
 * Fetches and parses Sound Transit service alerts.
 * Returns train-specific alerts and general service alerts.
 *
 * @param routeId - The Sound Transit route ID to filter alerts
 */
export function useSoundTransitAlerts(routeId: string): AlertProviderResult {
  // Create a stable fetcher that filters alerts for the given route
  const fetchAlerts = useCallback(async (): Promise<AlertEntity[]> => {
    const response = await fetch(ALERTS_URL);
    const data: AlertsResponse = await response.json();

    const relevantAlerts = (data.entity || []).filter(entity => {
      const alert = entity.alert;
      if (!alert) return false;
      const informed = alert.informed_entity || [];
      return informed.some(ie =>
        ie.route_id?.includes('SNDR') ||
        ie.route_id?.includes(routeId) ||
        !ie.route_id
      );
    });

    return relevantAlerts.slice(0, MAX_ALERTS);
  }, [routeId]);

  const { data: alerts, loading, error, refetch } = usePolling(
    fetchAlerts,
    [] as AlertEntity[],
    POLL_INTERVAL_MS,
    'Failed to load Sound Transit alerts'
  );

  // Parse alerts to extract train-specific alerts (memoized)
  const parsedAlerts = useMemo(() => parseTrainAlerts(alerts), [alerts]);

  return {
    trainAlerts: parsedAlerts.trainAlerts,
    generalAlerts: parsedAlerts.generalAlerts,
    loading,
    error,
    refetch,
  };
}

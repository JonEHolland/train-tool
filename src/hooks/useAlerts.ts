import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AlertEntity, AlertsResponse, TrainAlert } from '../types';
import { parseTrainAlerts } from '../utils/parseTrainAlerts';

const ALERTS_SOURCE = 'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const ALERTS_URL = CORS_PROXY + encodeURIComponent(ALERTS_SOURCE);

interface UseAlertsResult {
  /** All relevant alerts (unchanged for backwards compatibility) */
  alerts: AlertEntity[];
  /** Map of train number to parsed alert info for O(1) lookup */
  trainAlerts: Map<string, TrainAlert>;
  /** Alerts not tied to specific trains */
  generalAlerts: AlertEntity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAlerts(routeId: string): UseAlertsResult {
  const [alerts, setAlerts] = useState<AlertEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
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

      setAlerts(relevantAlerts.slice(0, 5));
      setError(null);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Parse alerts to extract train-specific alerts (memoized)
  const parsedAlerts = useMemo(() => parseTrainAlerts(alerts), [alerts]);

  return {
    alerts,
    trainAlerts: parsedAlerts.trainAlerts,
    generalAlerts: parsedAlerts.generalAlerts,
    loading,
    error,
    refetch: fetchAlerts,
  };
}

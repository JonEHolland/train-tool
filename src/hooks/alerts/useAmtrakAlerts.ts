import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TrainAlert, AlertSeverity } from '../../types';
import type { AlertProviderResult, AmtrakerApiResponse, AmtrakerTrainStatus } from './types';

const AMTRAKER_API = 'https://api-v3.amtraker.com/v3/trains';

/** RailPlus trains that serve N-Line stations */
const RAILPLUS_TRAINS = ['516', '517', '518', '519'];

/** Polling interval for Amtrak status (2 minutes - more frequent for real-time) */
const POLL_INTERVAL_MS = 120000;

/** Delay threshold for 'delayed' severity (minutes) */
const DELAY_THRESHOLD_MINUTES = 15;

/**
 * Map Amtrak train status to our severity levels.
 */
function classifyAmtrakSeverity(status: AmtrakerTrainStatus): AlertSeverity {
  const statusText = status.status?.toLowerCase() || '';

  // Check for cancellation
  if (statusText.includes('cancel')) {
    return 'cancelled';
  }

  // Check for significant delays
  const lateMinutes = status.late || 0;
  if (lateMinutes >= DELAY_THRESHOLD_MINUTES || statusText.includes('late')) {
    return 'delayed';
  }

  // Default to info for on-time trains (won't show alert)
  return 'info';
}

/**
 * Format alert message for Amtrak train.
 */
function formatAmtrakAlertMessage(severity: AlertSeverity, lateMinutes?: number): string {
  switch (severity) {
    case 'cancelled':
      return 'Cancelled';
    case 'delayed':
      return lateMinutes && lateMinutes > 0 ? `Running ${lateMinutes}m late` : 'Delayed';
    default:
      return 'On time';
  }
}

/**
 * Fetches real-time status for Amtrak RailPlus trains from Amtraker API.
 * Only returns alerts for delayed or cancelled trains.
 */
export function useAmtrakAlerts(): AlertProviderResult {
  const [trainAlerts, setTrainAlerts] = useState<Map<string, TrainAlert>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmtrakStatus = useCallback(async () => {
    const alerts = new Map<string, TrainAlert>();

    try {
      // Fetch status for each RailPlus train
      const fetchPromises = RAILPLUS_TRAINS.map(async (trainNum) => {
        try {
          const response = await fetch(`${AMTRAKER_API}/${trainNum}`);
          if (!response.ok) {
            // Train might not be running today
            return null;
          }

          const data: AmtrakerApiResponse = await response.json();
          const trainStatuses = data[trainNum];

          if (!trainStatuses || trainStatuses.length === 0) {
            return null;
          }

          // Get the most recent/relevant status
          const status = trainStatuses[0];
          const severity = classifyAmtrakSeverity(status);

          // Only create alerts for delayed or cancelled trains
          if (severity === 'cancelled' || severity === 'delayed') {
            return {
              trainNumber: trainNum,
              severity,
              message: formatAmtrakAlertMessage(severity, status.late),
              delayMinutes: status.late && status.late > 0 ? status.late : undefined,
              alertId: `amtrak-${trainNum}-${Date.now()}`,
            } as TrainAlert;
          }

          return null;
        } catch {
          // Individual train fetch failed - continue with others
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);

      // Add non-null alerts to the map
      for (const alert of results) {
        if (alert) {
          alerts.set(alert.trainNumber, alert);
        }
      }

      setTrainAlerts(alerts);
      setError(null);
    } catch {
      setError('Failed to load Amtrak status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmtrakStatus();
    const interval = setInterval(fetchAmtrakStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAmtrakStatus]);

  // Memoize the result to prevent unnecessary re-renders
  const result = useMemo<AlertProviderResult>(() => ({
    trainAlerts,
    generalAlerts: [], // Amtrak doesn't have general alerts in this integration
    loading,
    error,
    refetch: fetchAmtrakStatus,
  }), [trainAlerts, loading, error, fetchAmtrakStatus]);

  return result;
}

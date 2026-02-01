import { useMemo, useCallback } from 'react';
import type { TrainAlert, AlertSeverity } from '../../types';
import type { AlertProviderResult, AmtrakerApiResponse, AmtrakerTrainStatus } from './types';
import { usePolling } from './usePolling';

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

  if (statusText.includes('cancel')) {
    return 'cancelled';
  }

  const lateMinutes = status.late || 0;
  if (lateMinutes >= DELAY_THRESHOLD_MINUTES || statusText.includes('late')) {
    return 'delayed';
  }

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
 * Fetch status for a single train from Amtraker API.
 */
async function fetchTrainStatus(trainNum: string): Promise<TrainAlert | null> {
  try {
    const response = await fetch(`${AMTRAKER_API}/${trainNum}`);
    if (!response.ok) {
      return null; // Train might not be running today
    }

    const data: AmtrakerApiResponse = await response.json();
    const trainStatuses = data[trainNum];

    if (!trainStatuses || trainStatuses.length === 0) {
      return null;
    }

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
      };
    }

    return null;
  } catch {
    return null; // Individual train fetch failed
  }
}

/**
 * Fetches real-time status for Amtrak RailPlus trains from Amtraker API.
 * Only returns alerts for delayed or cancelled trains.
 */
export function useAmtrakAlerts(): AlertProviderResult {
  const fetchAmtrakStatus = useCallback(async (): Promise<Map<string, TrainAlert>> => {
    const alerts = new Map<string, TrainAlert>();
    const results = await Promise.all(RAILPLUS_TRAINS.map(fetchTrainStatus));

    for (const alert of results) {
      if (alert) {
        alerts.set(alert.trainNumber, alert);
      }
    }

    return alerts;
  }, []);

  const { data: trainAlerts, loading, error, refetch } = usePolling(
    fetchAmtrakStatus,
    new Map<string, TrainAlert>(),
    POLL_INTERVAL_MS,
    'Failed to load Amtrak status'
  );

  // Memoize the result to prevent unnecessary re-renders
  return useMemo<AlertProviderResult>(() => ({
    trainAlerts,
    generalAlerts: [], // Amtrak doesn't have general alerts in this integration
    loading,
    error,
    refetch,
  }), [trainAlerts, loading, error, refetch]);
}

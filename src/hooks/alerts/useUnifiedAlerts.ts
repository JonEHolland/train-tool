import { useMemo, useCallback } from 'react';
import type { AlertEntity, TrainAlert } from '../../types';
import { useSoundTransitAlerts } from './useSoundTransitAlerts';
import { useAmtrakAlerts } from './useAmtrakAlerts';
import type { AlertProviderResult } from './types';

export interface UnifiedAlertsResult extends AlertProviderResult {
  /** All original alerts (for backwards compatibility) */
  alerts: AlertEntity[];
}

/**
 * Unified alerts hook that combines Sound Transit and Amtrak alerts.
 * Merges train-specific alerts from both providers.
 *
 * @param routeId - The Sound Transit route ID to filter alerts
 */
export function useUnifiedAlerts(routeId: string): UnifiedAlertsResult {
  const soundTransit = useSoundTransitAlerts(routeId);
  const amtrak = useAmtrakAlerts();

  // Merge train alerts from both providers
  const trainAlerts = useMemo(() => {
    const merged = new Map<string, TrainAlert>();

    // Add Sound Transit alerts
    for (const [trainNum, alert] of soundTransit.trainAlerts) {
      merged.set(trainNum, alert);
    }

    // Add Amtrak alerts (they use different train numbers so no conflict)
    for (const [trainNum, alert] of amtrak.trainAlerts) {
      merged.set(trainNum, alert);
    }

    return merged;
  }, [soundTransit.trainAlerts, amtrak.trainAlerts]);

  // Combined refetch function
  const refetch = useCallback(() => {
    soundTransit.refetch();
    amtrak.refetch();
  }, [soundTransit, amtrak]);

  // Combine loading and error states
  const loading = soundTransit.loading || amtrak.loading;

  // Combine errors (prefer showing Sound Transit error as it's the primary)
  const error = soundTransit.error || amtrak.error;

  return useMemo(() => ({
    alerts: soundTransit.generalAlerts, // For backwards compatibility
    trainAlerts,
    generalAlerts: soundTransit.generalAlerts,
    loading,
    error,
    refetch,
  }), [trainAlerts, soundTransit.generalAlerts, loading, error, refetch]);
}

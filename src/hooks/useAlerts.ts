/**
 * @deprecated Use useUnifiedAlerts from './alerts' instead.
 * This hook is kept for backwards compatibility.
 */
import { useUnifiedAlerts } from './alerts';
import type { AlertEntity, TrainAlert } from '../types';

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

/**
 * @deprecated Use useUnifiedAlerts from './alerts' instead.
 * This hook now wraps useUnifiedAlerts for backwards compatibility.
 */
export function useAlerts(routeId: string): UseAlertsResult {
  return useUnifiedAlerts(routeId);
}

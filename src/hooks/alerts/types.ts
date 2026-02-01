import type { AlertEntity, TrainAlert } from '../../types';

/**
 * Result from an alert provider
 */
export interface AlertProviderResult {
  /** Map of train number to parsed alert info for O(1) lookup */
  trainAlerts: Map<string, TrainAlert>;
  /** Alerts not tied to specific trains (general service alerts) */
  generalAlerts: AlertEntity[];
  /** Whether alerts are currently loading */
  loading: boolean;
  /** Error message if alert fetch failed */
  error: string | null;
  /** Function to manually refetch alerts */
  refetch: () => void;
}

/**
 * Amtraker API response for a single train
 */
export interface AmtrakerTrainStatus {
  trainNum: string;
  lat: number;
  lon: number;
  heading: string;
  velocity: number;
  /** Scheduled arrival time */
  schArr?: string;
  /** Actual/estimated arrival time */
  arr?: string;
  /** Scheduled departure time */
  schDep?: string;
  /** Actual/estimated departure time */
  dep?: string;
  /** Train status: "On Time", "Late", "Cancelled", etc. */
  status?: string;
  /** Station code where the train currently is */
  station?: string;
  /** Station name */
  stationName?: string;
  /** Minutes early (negative) or late (positive) */
  late?: number;
}

/**
 * Amtraker API response structure
 */
export interface AmtrakerApiResponse {
  [trainNum: string]: AmtrakerTrainStatus[];
}

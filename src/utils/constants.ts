/**
 * Time-based thresholds for urgency states (in minutes)
 */
export const URGENCY_THRESHOLDS = {
  /** Train is imminent - danger state (red) */
  DANGER: 2,
  /** Train is soon - warning state (yellow/orange) */
  WARNING: 5,
  /** Train is comfortable - secondary accent state */
  COMFORTABLE: 15,
} as const;

/**
 * Maximum time displayed on progress ring (in minutes)
 * Beyond this, the ring shows as full
 */
export const PROGRESS_MAX_MINUTES = 60;

/**
 * Update interval for train countdown (in milliseconds)
 * 10 seconds provides responsiveness without excessive updates
 */
export const UPDATE_INTERVAL_MS = 10000;

/**
 * How long to show "Departing" state before removing train (in milliseconds)
 */
export const DEPARTING_DURATION_MS = 30000;

/**
 * Duration to hide install banner after dismissal (in milliseconds)
 * 7 days
 */
export const INSTALL_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * localStorage key for tracking install banner dismissal
 */
export const INSTALL_DISMISS_KEY = 'sounder-install-dismissed';

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

import type { AlertEntity } from '../../src/types';

/**
 * Mock alert data for testing train-specific alert parsing.
 * These fixtures cover various alert formats and edge cases.
 */

/** Alert with single delayed train */
export const ALERT_TRAIN_DELAYED: AlertEntity = {
  id: 'alert-delayed-1700',
  alert: {
    header_text: { translation: [{ text: 'Sounder Service Alert' }] },
    description_text: {
      translation: [{
        text: 'Train 1700 is delayed 15 minutes due to mechanical issues at King Street Station.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with cancelled train using # prefix */
export const ALERT_TRAIN_CANCELLED: AlertEntity = {
  id: 'alert-cancelled-1511',
  alert: {
    header_text: { translation: [{ text: 'Train Cancellation' }] },
    description_text: {
      translation: [{
        text: 'Sounder train #1511 has been cancelled due to equipment failure.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_TL' }],
  },
};

/** Alert with multiple trains affected */
export const ALERT_MULTIPLE_TRAINS: AlertEntity = {
  id: 'alert-multiple-delayed',
  alert: {
    header_text: { translation: [{ text: 'Multiple Train Delays' }] },
    description_text: {
      translation: [{
        text: 'Trains 1700, 1702, and 1704 are running approximately 10 minutes behind schedule due to track work.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with train number at start of line (colon format) */
export const ALERT_COLON_FORMAT: AlertEntity = {
  id: 'alert-colon-1702',
  alert: {
    header_text: { translation: [{ text: 'Service Update' }] },
    description_text: {
      translation: [{
        text: '1702: Running 20 minutes late due to signal problems.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with train number with letter suffix */
export const ALERT_TRAIN_WITH_SUFFIX: AlertEntity = {
  id: 'alert-suffix-1820E',
  alert: {
    header_text: { translation: [{ text: 'Train Delay' }] },
    description_text: {
      translation: [{
        text: 'Train 1820E is delayed by 25 minutes.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with modified service */
export const ALERT_MODIFIED_SERVICE: AlertEntity = {
  id: 'alert-modified-1700',
  alert: {
    header_text: { translation: [{ text: 'Modified Service' }] },
    description_text: {
      translation: [{
        text: 'Train #1700 will be skipping Tukwila Station due to construction.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_TL' }],
  },
};

/** General system alert with no train number */
export const ALERT_GENERAL: AlertEntity = {
  id: 'alert-general-advisory',
  alert: {
    header_text: { translation: [{ text: 'System Advisory' }] },
    description_text: {
      translation: [{
        text: 'Please allow extra travel time today due to weather conditions. All trains may experience minor delays.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with empty description */
export const ALERT_EMPTY_DESCRIPTION: AlertEntity = {
  id: 'alert-empty',
  alert: {
    header_text: { translation: [{ text: 'Alert' }] },
    description_text: { translation: [{ text: '' }] },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with only header text */
export const ALERT_HEADER_ONLY: AlertEntity = {
  id: 'alert-header-only',
  alert: {
    header_text: { translation: [{ text: 'Train 1700 cancelled' }] },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Alert with hash prefix standalone */
export const ALERT_HASH_PREFIX: AlertEntity = {
  id: 'alert-hash-1704',
  alert: {
    header_text: { translation: [{ text: 'Delay Alert' }] },
    description_text: {
      translation: [{
        text: 'Due to congestion, #1704 is running 5 minutes late.',
      }],
    },
    informed_entity: [{ route_id: 'SNDR_EV' }],
  },
};

/** Collection of all mock alerts for convenience */
export const MOCK_ALERTS = {
  TRAIN_DELAYED: ALERT_TRAIN_DELAYED,
  TRAIN_CANCELLED: ALERT_TRAIN_CANCELLED,
  MULTIPLE_TRAINS: ALERT_MULTIPLE_TRAINS,
  COLON_FORMAT: ALERT_COLON_FORMAT,
  TRAIN_WITH_SUFFIX: ALERT_TRAIN_WITH_SUFFIX,
  MODIFIED_SERVICE: ALERT_MODIFIED_SERVICE,
  GENERAL: ALERT_GENERAL,
  EMPTY_DESCRIPTION: ALERT_EMPTY_DESCRIPTION,
  HEADER_ONLY: ALERT_HEADER_ONLY,
  HASH_PREFIX: ALERT_HASH_PREFIX,
};

/** Helper to create an alert response for mocking fetch */
export function createMockAlertResponse(alerts: AlertEntity[]) {
  return {
    entity: alerts,
  };
}

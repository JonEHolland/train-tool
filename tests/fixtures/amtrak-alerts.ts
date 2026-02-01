import type { AmtrakerApiResponse, AmtrakerTrainStatus } from '../../src/hooks/alerts/types';

/**
 * Mock Amtraker API responses for RailPlus trains.
 */

/** Train 516 running on time */
export const TRAIN_516_ON_TIME: AmtrakerTrainStatus = {
  trainNum: '516',
  lat: 47.6062,
  lon: -122.3321,
  heading: 'N',
  velocity: 45,
  schDep: '11:30:00',
  dep: '11:30:00',
  status: 'On Time',
  station: 'SEA',
  stationName: 'Seattle',
  late: 0,
};

/** Train 517 running 20 minutes late */
export const TRAIN_517_DELAYED: AmtrakerTrainStatus = {
  trainNum: '517',
  lat: 47.8107,
  lon: -122.3773,
  heading: 'S',
  velocity: 35,
  schArr: '09:25:00',
  arr: '09:45:00',
  status: 'Late',
  station: 'EVR',
  stationName: 'Everett',
  late: 20,
};

/** Train 518 cancelled */
export const TRAIN_518_CANCELLED: AmtrakerTrainStatus = {
  trainNum: '518',
  lat: 0,
  lon: 0,
  heading: '',
  velocity: 0,
  status: 'Cancelled',
  late: 0,
};

/** Train 519 running slightly late (under threshold) */
export const TRAIN_519_SLIGHT_DELAY: AmtrakerTrainStatus = {
  trainNum: '519',
  lat: 47.6764,
  lon: -122.3835,
  heading: 'N',
  velocity: 40,
  schDep: '16:40:00',
  dep: '16:48:00',
  status: 'On Time',
  station: 'EDM',
  stationName: 'Edmonds',
  late: 8,
};

/**
 * Complete mock API response with all RailPlus trains
 */
export const MOCK_AMTRAKER_RESPONSE: AmtrakerApiResponse = {
  '516': [TRAIN_516_ON_TIME],
  '517': [TRAIN_517_DELAYED],
  '518': [TRAIN_518_CANCELLED],
  '519': [TRAIN_519_SLIGHT_DELAY],
};

/**
 * Mock API response for delayed train only
 */
export const MOCK_DELAYED_TRAIN_RESPONSE: AmtrakerApiResponse = {
  '517': [TRAIN_517_DELAYED],
};

/**
 * Mock API response for cancelled train only
 */
export const MOCK_CANCELLED_TRAIN_RESPONSE: AmtrakerApiResponse = {
  '518': [TRAIN_518_CANCELLED],
};

/**
 * Empty response (train not running today)
 */
export const MOCK_EMPTY_RESPONSE: AmtrakerApiResponse = {};

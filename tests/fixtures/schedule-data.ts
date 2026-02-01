/**
 * Static test schedule data for deterministic testing.
 *
 * This data is designed to work with the TEST_TIMES fixtures:
 * - Calendar covers January 2025 (matching our test dates)
 * - Weekday service runs Mon-Fri
 * - Known train times for predictable countdown values
 *
 * DO NOT use real schedule data in tests - it changes frequently
 * and would make tests flaky.
 */

import type { ScheduleData } from '../../src/types';

export const TEST_SCHEDULE_DATA: ScheduleData = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  calendars: {
    'weekday-service': {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      start_date: '20260101',
      end_date: '20261231',
    },
    // Amtrak service runs weekdays (matching Sounder for test consistency)
    'AMTRAK_daily-service': {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      start_date: '20260101',
      end_date: '20261231',
    },
  },
  calendarDates: {},
  schedule: {
    'n-line': {
      name: 'N Line (Everett - Seattle)',
      routeId: 'SNDR_EV',
      stops: [
        { stopId: 'king-street', name: 'King Street Station' },
        { stopId: 'edmonds', name: 'Edmonds Station' },
        { stopId: 'mukilteo', name: 'Mukilteo Station' },
        { stopId: 'everett', name: 'Everett Station' },
      ],
      directions: {
        '0': {
          name: 'Northbound',
          trips: [
            // Morning northbound trains from King Street
            {
              tripId: 'n-nb-1',
              serviceId: 'weekday-service',
              headsign: 'Everett Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '16:05:00', departure: '16:05:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '16:30:00', departure: '16:30:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '16:45:00', departure: '16:45:00' },
                { stopId: 'everett', name: 'Everett Station', arrival: '17:00:00', departure: '17:00:00' },
              ],
            },
            {
              tripId: 'n-nb-2',
              serviceId: 'weekday-service',
              headsign: 'Everett Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '16:33:00', departure: '16:33:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '16:58:00', departure: '16:58:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '17:13:00', departure: '17:13:00' },
                { stopId: 'everett', name: 'Everett Station', arrival: '17:28:00', departure: '17:28:00' },
              ],
            },
            {
              tripId: 'n-nb-3',
              serviceId: 'weekday-service',
              headsign: 'Everett Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '17:15:00', departure: '17:15:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '17:40:00', departure: '17:40:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '17:55:00', departure: '17:55:00' },
                { stopId: 'everett', name: 'Everett Station', arrival: '18:10:00', departure: '18:10:00' },
              ],
            },
            // Amtrak RailPlus northbound train (runs between Sounder trains)
            {
              tripId: 'AMTRAK_516',
              serviceId: 'AMTRAK_daily-service',
              headsign: 'Everett Station',
              provider: 'amtrak',
              stops: [
                { stopId: 'king-street', name: 'Seattle', arrival: '11:30:00', departure: '11:30:00' },
                { stopId: 'edmonds', name: 'Edmonds', arrival: '11:54:00', departure: '11:56:00' },
                { stopId: 'everett', name: 'Everett Station', arrival: '12:18:00', departure: '12:20:00' },
              ],
            },
          ],
        },
        '1': {
          name: 'Southbound',
          trips: [
            // Morning southbound trains from Everett
            {
              tripId: 'n-sb-1',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'everett', name: 'Everett Station', arrival: '06:00:00', departure: '06:00:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '06:15:00', departure: '06:15:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '06:30:00', departure: '06:30:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '06:55:00', departure: '06:55:00' },
              ],
            },
            {
              tripId: 'n-sb-2',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'everett', name: 'Everett Station', arrival: '07:00:00', departure: '07:00:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '07:15:00', departure: '07:15:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '07:30:00', departure: '07:30:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '07:55:00', departure: '07:55:00' },
              ],
            },
            {
              tripId: 'n-sb-3',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'everett', name: 'Everett Station', arrival: '08:00:00', departure: '08:00:00' },
                { stopId: 'mukilteo', name: 'Mukilteo Station', arrival: '08:15:00', departure: '08:15:00' },
                { stopId: 'edmonds', name: 'Edmonds Station', arrival: '08:30:00', departure: '08:30:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '08:55:00', departure: '08:55:00' },
              ],
            },
            // Amtrak RailPlus southbound train
            {
              tripId: 'AMTRAK_517',
              serviceId: 'AMTRAK_daily-service',
              headsign: 'King Street Station',
              provider: 'amtrak',
              stops: [
                { stopId: 'everett', name: 'Everett Station', arrival: '09:00:00', departure: '09:00:00' },
                { stopId: 'edmonds', name: 'Edmonds', arrival: '09:20:00', departure: '09:22:00' },
                { stopId: 'king-street', name: 'Seattle', arrival: '09:45:00', departure: '09:45:00' },
              ],
            },
          ],
        },
      },
    },
    's-line': {
      name: 'S Line (Seattle - Tacoma/Lakewood)',
      routeId: 'SNDR_TL',
      stops: [
        { stopId: 'king-street', name: 'King Street Station' },
        { stopId: 'tukwila', name: 'Tukwila Station' },
        { stopId: 'kent', name: 'Kent Station' },
        { stopId: 'auburn', name: 'Auburn Station' },
        { stopId: 'sumner', name: 'Sumner Station' },
        { stopId: 'puyallup', name: 'Puyallup Station' },
        { stopId: 'tacoma-dome', name: 'Tacoma Dome Station' },
        { stopId: 'south-tacoma', name: 'South Tacoma Station' },
        { stopId: 'lakewood', name: 'Lakewood Station' },
      ],
      directions: {
        '0': {
          name: 'Southbound',
          trips: [
            // Evening southbound to Tacoma
            {
              tripId: 's-sb-tacoma-1',
              serviceId: 'weekday-service',
              headsign: 'Tacoma Dome Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '17:35:00', departure: '17:35:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '17:50:00', departure: '17:50:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '18:00:00', departure: '18:00:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '18:10:00', departure: '18:10:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '18:20:00', departure: '18:20:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '18:25:00', departure: '18:25:00' },
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '18:35:00', departure: '18:35:00' },
              ],
            },
            {
              tripId: 's-sb-tacoma-2',
              serviceId: 'weekday-service',
              headsign: 'Tacoma Dome Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '18:15:00', departure: '18:15:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '18:30:00', departure: '18:30:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '18:40:00', departure: '18:40:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '18:50:00', departure: '18:50:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '19:00:00', departure: '19:00:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '19:05:00', departure: '19:05:00' },
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '19:15:00', departure: '19:15:00' },
              ],
            },
            // Evening southbound to Lakewood (extends past Tacoma)
            {
              tripId: 's-sb-lakewood-1',
              serviceId: 'weekday-service',
              headsign: 'Lakewood Station',
              stops: [
                { stopId: 'king-street', name: 'King Street Station', arrival: '17:55:00', departure: '17:55:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '18:10:00', departure: '18:10:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '18:20:00', departure: '18:20:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '18:30:00', departure: '18:30:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '18:40:00', departure: '18:40:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '18:45:00', departure: '18:45:00' },
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '18:55:00', departure: '18:55:00' },
                { stopId: 'south-tacoma', name: 'South Tacoma Station', arrival: '19:05:00', departure: '19:05:00' },
                { stopId: 'lakewood', name: 'Lakewood Station', arrival: '19:15:00', departure: '19:15:00' },
              ],
            },
          ],
        },
        '1': {
          name: 'Northbound',
          trips: [
            // Morning northbound from Tacoma
            {
              tripId: 's-nb-1',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '05:30:00', departure: '05:30:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '05:40:00', departure: '05:40:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '05:45:00', departure: '05:45:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '05:55:00', departure: '05:55:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '06:05:00', departure: '06:05:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '06:15:00', departure: '06:15:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '06:30:00', departure: '06:30:00' },
              ],
            },
            {
              tripId: 's-nb-2',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '06:30:00', departure: '06:30:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '06:40:00', departure: '06:40:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '06:45:00', departure: '06:45:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '06:55:00', departure: '06:55:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '07:05:00', departure: '07:05:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '07:15:00', departure: '07:15:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '07:30:00', departure: '07:30:00' },
              ],
            },
            {
              tripId: 's-nb-3',
              serviceId: 'weekday-service',
              headsign: 'King Street Station',
              stops: [
                { stopId: 'tacoma-dome', name: 'Tacoma Dome Station', arrival: '07:30:00', departure: '07:30:00' },
                { stopId: 'puyallup', name: 'Puyallup Station', arrival: '07:40:00', departure: '07:40:00' },
                { stopId: 'sumner', name: 'Sumner Station', arrival: '07:45:00', departure: '07:45:00' },
                { stopId: 'auburn', name: 'Auburn Station', arrival: '07:55:00', departure: '07:55:00' },
                { stopId: 'kent', name: 'Kent Station', arrival: '08:05:00', departure: '08:05:00' },
                { stopId: 'tukwila', name: 'Tukwila Station', arrival: '08:15:00', departure: '08:15:00' },
                { stopId: 'king-street', name: 'King Street Station', arrival: '08:30:00', departure: '08:30:00' },
              ],
            },
          ],
        },
      },
    },
  },
};

/**
 * JSON string version for injecting into Playwright tests
 */
export const TEST_SCHEDULE_DATA_JSON = JSON.stringify(TEST_SCHEDULE_DATA);

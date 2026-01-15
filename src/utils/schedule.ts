import type { ScheduleData, NextTrain, DirectionTrains } from '../types';
import { timeToMinutes, getCurrentMinutes } from './time';
import { extractTrainNumber } from './trainNumber';

const MINUTES_IN_DAY = 24 * 60;

/**
 * Determines which service IDs are active for today based on calendar rules
 * and date exceptions.
 */
export function getActiveServices(data: ScheduleData): Set<string> {
  const today = new Date();
  // Use local date components, not UTC
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`; // YYYYMMDD in local time
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const todayName = dayNames[dayOfWeek];

  const activeServices = new Set<string>();

  // Check regular calendars
  if (data.calendars) {
    for (const [serviceId, calendar] of Object.entries(data.calendars)) {
      // Check if today is within the date range
      if (dateStr >= calendar.start_date && dateStr <= calendar.end_date) {
        // Check if service runs on this day of week
        if (calendar[todayName]) {
          activeServices.add(serviceId);
        }
      }
    }
  }

  // Apply calendar date exceptions
  if (data.calendarDates) {
    for (const [serviceId, exceptions] of Object.entries(data.calendarDates)) {
      for (const exception of exceptions) {
        if (exception.date === dateStr) {
          if (exception.exception_type === '1') {
            // Service added for this date
            activeServices.add(serviceId);
          } else if (exception.exception_type === '2') {
            // Service removed for this date
            activeServices.delete(serviceId);
          }
        }
      }
    }
  }

  return activeServices;
}

/**
 * Gets trains grouped by direction/terminus for a given route and stop.
 * Calculates minutes away and handles day wrapping for tomorrow's trains.
 */
export function getTrainsByDirection(
  data: ScheduleData,
  route: string,
  stopId: string
): DirectionTrains[] {
  const schedule = data.schedule[route];
  if (!schedule) return [];

  const activeServices = getActiveServices(data);
  const nowMinutes = getCurrentMinutes();

  // Group trains by their terminus (headsign)
  const trainsByTerminus = new Map<string, NextTrain[]>();

  for (const direction of Object.values(schedule.directions)) {
    for (const trip of direction.trips) {
      // Skip trips that aren't running today
      if (trip.serviceId && !activeServices.has(trip.serviceId)) continue;

      const stopIndex = trip.stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) continue;

      // Skip if this is the last stop (terminus) - can't board a terminating train
      if (stopIndex === trip.stops.length - 1) continue;

      const stopTime = trip.stops[stopIndex];
      const depMinutes = timeToMinutes(stopTime.departure);

      // Calculate minutes away, wrapping to next day if train already passed today
      let minutesAway: number;
      let isTomorrow = false;

      if (depMinutes >= nowMinutes) {
        // Train departs now or in the future
        minutesAway = depMinutes - nowMinutes;
      } else {
        // Train already passed today, show tomorrow's departure
        minutesAway = (MINUTES_IN_DAY - nowMinutes) + depMinutes;
        isTomorrow = true;
      }

      const terminus = trip.headsign || 'Unknown';
      if (!trainsByTerminus.has(terminus)) {
        trainsByTerminus.set(terminus, []);
      }

      trainsByTerminus.get(terminus)!.push({
        destination: terminus,
        time: stopTime.departure,
        minutesAway,
        isTomorrow,
        trainNumber: extractTrainNumber(trip.tripId)
      });
    }
  }

  // Convert to array and sort
  const result: DirectionTrains[] = [];
  for (const [terminus, trains] of trainsByTerminus) {
    trains.sort((a, b) => a.minutesAway - b.minutesAway);
    result.push({
      directionName: terminus,
      trains: trains.slice(0, 4) // Show up to 4 trains per terminus
    });
  }

  // Sort directions by next train time
  result.sort((a, b) => a.trains[0].minutesAway - b.trains[0].minutesAway);

  return result;
}
